import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractYouTubeContent, extractPodcastContent, detectPlatform, validateUrl } from "./contentExtractor";
import { analyzeContentForLLMExperiments } from "./gemini";
import { insertAnalysisSchema } from "@shared/schema";
import { z } from "zod";
import { AnalysisError, createNoExperimentsError, createInvalidUrlError, createUnsupportedPlatformError } from "./errors";

// Parse pricing information from AI's suggested tier context
function parsePricingFromContext(suggestedContext?: string): {
  isFree: boolean;
  monthlyMin: number;
  monthlyMax: number | undefined;
  priceType: string;
} {
  if (!suggestedContext) {
    return { isFree: false, monthlyMin: 15, monthlyMax: 25, priceType: "usage-based" };
  }

  const contextLower = suggestedContext.toLowerCase();
  
  // Exclude non-permanent free options (trials, freemium without permanent free tier)
  const excludeKeywords = ['free trial', 'trial period', 'demo'];
  const hasExcludedTerm = excludeKeywords.some(keyword => contextLower.includes(keyword));
  
  // Check for genuine free indicators with more precise matching
  const hasFreeKeyword = contextLower.includes('free tier') || 
                        contextLower.includes('free version') ||
                        contextLower.includes('no cost') ||
                        (contextLower.includes('free') && !hasExcludedTerm);
  
  const hasSelfHosted = contextLower.includes('self-hosted') || 
                        contextLower.includes('self hosted');
  
  const hasOpenSource = contextLower.includes('open-source') || 
                        contextLower.includes('open source');
  
  // Check for $0 only when followed by space, slash, or end (not $0.50)
  const hasZeroCost = /\$0(?:[\s\/]|$|[^.\d])/.test(contextLower);
  
  const hasFreeOption = hasFreeKeyword || hasSelfHosted || hasOpenSource || hasZeroCost;
  
  if (hasFreeOption && !hasExcludedTerm) {
    // Extract all price values to see if there are paid options
    const allPrices = contextLower.match(/\$(\d+(?:\.\d+)?)/g) || [];
    const nonZeroPrices = allPrices.filter(price => {
      const value = parseFloat(price.replace('$', ''));
      return value > 0;
    });
    
    if (nonZeroPrices.length > 0) {
      // Has both free and paid options - extract the paid tier info for "optional" pricing
      const costMatch = contextLower.match(/\$(\d+(?:\.\d+)?)\s*-?\s*(\d+(?:\.\d+)?)?/);
      if (costMatch) {
        const minCost = parseFloat(costMatch[1]);
        const maxCost = costMatch[2] ? parseFloat(costMatch[2]) : undefined;
        
        // Skip if this matched the "$0" we already identified as free
        if (minCost === 0) {
          // Look for the next price range
          const allCostMatches = [...contextLower.matchAll(/\$(\d+(?:\.\d+)?)\s*-?\s*(\d+(?:\.\d+)?)?/g)];
          const nonZeroMatch = allCostMatches.find(match => parseFloat(match[1]) > 0);
          
          if (nonZeroMatch) {
            const paidMin = parseFloat(nonZeroMatch[1]);
            const paidMax = nonZeroMatch[2] ? parseFloat(nonZeroMatch[2]) : undefined;
            
            const isHourly = contextLower.includes('/hr') || contextLower.includes('per hour');
            const multiplier = isHourly ? 100 : 1;
            
            return {
              isFree: true,
              monthlyMin: Math.round(paidMin * multiplier),
              monthlyMax: paidMax ? Math.round(paidMax * multiplier) : undefined,
              priceType: isHourly ? "usage-based" : "fixed"
            };
          }
        } else {
          // We have a non-zero price
          const isHourly = contextLower.includes('/hr') || contextLower.includes('per hour');
          const multiplier = isHourly ? 100 : 1;
          
          return {
            isFree: true, // Has free option, showing optional cloud cost
            monthlyMin: Math.round(minCost * multiplier),
            monthlyMax: maxCost ? Math.round(maxCost * multiplier) : undefined,
            priceType: isHourly ? "usage-based" : "fixed"
          };
        }
      }
    }
    
    // Pure free option with no paid tier mentioned
    return { isFree: true, monthlyMin: 0, monthlyMax: undefined, priceType: "free" };
  }
  
  // No free indicators - try to extract pricing
  const costMatch = contextLower.match(/\$(\d+(?:\.\d+)?)\s*-?\s*(\d+(?:\.\d+)?)?/);
  if (costMatch) {
    const minCost = parseFloat(costMatch[1]);
    const maxCost = costMatch[2] ? parseFloat(costMatch[2]) : undefined;
    
    const isHourly = contextLower.includes('/hr') || contextLower.includes('per hour');
    const multiplier = isHourly ? 100 : 1;
    
    return {
      isFree: false,
      monthlyMin: Math.round(minCost * multiplier),
      monthlyMax: maxCost ? Math.round(maxCost * multiplier) : undefined,
      priceType: isHourly ? "usage-based" : "fixed"
    };
  }
  
  // Fallback to generic estimate
  return { isFree: false, monthlyMin: 15, monthlyMax: 25, priceType: "usage-based" };
}

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
        const error = createInvalidUrlError();
        const processingTime = Math.round((Date.now() - startTime) / 1000);
        return res.status(error.statusCode).json({ 
          type: error.type,
          message: error.message,
          details: urlValidation.error || error.details,
          processingTime
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
          summary: latest.summary,
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
        const error = createUnsupportedPlatformError();
        const processingTime = Math.round((Date.now() - startTime) / 1000);
        return res.status(error.statusCode).json({ 
          type: error.type,
          message: error.message,
          details: error.details,
          processingTime
        });
      }

      console.log(`Extracted content: ${contentInfo.title} (${contentInfo.duration})`);

      // Analyze content with Gemini AI
      const aiAnalysis = await analyzeContentForLLMExperiments(
        contentInfo.transcript, 
        contentInfo.title
      );

      console.log(`AI analysis found ${aiAnalysis.experiments.length} experiments and ${aiAnalysis.tools.length} tools`);

      // Check if no experiments were found
      if (aiAnalysis.experiments.length === 0 && aiAnalysis.tools.length === 0) {
        throw createNoExperimentsError();
      }

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
          // Intelligently select pricing tier based on AI suggestion and experiment complexity
          let selectedTier = dbTool.pricingTiers[0]; // Default to first tier
          let tierMatched = false; // Track if we found a match
          const freeTier = dbTool.pricingTiers.find(tier => tier.monthlyMin === 0);
          const suggestedTierText = aiTool.suggestedTier?.toLowerCase() || "";
          
          // Try to match AI's suggested tier with database tiers
          if (suggestedTierText) {
            const matchedTier = dbTool.pricingTiers.find(tier => 
              suggestedTierText.includes(tier.tier.toLowerCase()) ||
              (suggestedTierText.includes('free') && tier.monthlyMin === 0) ||
              (suggestedTierText.includes('self-hosted') && tier.tier.toLowerCase().includes('self-hosted')) ||
              (suggestedTierText.includes('starter') && tier.tier.toLowerCase().includes('starter')) ||
              (suggestedTierText.includes('pro') && tier.tier.toLowerCase().includes('pro')) ||
              (suggestedTierText.includes('cloud') && tier.tier.toLowerCase().includes('cloud'))
            );
            if (matchedTier) {
              selectedTier = matchedTier;
              tierMatched = true;
            }
          }
          
          // Fallback: if no match was found, choose based on experiment complexity
          if (!tierMatched && !suggestedTierText) {
            const avgComplexity = aiAnalysis.experiments.length > 0 
              ? aiAnalysis.experiments[0].complexity 
              : "Medium";
            
            if (avgComplexity === "Low" && freeTier) {
              selectedTier = freeTier;
            } else if (avgComplexity === "High") {
              // Choose highest tier for high complexity
              selectedTier = dbTool.pricingTiers[dbTool.pricingTiers.length - 1];
            } else {
              // Medium complexity: choose middle or paid tier
              const paidTier = dbTool.pricingTiers.find(tier => tier.monthlyMin > 0 && tier.monthlyMin < 100);
              selectedTier = paidTier || dbTool.pricingTiers[Math.floor(dbTool.pricingTiers.length / 2)];
            }
          }

          detailedTools.push({
            id: dbTool.id,
            name: dbTool.name,
            category: dbTool.category,
            description: dbTool.description,
            pricing: {
              free: !!freeTier,
              monthlyMin: selectedTier?.monthlyMin,
              monthlyMax: selectedTier?.monthlyMax,
              usage: selectedTier?.usage,
              features: selectedTier?.features || [],
              priceType: selectedTier?.priceType,
              tierName: selectedTier?.tier,
              pricingSource: "database",
              allTiers: dbTool.pricingTiers.map(tier => ({
                tier: tier.tier,
                monthlyMin: tier.monthlyMin,
                monthlyMax: tier.monthlyMax,
                priceType: tier.priceType,
                usage: tier.usage
              }))
            },
            difficulty: dbTool.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
            timeToImplement: dbTool.avgImplementationTime,
            url: dbTool.baseUrl,
            mentioned: aiTool.mentioned,
            suggestedContext: aiTool.suggestedTier
          });

          if (selectedTier?.monthlyMin) {
            totalCost += selectedTier.monthlyMin;
          }
        } else {
          // Use AI tool info as fallback - parse pricing from context
          const parsedPricing = parsePricingFromContext(aiTool.suggestedTier);
          
          detailedTools.push({
            id: aiTool.id,
            name: aiTool.name,
            category: aiTool.category,
            description: aiTool.description,
            pricing: {
              free: parsedPricing.isFree,
              monthlyMin: parsedPricing.monthlyMin,
              monthlyMax: parsedPricing.monthlyMax,
              usage: "AI Estimated",
              features: ["AI-identified tool"],
              priceType: parsedPricing.priceType,
              pricingSource: "ai-estimated"
            },
            difficulty: 'Intermediate' as const,
            timeToImplement: "2-4 hours",
            url: `https://google.com/search?q=${encodeURIComponent(aiTool.name)}`,
            mentioned: aiTool.mentioned,
            suggestedContext: aiTool.suggestedTier
          });
          
          // Only add to total cost if not free
          if (!parsedPricing.isFree) {
            totalCost += parsedPricing.monthlyMin;
          }
        }
      }

      // Use the summary from AI analysis instead of manual calculation
      // The aiAnalysis.summary already contains the proper cost range calculations

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
        summary: aiAnalysis.summary,
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
        summary: aiAnalysis.summary,
        processingTime
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      
      // Handle structured errors
      if (error instanceof AnalysisError) {
        return res.status(error.statusCode).json({ 
          type: error.type,
          message: error.message,
          details: error.details,
          processingTime
        });
      }
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          type: 'invalid-url',
          message: 'Invalid request parameters',
          details: error.errors.map(e => e.message).join(', '),
          processingTime
        });
      }
      
      // Generic error fallback
      res.status(500).json({ 
        type: 'generic',
        message: error instanceof Error ? error.message : 'Analysis failed',
        details: 'An unexpected error occurred. Please try again.',
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
        summary: analysis.summary,
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
        summary: analysis.summary,
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