import { type User, type InsertUser, type Analysis, type InsertAnalysis, type Tool, type InsertTool } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for the content analyzer
export interface IStorage {
  // User methods (kept for compatibility)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis methods
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getAnalysesByUrl(url: string): Promise<Analysis[]>;
  getAllAnalyses(): Promise<Analysis[]>;
  
  // Tool database methods
  createTool(tool: InsertTool): Promise<Tool>;
  getTool(id: string): Promise<Tool | undefined>;
  getAllTools(): Promise<Tool[]>;
  searchTools(category?: string): Promise<Tool[]>;
  updateTool(id: string, updates: Partial<InsertTool>): Promise<Tool | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private analyses: Map<string, Analysis>;
  private tools: Map<string, Tool>;

  constructor() {
    this.users = new Map();
    this.analyses = new Map();
    this.tools = new Map();
    
    // Initialize with some common tools
    this.initializeToolDatabase();
  }

  private async initializeToolDatabase() {
    const commonTools: InsertTool[] = [
      {
        id: "openai-gpt4",
        name: "OpenAI GPT-4",
        category: "Language Model",
        description: "Advanced language model for text generation, analysis, and reasoning tasks",
        baseUrl: "https://openai.com",
        pricingTiers: [
          {
            tier: "ChatGPT Plus",
            monthlyMin: 20,
            monthlyMax: 20,
            priceType: "fixed" as const,
            features: ["GPT-4 access", "Advanced data analysis", "Web browsing", "Custom GPTs"],
            usage: "40 messages per 3 hours"
          },
          {
            tier: "API Usage (GPT-4o)",
            monthlyMin: 0,
            monthlyMax: 500,
            priceType: "per-token" as const,
            features: ["Pay per token", "Higher rate limits", "Programmatic access"],
            usage: "$2.50/1M input tokens, $10/1M output tokens",
            usageUnit: "per 1M tokens"
          },
          {
            tier: "API Usage (GPT-4o Mini)",
            monthlyMin: 0,
            monthlyMax: 100,
            priceType: "per-token" as const,
            features: ["Cost-effective", "Fast responses", "Programmatic access"],
            usage: "$0.15/1M input tokens, $0.60/1M output tokens",
            usageUnit: "per 1M tokens"
          }
        ],
        difficulty: "Beginner",
        avgImplementationTime: "1-2 hours",
        isActive: true
      },
      {
        id: "pinecone",
        name: "Pinecone",
        category: "Vector Database",
        description: "Managed vector database for similarity search and recommendations",
        baseUrl: "https://pinecone.io",
        pricingTiers: [
          {
            tier: "Starter",
            monthlyMin: 0,
            monthlyMax: 0,
            priceType: "free" as const,
            features: ["1 index", "1 project", "Community support"],
            usage: "Free tier with limitations"
          },
          {
            tier: "Standard",
            monthlyMin: 50,
            monthlyMax: 500,
            priceType: "usage-based" as const,
            features: ["Multiple indexes", "Production ready", "Email support"],
            usage: "$50 minimum, then pay-as-you-go"
          },
          {
            tier: "Enterprise",
            monthlyMin: 500,
            monthlyMax: 5000,
            priceType: "usage-based" as const,
            features: ["Advanced features", "Dedicated support", "SLA"],
            usage: "$500 minimum commitment"
          }
        ],
        difficulty: "Intermediate",
        avgImplementationTime: "3-4 hours",
        isActive: true
      },
      {
        id: "langchain",
        name: "LangChain",
        category: "AI Framework",
        description: "Framework for developing applications with language models",
        baseUrl: "https://langchain.com",
        pricingTiers: [
          {
            tier: "Open Source",
            monthlyMin: 0,
            monthlyMax: 0,
            priceType: "free" as const,
            features: ["Core framework", "Community support", "Basic integrations"],
            usage: "Free to use"
          },
          {
            tier: "LangSmith Plus",
            monthlyMin: 39,
            monthlyMax: 390,
            priceType: "usage-based" as const,
            features: ["Debugging tools", "Monitoring", "10k traces/month"],
            usage: "$39/user/month + usage fees",
            usageUnit: "per user"
          }
        ],
        difficulty: "Intermediate",
        avgImplementationTime: "4-6 hours",
        isActive: true
      },
      {
        id: "anthropic-claude",
        name: "Anthropic Claude",
        category: "Language Model",
        description: "AI assistant focused on safety and helpfulness",
        baseUrl: "https://anthropic.com",
        pricingTiers: [
          {
            tier: "Claude Pro",
            monthlyMin: 20,
            monthlyMax: 20,
            priceType: "fixed" as const,
            features: ["5x more usage", "Priority access", "Early features"],
            usage: "Higher message limits"
          },
          {
            tier: "API (Claude 3.5 Sonnet)",
            monthlyMin: 0,
            monthlyMax: 800,
            priceType: "per-token" as const,
            features: ["Best performance/cost ratio", "Long context", "Reasoning"],
            usage: "$3/1M input tokens, $15/1M output tokens",
            usageUnit: "per 1M tokens"
          },
          {
            tier: "API (Claude 3.5 Haiku)",
            monthlyMin: 0,
            monthlyMax: 200,
            priceType: "per-token" as const,
            features: ["Fastest responses", "Cost-effective", "Good for simple tasks"],
            usage: "$0.80/1M input tokens, $4/1M output tokens",
            usageUnit: "per 1M tokens"
          }
        ],
        difficulty: "Beginner",
        avgImplementationTime: "1-2 hours",
        isActive: true
      },
      {
        id: "replicate",
        name: "Replicate",
        category: "AI Platform",
        description: "Run and fine-tune open-source AI models via API",
        baseUrl: "https://replicate.com",
        pricingTiers: [
          {
            tier: "Pay per use",
            monthlyMin: 0,
            monthlyMax: 200,
            priceType: "usage-based" as const,
            features: ["Thousands of models", "GPU infrastructure", "API access"],
            usage: "$0.0002-$0.01 per second depending on model"
          }
        ],
        difficulty: "Beginner",
        avgImplementationTime: "2-3 hours",
        isActive: true
      },
      {
        id: "huggingface",
        name: "Hugging Face",
        category: "AI Platform",
        description: "Platform for machine learning models and datasets",
        baseUrl: "https://huggingface.co",
        pricingTiers: [
          {
            tier: "Free",
            monthlyMin: 0,
            monthlyMax: 0,
            priceType: "free" as const,
            features: ["Public repositories", "Inference API", "Community"],
            usage: "Rate limited"
          },
          {
            tier: "Pro",
            monthlyMin: 9,
            monthlyMax: 90,
            priceType: "usage-based" as const,
            features: ["Private repositories", "Higher limits", "Early access"],
            usage: "Enhanced features",
            usageUnit: "per user"
          }
        ],
        difficulty: "Intermediate",
        avgImplementationTime: "2-4 hours",
        isActive: true
      }
    ];

    for (const tool of commonTools) {
      await this.createTool(tool);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Analysis methods
  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = randomUUID();
    const analysis: Analysis = { 
      ...insertAnalysis,
      duration: insertAnalysis.duration || null,
      transcript: insertAnalysis.transcript || null,
      experiments: insertAnalysis.experiments as any,
      tools: insertAnalysis.tools as any,
      id,
      createdAt: new Date()
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAnalysesByUrl(url: string): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).filter(
      analysis => analysis.url === url
    );
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Tool methods
  async createTool(insertTool: InsertTool): Promise<Tool> {
    const tool: Tool = { 
      ...insertTool,
      isActive: insertTool.isActive ?? true,
      pricingTiers: insertTool.pricingTiers as any,
      updatedAt: new Date(),
      pricingUpdatedAt: new Date()
    };
    this.tools.set(tool.id, tool);
    return tool;
  }

  async getTool(id: string): Promise<Tool | undefined> {
    return this.tools.get(id);
  }

  async getAllTools(): Promise<Tool[]> {
    return Array.from(this.tools.values()).filter(tool => tool.isActive);
  }

  async searchTools(category?: string): Promise<Tool[]> {
    const allTools = await this.getAllTools();
    if (!category) return allTools;
    
    return allTools.filter(tool => 
      tool.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  async updateTool(id: string, updates: Partial<InsertTool>): Promise<Tool | undefined> {
    const tool = this.tools.get(id);
    if (!tool) return undefined;
    
    const updatedTool: Tool = {
      ...tool,
      ...updates,
      pricingTiers: (updates.pricingTiers || tool.pricingTiers) as any,
      updatedAt: new Date(),
      pricingUpdatedAt: new Date()
    };
    this.tools.set(id, updatedTool);
    return updatedTool;
  }
}

export const storage = new MemStorage();