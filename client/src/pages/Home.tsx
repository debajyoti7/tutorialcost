import { useState } from "react";
import Header from "@/components/Header";
import InputForm from "@/components/InputForm";
import LoadingState from "@/components/LoadingState";
import AnalysisResults, { type AnalysisData } from "@/components/AnalysisResults";
import ErrorState, { type ErrorType } from "@/components/ErrorState";
import ThemeToggle from "@/components/ThemeToggle";
import { analyzeContent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type AppState = 'input' | 'loading' | 'results' | 'error';

interface ErrorData {
  type: ErrorType;
  message: string;
  details?: string;
}

export default function Home() {
  const [state, setState] = useState<AppState>('input');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [errorData, setErrorData] = useState<ErrorData | null>(null);
  const [lastUrl, setLastUrl] = useState<string>('');
  const { toast } = useToast();

  const handleAnalyze = async (url: string) => {
    console.log('Starting analysis for:', url);
    setLastUrl(url);
    setState('loading');
    setErrorData(null);
    
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
    } catch (error: any) {
      console.error('Analysis failed:', error);
      
      // Extract error information from response
      const errorType = error.response?.data?.type || 'generic';
      const errorMessage = error.response?.data?.message || (error instanceof Error ? error.message : "An error occurred during analysis");
      const errorDetails = error.response?.data?.details;
      
      setErrorData({
        type: errorType as ErrorType,
        message: errorMessage,
        details: errorDetails
      });
      setState('error');
      
      // Only show toast for unexpected errors
      if (errorType === 'generic' || errorType === 'api-error') {
        toast({
          title: "Analysis Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleRetry = () => {
    if (lastUrl) {
      handleAnalyze(lastUrl);
    }
  };

  const handleNewAnalysis = () => {
    setState('input');
    setAnalysisData(null);
    setErrorData(null);
    setLastUrl('');
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
        
        {state === 'error' && errorData && (
          <ErrorState 
            errorType={errorData.type}
            message={errorData.message}
            onRetry={lastUrl ? handleRetry : undefined}
            onNewAnalysis={handleNewAnalysis}
          />
        )}
      </main>
    </div>
  );
}