import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractYouTubeContent, extractPodcastContent, detectPlatform, validateUrl } from "./contentExtractor";
import { analyzeContentForLLMExperiments, QuotaExceededError } from "./gemini";
import { insertAnalysisSchema, insertFeedbackSchema } from "@shared/schema";
import { z } from "zod";
import { AnalysisError, createNoExperimentsError, createInvalidUrlError, createUnsupportedPlatformError } from "./errors";
import { createHmac } from "crypto";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import "express-session"; // Import for type augmentation
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

// Hash session ID for privacy (HMAC-SHA256)
function hashSessionId(sessionId: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required for session hashing');
  }
  return createHmac('sha256', secret).update(sessionId).digest('hex');
}

// Normalize difficulty level to consistent values
function normalizeDifficultyLevel(level: string): 'Easy' | 'Intermediate' | 'Advanced' | 'Not AI' {
  const normalized = level.toLowerCase().trim();
  
  // N/A or not applicable - content is not an AI experiment
  if (normalized.includes('n/a') || 
      normalized.includes('not applicable') || 
      normalized.includes('foundational') ||
      normalized.includes('no experiments')) {
    return 'Not AI';
  }
  
  // Easy/Beginner level
  if (normalized.includes('beginner') || 
      normalized.includes('easy') || 
      normalized.includes('low') ||
      normalized.includes('basic') ||
      normalized.includes('simple')) {
    return 'Easy';
  }
  
  // Intermediate/Medium level
  if (normalized.includes('intermediate') || 
      normalized.includes('medium') || 
      normalized.includes('moderate')) {
    return 'Intermediate';
  }
  
  // Advanced/High level
  if (normalized.includes('advanced') || 
      normalized.includes('high') || 
      normalized.includes('complex') ||
      normalized.includes('expert')) {
    return 'Advanced';
  }
  
  // Default to Intermediate if unrecognized
  return 'Intermediate';
}

// Estimate infrastructure costs for self-hosted tools
function estimateInfrastructureCosts(tools: Array<{ 
  name: string; 
  category: string; 
  pricing: { free: boolean; monthlyMin?: number; priceType?: string; pricingSource?: string };
  deploymentType?: string;
}>): {
  min: number;
  max: number;
  breakdown: Array<{
    toolName: string;
    component: string;
    description: string;
    costMin: number;
    costMax: number;
  }>;
} {
  let min = 0;
  let max = 0;
  const breakdown: Array<{
    toolName: string;
    component: string;
    description: string;
    costMin: number;
    costMax: number;
  }> = [];

  for (const tool of tools) {
    const nameLower = tool.name.toLowerCase();
    const categoryLower = tool.category.toLowerCase();
    const deploymentType = tool.deploymentType || 'unknown';
    
    // Skip if it's cloud or API-only (no infrastructure needed)
    if (deploymentType === 'api-only' || deploymentType === 'cloud') {
      continue;
    }
    
    // GPU-hosted LLMs (Llama2, Mistral, etc.) - only for self-hosted
    if ((deploymentType === 'self-hosted' || deploymentType === 'hybrid') &&
        (nameLower.includes('llama') || nameLower.includes('mistral') || nameLower.includes('falcon') || 
         categoryLower.includes('llm'))) {
      // Self-hosted LLM on GPU: $120-600/mo for cloud GPU
      const costMin = 120;
      const costMax = 600;
      min += costMin;
      max += costMax;
      breakdown.push({
        toolName: tool.name,
        component: 'GPU Compute',
        description: 'Cloud GPU instance for hosting self-hosted LLM (e.g., AWS g4dn.xlarge or equivalent)',
        costMin,
        costMax
      });
    }
    // Vector databases - self-hosted only
    else if ((deploymentType === 'self-hosted' || deploymentType === 'hybrid') &&
             (categoryLower.includes('vector') || categoryLower.includes('database'))) {
      // Self-hosted vector DB: $20-80/mo for compute + storage
      const costMin = 20;
      const costMax = 80;
      min += costMin;
      max += costMax;
      breakdown.push({
        toolName: tool.name,
        component: 'Vector DB Hosting',
        description: 'Compute and storage for self-hosted vector database',
        costMin,
        costMax
      });
    }
    // Automation/workflow tools - self-hosted
    else if ((deploymentType === 'self-hosted' || deploymentType === 'hybrid') &&
             (categoryLower.includes('automation') || categoryLower.includes('workflow'))) {
      // Self-hosted automation: $10-50/mo for compute
      const costMin = 10;
      const costMax = 50;
      min += costMin;
      max += costMax;
      breakdown.push({
        toolName: tool.name,
        component: 'Automation Server',
        description: 'Server instance for self-hosted automation/workflow tool',
        costMin,
        costMax
      });
    }
  }

  return { min, max, breakdown };
}

// Classify overall cost into categories for quick user understanding
function getCostClassification(
  overallCostMin: number, 
  overallCostMax: number, 
  hasFreeOption: boolean
): {
  class: 'Free' | 'Low' | 'Medium' | 'High';
  label: string;
} {
  // If there's a genuine free option and max cost is 0, it's truly free
  if (hasFreeOption && overallCostMax === 0) {
    return { class: 'Free', label: 'Free to reproduce' };
  }
  
  // Mixed scenario: free option with optional paid
  if (hasFreeOption && overallCostMax > 0) {
    if (overallCostMax <= 100) {
      return { class: 'Free', label: 'Free (optional paid: Low)' };
    } else if (overallCostMax <= 500) {
      return { class: 'Free', label: 'Free (optional paid: Medium)' };
    } else {
      return { class: 'Free', label: 'Free (optional paid: High)' };
    }
  }
  
  // Pure paid tiers - classify by cost range
  if (overallCostMax <= 100) {
    return { class: 'Low', label: 'Low cost to reproduce' };
  } else if (overallCostMax <= 500) {
    return { class: 'Medium', label: 'Medium cost to reproduce' };
  } else {
    return { class: 'High', label: 'High cost to reproduce' };
  }
}

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
          const allCostMatches = Array.from(contextLower.matchAll(/\$(\d+(?:\.\d+)?)\s*-?\s*(\d+(?:\.\d+)?)?/g));
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
  // Setup authentication (BEFORE registering other routes)
  await setupAuth(app);
  registerAuthRoutes(app);
  
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
      
      // Extract user's API key from header (optional - will fall back to server key)
      const userApiKey = req.headers['x-gemini-api-key'] as string | undefined;
      
      // If no user API key provided, require authentication to use server's key
      if (!userApiKey) {
        const user = req.user as any;
        const isUserAuthenticated = req.isAuthenticated?.() && user?.claims?.sub;
        
        // Also check token expiry to prevent stale sessions
        const now = Math.floor(Date.now() / 1000);
        const isTokenValid = user?.expires_at && now <= user.expires_at;
        
        if (!isUserAuthenticated || !isTokenValid) {
          const processingTime = Math.round((Date.now() - startTime) / 1000);
          return res.status(401).json({
            type: 'authentication_required',
            message: 'Sign in required',
            details: 'Please sign in with Google to analyze videos, or add your own Gemini API key in Settings.',
            processingTime
          });
        }
      }
      
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
        
        // Increment view count for cached analysis
        const updated = await storage.incrementViewCount(latest.id);
        
        // If this is the first time this session is viewing this analysis and it doesn't have a session hash, add it
        const sessionHash = req.sessionID ? hashSessionId(req.sessionID) : null;
        if (sessionHash && !latest.sessionHash) {
          await storage.updateAnalysisMetadata(latest.id, { });
          // Note: We don't overwrite the original creator's session hash
        }
        
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
          processingTime: latest.processingTime,
          viewCount: updated?.viewCount || latest.viewCount,
          lastViewedAt: updated?.lastViewedAt || latest.lastViewedAt
        });
      }

      // Extract content based on platform
      const platform = detectPlatform(url);
      let contentInfo;

      if (platform === 'YouTube') {
        contentInfo = await extractYouTubeContent(url, userApiKey);
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
        contentInfo.title,
        userApiKey
      );

      // Ensure experiments and tools arrays exist
      const experiments = aiAnalysis.experiments || [];
      const tools = aiAnalysis.tools || [];
      
      console.log(`AI analysis found ${experiments.length} experiments and ${tools.length} tools`);

      // Check if no experiments were found
      if (experiments.length === 0 && tools.length === 0) {
        throw createNoExperimentsError();
      }

      // Get detailed tool information from our database
      const allTools = await storage.getAllTools();
      const detailedTools = [];
      let totalCost = 0;

      for (const aiTool of tools) {
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
            const avgComplexity = experiments.length > 0 
              ? experiments[0].complexity 
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
            suggestedContext: aiTool.suggestedTier,
            deploymentType: aiTool.deploymentType,
            confidence: aiTool.confidence
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
            suggestedContext: aiTool.suggestedTier,
            deploymentType: aiTool.deploymentType,
            confidence: aiTool.confidence
          });
          
          // Only add to total cost if not free
          if (!parsedPricing.isFree) {
            totalCost += parsedPricing.monthlyMin;
          }
        }
      }

      // DETERMINISTIC COST CALCULATION (backend math, not AI estimates)
      
      // Build tool pricing map for quick lookup
      const toolPricingMap = new Map();
      for (const tool of detailedTools) {
        toolPricingMap.set(tool.id, {
          monthlyMin: tool.pricing.monthlyMin || 0,
          monthlyMax: tool.pricing.monthlyMax || tool.pricing.monthlyMin || 0,
          free: tool.pricing.free
        });
      }
      
      // Calculate costs for each experiment by summing required tools
      const experimentsWithCosts = experiments.map(exp => {
        let expCostMin = 0;
        let expCostMax = 0;
        
        for (const toolId of exp.tools) {
          const toolPrice = toolPricingMap.get(toolId);
          if (toolPrice) {
            expCostMin += toolPrice.monthlyMin;
            expCostMax += toolPrice.monthlyMax;
          }
        }
        
        return {
          ...exp,
          estimatedCostMin: expCostMin,
          estimatedCostMax: expCostMax
        };
      });
      
      // Calculate tool subscription costs (sum across all unique tools)
      let toolSubscriptionMin = 0;
      let toolSubscriptionMax = 0;
      
      for (const tool of detailedTools) {
        toolSubscriptionMin += tool.pricing.monthlyMin || 0;
        toolSubscriptionMax += tool.pricing.monthlyMax || tool.pricing.monthlyMin || 0;
      }
      
      // Estimate infrastructure costs for self-hosted tools
      const infrastructureCosts = estimateInfrastructureCosts(detailedTools);
      
      // Calculate total costs
      const totalCostMin = toolSubscriptionMin + infrastructureCosts.min;
      const totalCostMax = toolSubscriptionMax + infrastructureCosts.max;
      
      // Determine if any tool has a free option
      const hasFreeToolOption = detailedTools.some(tool => tool.pricing.free);
      
      // Add cost classification based on total cost
      const costClassification = getCostClassification(
        totalCostMin,
        totalCostMax,
        hasFreeToolOption
      );
      
      const enhancedSummary = {
        ...aiAnalysis.summary,
        toolSubscriptionCostMin: toolSubscriptionMin,
        toolSubscriptionCostMax: toolSubscriptionMax,
        infrastructureCostMin: infrastructureCosts.min,
        infrastructureCostMax: infrastructureCosts.max,
        infrastructureBreakdown: infrastructureCosts.breakdown,
        totalCostMin,
        totalCostMax,
        costClassification: costClassification.class,
        costClassificationLabel: costClassification.label
      };

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      // Save analysis to storage
      const sessionHash = req.sessionID ? hashSessionId(req.sessionID) : null;
      const analysisData = {
        url,
        title: contentInfo.title,
        platform: contentInfo.platform,
        duration: contentInfo.duration,
        transcript: contentInfo.transcript,
        transcriptSource: contentInfo.transcriptSource,
        sessionHash,
        experiments: experimentsWithCosts,
        tools: detailedTools,
        summary: enhancedSummary,
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
          url,
          transcriptSource: contentInfo.transcriptSource
        },
        experiments: experimentsWithCosts,
        tools: detailedTools,
        summary: enhancedSummary,
        processingTime
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      
      // Handle quota exceeded errors with user-friendly message
      if (error instanceof QuotaExceededError) {
        return res.status(429).json({
          type: 'quota-exceeded',
          message: 'Service temporarily busy',
          details: 'Too many requests are being processed. Please wait a moment and try again.',
          processingTime
        });
      }
      
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
      const currentSessionHash = req.sessionID ? hashSessionId(req.sessionID) : null;
      
      res.json(analyses.map(analysis => ({
        id: analysis.id,
        title: analysis.title,
        label: analysis.label,
        platform: analysis.platform,
        url: analysis.url,
        experimentsCount: analysis.experiments.length,
        toolsCount: analysis.tools.length,
        summary: {
          ...analysis.summary,
          difficultyLevel: normalizeDifficultyLevel(analysis.summary.difficultyLevel)
        },
        viewCount: analysis.viewCount,
        lastViewedAt: analysis.lastViewedAt,
        tags: analysis.tags,
        isFavorite: analysis.isFavorite,
        notes: analysis.notes,
        isOwnedByCurrentSession: analysis.sessionHash === currentSessionHash,
        createdAt: analysis.createdAt
      })));
    } catch (error) {
      console.error('Failed to get analyses:', error);
      res.status(500).json({ error: 'Failed to retrieve analyses' });
    }
  });

  // GET /api/analyses/random - Get a random analysis for "Try Example"
  // IMPORTANT: This must come BEFORE /api/analyses/:id to avoid route conflict
  app.get("/api/analyses/random", async (req, res) => {
    try {
      const allAnalyses = await storage.getAllAnalyses();
      
      if (allAnalyses.length === 0) {
        return res.status(404).json({ error: 'No analyses available' });
      }

      // Get a random analysis
      const randomAnalysis = allAnalyses[Math.floor(Math.random() * allAnalyses.length)];

      res.json({
        id: randomAnalysis.id,
        title: randomAnalysis.title,
        platform: randomAnalysis.platform,
        experimentsCount: randomAnalysis.experiments.length,
        toolsCount: randomAnalysis.tools.length,
        summary: randomAnalysis.summary
      });
    } catch (error) {
      console.error('Failed to get random analysis:', error);
      res.status(500).json({ error: 'Failed to retrieve random analysis' });
    }
  });

  // GET /api/analyses/:id - Get specific analysis and increment view count
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      // Increment view count first
      const analysis = await storage.incrementViewCount(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      const currentSessionHash = req.sessionID ? hashSessionId(req.sessionID) : null;

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
        viewCount: analysis.viewCount,
        lastViewedAt: analysis.lastViewedAt,
        label: analysis.label,
        tags: analysis.tags,
        isFavorite: analysis.isFavorite,
        notes: analysis.notes,
        isOwnedByCurrentSession: analysis.sessionHash === currentSessionHash,
        createdAt: analysis.createdAt
      });
    } catch (error) {
      console.error('Failed to get analysis:', error);
      res.status(500).json({ error: 'Failed to retrieve analysis' });
    }
  });

  // PATCH /api/analyses/:id - Update analysis metadata
  app.patch("/api/analyses/:id", async (req, res) => {
    try {
      const { label, tags, isFavorite, notes } = req.body;
      
      const updated = await storage.updateAnalysisMetadata(req.params.id, {
        label,
        tags,
        isFavorite,
        notes
      });
      
      if (!updated) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      
      res.json({
        id: updated.id,
        label: updated.label,
        tags: updated.tags,
        isFavorite: updated.isFavorite,
        notes: updated.notes
      });
    } catch (error) {
      console.error('Failed to update analysis metadata:', error);
      res.status(500).json({ error: 'Failed to update analysis metadata' });
    }
  });

  // POST /api/analyses/:id/share - Generate share ID for analysis
  app.post("/api/analyses/:id/share", async (req, res) => {
    try {
      const analysis = await storage.generateShareId(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      
      res.json({
        shareId: analysis.shareId,
        shareUrl: `${req.protocol}://${req.get('host')}/share/${analysis.shareId}`
      });
    } catch (error) {
      console.error('Failed to generate share ID:', error);
      res.status(500).json({ error: 'Failed to generate share link' });
    }
  });

  // GET /api/share/:shareId - Get analysis by share ID (public route)
  app.get("/api/share/:shareId", async (req, res) => {
    try {
      const analysis = await storage.getAnalysisByShareId(req.params.shareId);
      if (!analysis) {
        return res.status(404).json({ error: 'Shared analysis not found' });
      }

      // Increment view count
      await storage.incrementViewCount(analysis.id);

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
        viewCount: analysis.viewCount,
        label: analysis.label,
        tags: analysis.tags,
        createdAt: analysis.createdAt
      });
    } catch (error) {
      console.error('Failed to get shared analysis:', error);
      res.status(500).json({ error: 'Failed to retrieve shared analysis' });
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

  // POST /api/feedback - Submit feedback on analysis, experiment, or tool
  app.post("/api/feedback", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertFeedbackSchema.parse(req.body);
      
      // Hash session ID for privacy
      const sessionHash = req.sessionID ? hashSessionId(req.sessionID) : undefined;
      
      // Create feedback with session hash
      const feedbackData = {
        ...validatedData,
        sessionHash
      };
      
      const newFeedback = await storage.createFeedback(feedbackData);
      
      res.status(201).json({
        id: newFeedback.id,
        success: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid feedback data', details: error.errors });
      }
      console.error('Failed to create feedback:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  // GET /api/extension/download - Download Chrome extension as zip
  app.get("/api/extension/download", async (req, res) => {
    try {
      const extensionDir = path.resolve(process.cwd(), 'extension');
      const zipPath = path.resolve(process.cwd(), 'content-analyzer-extension.zip');
      
      // Check if extension directory exists
      if (!fs.existsSync(extensionDir)) {
        return res.status(404).json({ error: 'Extension not found' });
      }
      
      // Create zip file (excluding the generator script)
      try {
        execSync(`cd ${extensionDir} && zip -r ${zipPath} manifest.json popup icons scripts -x "*.cjs"`, {
          stdio: 'pipe'
        });
      } catch (zipError) {
        console.error('Failed to create zip:', zipError);
        return res.status(500).json({ error: 'Failed to package extension' });
      }
      
      // Check if zip was created
      if (!fs.existsSync(zipPath)) {
        return res.status(500).json({ error: 'Failed to create extension package' });
      }
      
      // Send the zip file
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="content-analyzer-extension.zip"');
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
      
      // Clean up zip file after sending
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(zipPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    } catch (error) {
      console.error('Failed to download extension:', error);
      res.status(500).json({ error: 'Failed to download extension' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}