import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  experiments: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    tools: string[];
    complexity: "Low" | "Medium" | "High";
    usagePattern: "learning" | "prototype" | "production" | "high-volume";
  }[];
  tools: {
    id: string;
    name: string;
    category: string;
    description: string;
    mentioned: string[];
    suggestedTier?: string;
    deploymentType: "cloud" | "self-hosted" | "hybrid" | "api-only";
    confidence: "high" | "medium" | "low";
  }[];
  summary: {
    totalExperiments: number;
    totalToolsRequired: number;
    implementationTimeEstimate: string;
    difficultyLevel: "Low" | "Medium" | "High";
  };
}

export async function analyzeContentForLLMExperiments(
  transcript: string,
  title: string,
): Promise<AnalysisResult> {
  try {
    const systemPrompt = `You are an expert AI researcher analyzing content to identify LLM experiments and tools mentioned.

═══ CRITICAL: YOUR ROLE ═══
✓ YOU IDENTIFY tools and experiments (qualitative analysis)
✗ YOU DO NOT CALCULATE costs or estimate dollar amounts
✓ YOU PROVIDE tier names and deployment context
✗ BACKEND SYSTEMS handle all mathematical cost calculations

═══ TASK ═══
Analyze transcripts to find:
1. Concrete LLM experiments (skip theoretical discussions)
2. Tools/platforms actually mentioned or demonstrated

═══ EXPERIMENT FIELDS ═══
{
  "id": "exp1",                    // unique: exp1, exp2, etc.
  "title": "RAG Chatbot",          // clear, specific
  "description": "What it does",   // 1-2 sentences
  "timestamp": "12:34",            // format: "MM:SS" or "unknown"
  "tools": ["tool1", "tool2"],     // array of tool IDs
  "complexity": "Medium",          // Low | Medium | High
  "usagePattern": "production"     // learning | prototype | production | high-volume
}

═══ TOOL FIELDS ═══
{
  "id": "tool1",                         // unique: tool1, tool2, etc.
  "name": "OpenAI",                      // official name
  "category": "LLM API",                 // category type
  "description": "GPT API service",      // 1 sentence
  "mentioned": ["in RAG experiment"],    // context where mentioned
  "suggestedTier": "Free tier",          // tier NAME only (no $)
  "deploymentType": "api-only",          // cloud | self-hosted | hybrid | api-only
  "confidence": "high"                   // high | medium | low
}

═══ TIER NAMING REFERENCE (no dollar amounts) ═══
Suggest tier names by usage pattern:
• learning      → "Free tier", "Self-hosted", "Open source"
• prototype     → "Free tier", "Starter plan"
• production    → "Pro plan", "Standard tier"
• high-volume   → "Enterprise", "Usage-based"

Common tier patterns:
• LLM APIs: Free tier, Paid API
• Vector DBs: Free/Self-hosted, Starter, Pro
• Automation: Self-hosted (free), Cloud Starter, Pro
• Frameworks: Open source, Pro features

═══ EXAMPLES ═══
✓ GOOD: "Built RAG chatbot using OpenAI and ChromaDB"
  → Experiment: id="exp1", title="RAG Chatbot", tools=["openai","chromadb"], usagePattern="prototype"
  → OpenAI: deploymentType="api-only", confidence="high", suggestedTier="Free tier"
  → ChromaDB: deploymentType="self-hosted", confidence="high", suggestedTier="Self-hosted"

✓ GOOD: "Used LangChain with Llama2 for document analysis in production"
  → Experiment: id="exp1", title="Document Analyzer", usagePattern="production"
  → LangChain: deploymentType="hybrid", confidence="high"
  → Llama2: deploymentType="self-hosted", confidence="high"

✗ BAD: "Vector databases are interesting" → Skip (theoretical)
✗ BAD: "You could use GPT-4" → Skip (hypothetical)

═══ VALIDATION RULES ═══
• Every experiment.tools ID must match a tool.id
• Timestamps: "MM:SS" or "unknown" only
• Only include explicitly mentioned tools
• confidence="low" if tool is implied but not clearly stated
• deploymentType must match how the tool is actually used

Return valid JSON matching the schema.`;

    const prompt = `Content Title: ${title}

Transcript:
${transcript.slice(0, 15000)} ${transcript.length > 15000 ? "...[truncated]" : ""}

Analyze this content and identify LLM experiments and tools as specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", //"gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            experiments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  timestamp: { type: "string" },
                  tools: { type: "array", items: { type: "string" } },
                  complexity: { type: "string" },
                  usagePattern: { type: "string" },
                },
                required: [
                  "id",
                  "title",
                  "description",
                  "timestamp",
                  "tools",
                  "complexity",
                  "usagePattern",
                ],
              },
            },
            tools: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                  mentioned: { type: "array", items: { type: "string" } },
                  suggestedTier: { type: "string" },
                  deploymentType: { type: "string" },
                  confidence: { type: "string" },
                },
                required: [
                  "id",
                  "name",
                  "category",
                  "description",
                  "mentioned",
                  "deploymentType",
                  "confidence",
                ],
              },
            },
            summary: {
              type: "object",
              properties: {
                totalExperiments: { type: "number" },
                totalToolsRequired: { type: "number" },
                implementationTimeEstimate: { type: "string" },
                difficultyLevel: { type: "string" },
              },
              required: [
                "totalExperiments",
                "totalToolsRequired",
                "implementationTimeEstimate",
                "difficultyLevel",
              ],
            },
          },
          required: ["experiments", "tools", "summary"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    console.log(`Gemini analysis response: ${rawJson?.slice(0, 500)}...`);

    if (rawJson) {
      const data: AnalysisResult = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw new Error(
      `Failed to analyze content: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function extractVideoTitle(url: string): Promise<string> {
  try {
    // Extract video ID from various YouTube URL formats
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    );

    if (!videoIdMatch) {
      return "Unknown Video";
    }

    // For now, return a generic title - in production you'd use YouTube API
    return "Video Content"; // TODO: Integrate with YouTube Data API for real titles
  } catch (error) {
    console.error("Failed to extract video title:", error);
    return "Unknown Video";
  }
}

export async function transcribeVideoWithGemini(videoUrl: string): Promise<string> {
  try {
    console.log('Using Gemini to transcribe video:', videoUrl);
    
    const prompt = `You are a professional transcriptionist. Watch this YouTube video and provide a complete, accurate transcription of all spoken content.

Instructions:
- Transcribe ALL spoken words in the video
- Include speaker changes if there are multiple speakers
- Include relevant non-verbal sounds in brackets like [music] or [applause] only if significant
- Focus on accuracy and completeness
- Do not summarize - provide the full word-for-word transcription
- Format as continuous paragraphs, not timestamps

YouTube Video URL: ${videoUrl}

Provide the complete transcription:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: videoUrl,
                mimeType: "video/*"
              }
            },
            {
              text: prompt
            }
          ]
        }
      ]
    });

    const transcript = response.text;
    
    if (!transcript || transcript.length < 50) {
      throw new Error('Gemini returned insufficient transcription');
    }
    
    console.log(`Gemini transcribed ${transcript.length} characters`);
    return transcript;
  } catch (error) {
    console.error('Gemini video transcription failed:', error);
    throw new Error(`Failed to transcribe video with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
