import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import InputForm from "@/components/InputForm";
import LoadingState from "@/components/LoadingState";
import AnalysisResults, { type AnalysisData } from "@/components/AnalysisResults";
import ErrorState, { type ErrorType } from "@/components/ErrorState";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyzeContent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowRight, TrendingUp, Zap, DollarSign } from "lucide-react";

type AppState = 'input' | 'loading' | 'results' | 'error';

interface ErrorData {
  type: ErrorType;
  message: string;
  details?: string;
}

// Try Example Section Component
function TryExampleSection() {
  const { data: randomAnalysis, isLoading } = useQuery<{
    id: string;
    title: string;
    platform: string;
    experimentsCount: number;
    toolsCount: number;
    summary: any;
  }>({
    queryKey: ["/api/analyses/random"],
    retry: false,
    staleTime: 60000, // Cache for 1 minute
  });

  if (isLoading || !randomAnalysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-center"
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary/20 to-emerald-500/20 rounded-2xl">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">New here? Try an example!</h3>
              <p className="text-muted-foreground mb-4">
                See how we analyze real AI tutorials and break down their costs
              </p>
            </div>
            <Link href={`/analysis/${randomAnalysis.id}`}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="gap-2" data-testid="button-try-example">
                  <Zap className="h-4 w-4" />
                  View Example Analysis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
            <p className="text-xs text-muted-foreground mt-2">
              {randomAnalysis.title} • {randomAnalysis.experimentsCount} experiments • {randomAnalysis.toolsCount} tools
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Suggested Videos Carousel Component
function SuggestedVideosCarousel() {
  const { data: analyses, isLoading } = useQuery<Array<{
    id: string;
    title: string;
    platform: string;
    experimentsCount: number;
    toolsCount: number;
    summary: {
      totalCostMin: number;
      totalCostMax: number;
      difficultyLevel: string;
    };
    tags?: string[];
  }>>({
    queryKey: ["/api/analyses?limit=4"],
    retry: false,
  });

  if (isLoading || !analyses || analyses.length === 0) return null;

  const displayAnalyses = analyses.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Recently Analyzed
        </h3>
        <p className="text-muted-foreground">
          Explore real AI tutorials others have analyzed
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayAnalyses.map((analysis, index) => (
          <motion.div
            key={analysis.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <Link href={`/analysis/${analysis.id}`}>
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover-elevate transition-all cursor-pointer h-full" data-testid={`card-suggested-${analysis.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2 flex-1">
                      {analysis.title}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {analysis.platform}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>{analysis.experimentsCount} exp</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span>{analysis.toolsCount} tools</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <DollarSign className="h-4 w-4" />
                      <span>${analysis.summary.totalCostMin}-${analysis.summary.totalCostMax}/mo</span>
                    </div>
                  </div>
                  {analysis.tags && analysis.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {analysis.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
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
          <div className="max-w-4xl mx-auto space-y-12">
            <InputForm onAnalyze={handleAnalyze} />
            
            {/* Try Example & Suggested Videos */}
            <TryExampleSection />
            <SuggestedVideosCarousel />
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