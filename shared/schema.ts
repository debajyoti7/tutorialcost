import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Analysis results table to store processed content
export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  title: text("title").notNull(),
  platform: text("platform").notNull(), // 'YouTube' | 'Podcast'
  duration: text("duration"),
  transcript: text("transcript"),
  experiments: jsonb("experiments").notNull().$type<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    tools: string[];
    estimatedCostMin: number;
    estimatedCostMax: number;
    complexity: 'Low' | 'Medium' | 'High';
  }[]>(),
  tools: jsonb("tools").notNull().$type<{
    id: string;
    name: string;
    category: string;
    description: string;
    pricing: {
      free: boolean;
      monthlyMin?: number;
      monthlyMax?: number;
      usage?: string;
      features: string[];
    };
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    timeToImplement: string;
    url: string;
    mentioned: string[];
  }[]>(),
  summary: jsonb("summary").notNull().$type<{
    totalExperiments: number;
    totalToolsRequired: number;
    overallCostRangeMin: number;
    overallCostRangeMax: number;
    implementationTimeEstimate: string;
    difficultyLevel: 'Low' | 'Medium' | 'High';
  }>(),
  processingTime: integer("processing_time").notNull(), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tool database for reference pricing and information
export const toolDatabase = pgTable("tool_database", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  baseUrl: text("base_url").notNull(),
  pricingTiers: jsonb("pricing_tiers").notNull().$type<{
    tier: string;
    monthlyMin: number;
    monthlyMax?: number;
    features: string[];
    usage?: string;
    priceType: 'fixed' | 'usage-based' | 'per-token' | 'free';
    usageUnit?: string; // e.g., 'per 1M tokens', 'per request'
  }[]>(),
  difficulty: text("difficulty").notNull(), // 'Beginner' | 'Intermediate' | 'Advanced'
  avgImplementationTime: text("avg_implementation_time").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  pricingUpdatedAt: timestamp("pricing_updated_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export const insertToolSchema = createInsertSchema(toolDatabase).omit({
  updatedAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof toolDatabase.$inferSelect;

// Keep original user types for backward compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;