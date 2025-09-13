import { useState } from "react";
import Header from "@/components/Header";
import InputForm from "@/components/InputForm";
import LoadingState from "@/components/LoadingState";
import AnalysisResults, { type AnalysisData } from "@/components/AnalysisResults";
import ThemeToggle from "@/components/ThemeToggle";

type AppState = 'input' | 'loading' | 'results';

export default function Home() {
  const [state, setState] = useState<AppState>('input');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const handleAnalyze = (url: string) => {
    console.log('Starting analysis for:', url);
    setState('loading');
    
    // TODO: Remove mock functionality - replace with real API call
    // Simulate API call with mock data
    setTimeout(() => {
      const mockData: AnalysisData = {
        contentInfo: {
          title: "Building AI Agents with GPT-4 and LangChain",
          duration: "45:32",
          platform: url.includes('youtube') ? "YouTube" : "Podcast",
          url: url
        },
        experiments: [
          {
            id: "exp1",
            title: "Custom RAG System with Vector Database", 
            description: "Building a retrieval-augmented generation system using Pinecone for document search and GPT-4 for responses",
            timestamp: "12:45",
            tools: ["openai", "pinecone", "langchain"],
            estimatedCost: 75,
            complexity: "Medium"
          },
          {
            id: "exp2",
            title: "Automated Content Generation Pipeline",
            description: "Creating a system that generates blog posts from video transcripts using AI summarization and content expansion", 
            timestamp: "28:15",
            tools: ["openai", "anthropic"],
            estimatedCost: 45,
            complexity: "Low"
          }
        ],
        tools: [
          {
            id: "openai",
            name: "OpenAI GPT-4",
            category: "Language Model",
            description: "Advanced language model for text generation, analysis, and reasoning tasks",
            pricing: {
              free: false,
              monthly: 20,
              usage: "Plus subscription + API usage",
              features: [
                "GPT-4 access with 40 messages/3 hours",
                "Advanced data analysis", 
                "Web browsing capabilities",
                "Custom GPT creation"
              ]
            },
            difficulty: "Beginner",
            timeToImplement: "1-2 hours",
            url: "https://openai.com",
            mentioned: ["RAG System", "Content Pipeline"]
          },
          {
            id: "pinecone",
            name: "Pinecone", 
            category: "Vector Database",
            description: "Managed vector database for similarity search and recommendations",
            pricing: {
              free: true,
              monthly: 70,
              usage: "Starter free, Pro $70/mo",
              features: [
                "1M vectors free tier",
                "Real-time updates",
                "Metadata filtering",
                "High availability"
              ]
            },
            difficulty: "Intermediate",
            timeToImplement: "3-4 hours",
            url: "https://pinecone.io",
            mentioned: ["RAG System"]
          },
          {
            id: "langchain",
            name: "LangChain",
            category: "AI Framework", 
            description: "Framework for developing applications with language models",
            pricing: {
              free: true,
              features: [
                "Open source framework",
                "Multiple LLM integrations",
                "Chain composition",
                "Memory management"
              ]
            },
            difficulty: "Intermediate",
            timeToImplement: "4-6 hours", 
            url: "https://langchain.com",
            mentioned: ["RAG System"]
          },
          {
            id: "anthropic",
            name: "Anthropic Claude",
            category: "Language Model",
            description: "AI assistant focused on safety and helpfulness",
            pricing: {
              free: false,
              monthly: 20,
              usage: "Pro subscription + API usage",
              features: [
                "Claude 3 Opus access",
                "100K context window", 
                "Advanced reasoning",
                "Code generation"
              ]
            },
            difficulty: "Beginner",
            timeToImplement: "1-2 hours",
            url: "https://anthropic.com",
            mentioned: ["Content Pipeline"]
          }
        ],
        totalEstimatedCost: 120,
        processingTime: 8.5
      };
      
      setAnalysisData(mockData);
      setState('results');
    }, 12000); // 12 second delay to show loading states
  };

  const handleNewAnalysis = () => {
    setState('input');
    setAnalysisData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="container mx-auto px-4 py-12">
        {state === 'input' && (
          <div className="max-w-4xl mx-auto">
            <InputForm onAnalyze={handleAnalyze} />
          </div>
        )}
        
        {state === 'loading' && (
          <div className="max-w-2xl mx-auto">
            <LoadingState />
          </div>
        )}
        
        {state === 'results' && analysisData && (
          <AnalysisResults 
            data={analysisData} 
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </main>
    </div>
  );
}