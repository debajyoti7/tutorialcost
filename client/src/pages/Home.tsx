import { useState } from "react";
import Header from "@/components/Header";
import InputForm from "@/components/InputForm";
import LoadingState from "@/components/LoadingState";
import AnalysisResults, { type AnalysisData } from "@/components/AnalysisResults";
import ThemeToggle from "@/components/ThemeToggle";
import { analyzeContent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type AppState = 'input' | 'loading' | 'results';

export default function Home() {
  const [state, setState] = useState<AppState>('input');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async (url: string) => {
    console.log('Starting analysis for:', url);
    setState('loading');
    
    try {
      const result = await analyzeContent(url);
      
      // Convert API response to component format
      const analysisData: AnalysisData = {
        contentInfo: result.contentInfo,
        experiments: result.experiments,
        tools: result.tools,
        summary: result.summary,
        processingTime: result.processingTime
      };
      
      setAnalysisData(analysisData);
      setState('results');
      
      toast({
        title: "Analysis Complete",
        description: `Found ${result.experiments.length} experiments and ${result.tools.length} tools`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setState('input');
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive",
      });
    }
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