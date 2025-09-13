import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractYouTubeContent, extractPodcastContent, detectPlatform, validateUrl } from "./contentExtractor";
import { analyzeContentForLLMExperiments } from "./gemini";
import { insertAnalysisSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Validation schemas
  const analyzeRequestSchema = z.object({
    url: z.string().url("Please enter a valid URL")
  });

  // POST /api/analyze - Main content analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validate request
      const { url } = analyzeRequestSchema.parse(req.body);
      
      // Validate URL format and platform
      const urlValidation = validateUrl(url);
      if (!urlValidation.isValid) {
        return res.status(400).json({ 
          error: urlValidation.error || "Invalid URL" 
        });
      }

      console.log(`Starting analysis for URL: ${url}`);

      // Check if we already have analysis for this URL
      const existingAnalyses = await storage.getAnalysesByUrl(url);
      if (existingAnalyses.length > 0) {
        const latest = existingAnalyses[0];
        console.log(`Returning cached analysis for ${url}`);
        return res.json({
          id: latest.id,
          contentInfo: {
            title: latest.title,
            duration: latest.duration,
            platform: latest.platform,
            url: latest.url
          },
          experiments: latest.experiments,
          tools: latest.tools,
          totalEstimatedCost: latest.totalEstimatedCost,
          processingTime: latest.processingTime
        });
      }

      // Extract content based on platform
      const platform = detectPlatform(url);
      let contentInfo;

      if (platform === 'YouTube') {
        contentInfo = await extractYouTubeContent(url);
      } else if (platform === 'Podcast') {
        contentInfo = await extractPodcastContent(url);
      } else {
        return res.status(400).json({ 
          error: "Unsupported platform. Please use YouTube or podcast URLs." 
        });
      }

      console.log(`Extracted content: ${contentInfo.title} (${contentInfo.duration})`);

      // Analyze content with Gemini AI
      const aiAnalysis = await analyzeContentForLLMExperiments(
        contentInfo.transcript, 
        contentInfo.title
      );

      console.log(`AI analysis found ${aiAnalysis.experiments.length} experiments and ${aiAnalysis.tools.length} tools`);

      // Get detailed tool information from our database
      const allTools = await storage.getAllTools();
      const detailedTools = [];
      let totalCost = 0;

      for (const aiTool of aiAnalysis.tools) {
        // Try to match with our tool database
        const dbTool = allTools.find(t => 
          t.name.toLowerCase().includes(aiTool.name.toLowerCase()) ||
          aiTool.name.toLowerCase().includes(t.name.toLowerCase()) ||
          t.id === aiTool.id
        );

        if (dbTool) {
          // Use database tool info with AI context
          const freeTier = dbTool.pricingTiers.find(tier => tier.monthly === 0);
          const paidTier = dbTool.pricingTiers.find(tier => tier.monthly > 0);
          const defaultTier = paidTier || freeTier || dbTool.pricingTiers[0];

          detailedTools.push({
            id: dbTool.id,
            name: dbTool.name,
            category: dbTool.category,
            description: dbTool.description,
            pricing: {
              free: !!freeTier,
              monthly: defaultTier?.monthly,
              usage: defaultTier?.usage,
              features: defaultTier?.features || []
            },
            difficulty: dbTool.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
            timeToImplement: dbTool.avgImplementationTime,
            url: dbTool.baseUrl,
            mentioned: aiTool.mentioned
          });

          if (defaultTier?.monthly) {
            totalCost += defaultTier.monthly;
          }
        } else {
          // Use AI tool info as fallback
          detailedTools.push({
            id: aiTool.id,
            name: aiTool.name,
            category: aiTool.category,
            description: aiTool.description,
            pricing: {
              free: false,
              monthly: 20, // Default estimate
              usage: "Estimated",
              features: ["AI-identified tool"]
            },
            difficulty: 'Intermediate' as const,
            timeToImplement: "2-4 hours",
            url: `https://google.com/search?q=${encodeURIComponent(aiTool.name)}`,
            mentioned: aiTool.mentioned
          });
          totalCost += 20;
        }
      }

      // Calculate total estimated cost from experiments
      const experimentTotalCost = aiAnalysis.experiments.reduce((sum, exp) => sum + exp.estimatedCost, 0);
      const finalTotalCost = Math.max(totalCost, experimentTotalCost);

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      // Save analysis to storage
      const analysisData = {
        url,
        title: contentInfo.title,
        platform: contentInfo.platform,
        duration: contentInfo.duration,
        transcript: contentInfo.transcript,
        experiments: aiAnalysis.experiments,
        tools: detailedTools,
        totalEstimatedCost: finalTotalCost,
        processingTime
      };

      const savedAnalysis = await storage.createAnalysis(analysisData);

      // Return analysis result
      res.json({
        id: savedAnalysis.id,
        contentInfo: {
          title: contentInfo.title,
          duration: contentInfo.duration,
          platform: contentInfo.platform,
          url
        },
        experiments: aiAnalysis.experiments,
        tools: detailedTools,
        totalEstimatedCost: finalTotalCost,
        processingTime
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      
      // Return 400 for client errors (like no transcript available)
      const statusCode = error instanceof Error && 
        (error.message.includes('transcript available') || 
         error.message.includes('not yet supported') ||
         error.message.includes('Invalid URL')) ? 400 : 500;
      
      res.status(statusCode).json({ 
        error: error instanceof Error ? error.message : 'Analysis failed',
        processingTime
      });
    }
  });

  // GET /api/analyses - Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnalyses();
      res.json(analyses.map(analysis => ({
        id: analysis.id,
        title: analysis.title,
        platform: analysis.platform,
        url: analysis.url,
        experimentsCount: analysis.experiments.length,
        toolsCount: analysis.tools.length,
        totalEstimatedCost: analysis.totalEstimatedCost,
        createdAt: analysis.createdAt
      })));
    } catch (error) {
      console.error('Failed to get analyses:', error);
      res.status(500).json({ error: 'Failed to retrieve analyses' });
    }
  });

  // GET /api/analyses/:id - Get specific analysis
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json({
        id: analysis.id,
        contentInfo: {
          title: analysis.title,
          duration: analysis.duration,
          platform: analysis.platform,
          url: analysis.url
        },
        experiments: analysis.experiments,
        tools: analysis.tools,
        totalEstimatedCost: analysis.totalEstimatedCost,
        processingTime: analysis.processingTime,
        createdAt: analysis.createdAt
      });
    } catch (error) {
      console.error('Failed to get analysis:', error);
      res.status(500).json({ error: 'Failed to retrieve analysis' });
    }
  });

  // GET /api/tools - Get all tools in database
  app.get("/api/tools", async (req, res) => {
    try {
      const { category } = req.query;
      const tools = await storage.searchTools(category as string);
      res.json(tools);
    } catch (error) {
      console.error('Failed to get tools:', error);
      res.status(500).json({ error: 'Failed to retrieve tools' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}