import AnalysisResults, { type AnalysisData } from '../AnalysisResults';

export default function AnalysisResultsExample() {
  // TODO: Remove mock data - this is for design prototype only
  const mockData: AnalysisData = {
    contentInfo: {
      title: "Building AI Agents with GPT-4 and LangChain",
      duration: "45:32",
      platform: "YouTube",
      url: "https://youtube.com/watch?v=example"
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

  const handleNewAnalysis = () => {
    console.log('Starting new analysis');
  };

  return (
    <div className="p-8 bg-background">
      <AnalysisResults data={mockData} onNewAnalysis={handleNewAnalysis} />
    </div>
  );
}