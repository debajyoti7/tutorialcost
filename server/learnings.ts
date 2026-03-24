import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import type { Feedback, Analysis } from "@shared/schema";

export async function generateAndStoreLearning(
  feedbackRecord: Feedback,
  analysisRecord: Analysis,
  serverGeminiApiKey: string
): Promise<void> {
  try {
    if (!serverGeminiApiKey) {
      console.warn("[learnings] No server Gemini API key available, skipping learning generation");
      return;
    }

    const client = new GoogleGenAI({ apiKey: serverGeminiApiKey });

    const prompt = `You are an AI quality analyst. A user gave negative feedback on an AI analysis.

Analysis Title: ${analysisRecord.title}
Feedback Type: ${feedbackRecord.feedbackType}
User Comment: ${feedbackRecord.comment}

Based on this negative feedback, distil ONE concise, generalizable correction or improvement that should be applied to future analyses. Focus on what the AI should do differently.

Respond with JSON only in this format:
{
  "category": "short category label (e.g. 'Tool Identification', 'Cost Estimation', 'Experiment Relevance')",
  "insight": "A single clear, actionable instruction for the AI to follow in future analyses (1-2 sentences max)"
}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            category: { type: "string" },
            insight: { type: "string" },
          },
          required: ["category", "insight"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      console.warn("[learnings] Empty response from Gemini, skipping learning storage");
      return;
    }

    const parsed = JSON.parse(rawJson) as { category: string; insight: string };

    if (!parsed.category || !parsed.insight) {
      console.warn("[learnings] Invalid learning response structure, skipping");
      return;
    }

    await storage.createLearning({
      feedbackId: feedbackRecord.id,
      analysisId: analysisRecord.id,
      category: parsed.category,
      insight: parsed.insight,
      isActive: true,
    });

    console.log(`[learnings] Generated learning: [${parsed.category}] ${parsed.insight}`);
  } catch (error) {
    console.error("[learnings] Failed to generate or store learning (non-fatal):", error);
  }
}
