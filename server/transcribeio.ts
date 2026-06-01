const BASE_URL = "https://www.usetranscribe.io";
const USER_AGENT = "TutorialCost/1.0";
const STREAM_TIMEOUT_MS = 6 * 60 * 1000; // 6 minutes

export interface TranscribeResult {
  transcript: string;
  source: "usetranscribe.io-cached" | "usetranscribe.io-live";
}

interface CacheCheckResponse {
  cached: boolean;
}

interface TranscriptSegment {
  text: string;
  start?: number;
  end?: number;
}

interface TranscriptJsonResponse {
  segments?: TranscriptSegment[];
  transcript?: string;
  text?: string;
}

async function checkCache(videoId: string): Promise<boolean> {
  const url = `${BASE_URL}/api/check?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Cache check failed: ${response.status}`);
  }

  const data: CacheCheckResponse = await response.json();
  return data.cached === true;
}

async function fetchCachedTranscript(videoId: string): Promise<string> {
  const url = `${BASE_URL}/yt/${videoId}?format=json`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Cached transcript fetch failed: ${response.status}`);
  }

  const data: TranscriptJsonResponse = await response.json();

  if (data.segments && data.segments.length > 0) {
    return data.segments
      .map((s) => s.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (data.transcript) return data.transcript.trim();
  if (data.text) return data.text.trim();

  throw new Error("Cached transcript response contained no usable text");
}

async function fetchLiveTranscript(videoId: string): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const streamUrl = `${BASE_URL}/transcribe?url=${encodeURIComponent(videoUrl)}&summarize=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  try {
    const response = await fetch(streamUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/event-stream",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Transcribe stream request failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body from transcribe stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let transcript = "";
    let gotDone = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;

        if (line.startsWith("data:")) {
          const dataStr = line.slice(5).trim();
          if (!dataStr) continue;

          // Parse the JSON separately so parse errors don't swallow error-event throws
          let parsedEvent: any;
          try {
            parsedEvent = JSON.parse(dataStr);
          } catch {
            if (dataStr === "[DONE]") {
              gotDone = true;
              break;
            }
            continue;
          }

          if (parsedEvent.stage) {
            console.log(`usetranscribe.io stage: ${parsedEvent.stage}`);
          }

          if (parsedEvent.type === "error" || parsedEvent.event === "error") {
            throw new Error(`usetranscribe.io error event: ${parsedEvent.message || JSON.stringify(parsedEvent)}`);
          }

          if (parsedEvent.type === "done" || parsedEvent.event === "done" || parsedEvent.done === true) {
            const possibleTranscript =
              parsedEvent.transcript || parsedEvent.text || parsedEvent.result?.transcript || parsedEvent.result?.text;
            if (possibleTranscript) {
              transcript = possibleTranscript;
            }
            gotDone = true;
            break;
          }

          const possibleTranscript =
            parsedEvent.transcript || parsedEvent.text || parsedEvent.result?.transcript;
          if (possibleTranscript && possibleTranscript.length > transcript.length) {
            transcript = possibleTranscript;
          }
        }

        if (line.startsWith("event:")) {
          const eventName = line.slice(6).trim();
          if (eventName === "done") gotDone = true;
          if (eventName === "error") {
            throw new Error("usetranscribe.io emitted error event");
          }
        }
      }

      if (gotDone) break;
    }

    if (!transcript || transcript.length < 50) {
      throw new Error("usetranscribe.io returned insufficient transcript text");
    }

    return transcript.trim();
  } finally {
    clearTimeout(timeout);
  }
}

export async function transcribeWithUseTranscribeIO(videoId: string): Promise<TranscribeResult> {
  console.log(`usetranscribe.io: checking cache for videoId=${videoId}`);

  const cached = await checkCache(videoId);

  if (cached) {
    console.log(`usetranscribe.io: cache hit, fetching cached transcript`);
    const transcript = await fetchCachedTranscript(videoId);
    console.log(`usetranscribe.io: got cached transcript (${transcript.length} chars)`);
    return { transcript, source: "usetranscribe.io-cached" };
  }

  console.log(`usetranscribe.io: no cache, opening SSE stream`);
  const transcript = await fetchLiveTranscript(videoId);
  console.log(`usetranscribe.io: got live transcript (${transcript.length} chars)`);
  return { transcript, source: "usetranscribe.io-live" };
}
