import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import InputForm from "@/components/InputForm";
import LoadingState from "@/components/LoadingState";
import AnalysisResults, { type AnalysisData } from "@/components/AnalysisResults";
import ErrorState, { type ErrorType } from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyzeContent, AnalysisError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, TrendingUp, Zap, DollarSign } from "lucide-react";

type AppState = 'input' | 'loading' | 'loading-failed' | 'results' | 'error';

interface LoadingFailedData { failedAtStep: number; }
interface ErrorData { type: ErrorType; message: string; details?: string; }

function TryExampleSection() {
  const { data: randomAnalysis, isLoading } = useQuery<{
    id: string; title: string; platform: string; experimentsCount: number; toolsCount: number; summary: any;
  }>({
    queryKey: ["/api/analyses/random"],
    retry: false,
    staleTime: 60000,
  });

  if (isLoading || !randomAnalysis) return null;

  return (
    <div className="text-center animate-fade-up-3" style={{ opacity: 0 }}>
      <Card className="border border-border">
        <CardContent className="p-7">
          <div className="flex flex-col items-center gap-4">
            <p className="section-label">New here?</p>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.25rem",
                fontWeight: 600,
              }}
            >
              Try an example analysis
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm text-center leading-relaxed">
              See how we analyze real AI tutorials and break down their costs
            </p>
            <Link href={`/analysis/${randomAnalysis.id}`}>
              <Button
                size="default"
                style={{
                  borderRadius: "100px",
                  fontSize: "0.82rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
                data-testid="button-try-example"
              >
                View Example
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              {randomAnalysis.title} — {randomAnalysis.experimentsCount} experiments · {randomAnalysis.toolsCount} tools
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SuggestedVideosCarousel() {
  const { data: analyses, isLoading } = useQuery<Array<{
    id: string; title: string; platform: string; experimentsCount: number; toolsCount: number;
    summary: { totalCostMin: number; totalCostMax: number; difficultyLevel: string; }; tags?: string[];
  }>>({
    queryKey: ["/api/analyses?limit=4"],
    retry: false,
  });

  if (isLoading || !analyses || analyses.length === 0) return null;

  const displayAnalyses = analyses.slice(0, 4);

  return (
    <div className="animate-fade-up-4" style={{ opacity: 0 }}>
      <div className="mb-6 text-center">
        <p className="section-label mb-2">Community</p>
        <h3
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.5rem",
            fontWeight: 600,
          }}
        >
          Recently Analyzed
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          Explore real AI tutorials others have analyzed
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayAnalyses.map((analysis) => (
          <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
            <Card
              className="border border-border hover-elevate cursor-pointer h-full transition-all"
              data-testid={`card-suggested-${analysis.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <CardTitle
                    className="text-base line-clamp-2 flex-1"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {analysis.title}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="shrink-0"
                    style={{ borderRadius: "100px", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                  >
                    {analysis.platform}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {analysis.experimentsCount} exp
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Zap className="h-3.5 w-3.5" />
                      {analysis.toolsCount} tools
                    </span>
                  </div>
                  <span
                    className="flex items-center gap-1 font-semibold"
                    style={{ color: "hsl(var(--sage))" }}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    ${analysis.summary.totalCostMin}–${analysis.summary.totalCostMax}/mo
                  </span>
                </div>
                {analysis.tags && analysis.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {analysis.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState>('input');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [errorData, setErrorData] = useState<ErrorData | null>(null);
  const [loadingFailedData, setLoadingFailedData] = useState<LoadingFailedData | null>(null);
  const [lastUrl, setLastUrl] = useState<string>('');
  const { toast } = useToast();

  const getFailedStepFromErrorType = (errorType: string): number => {
    switch (errorType) {
      case 'invalid-url': case 'unsupported-platform': return 0;
      case 'transcript-disabled': case 'empty-content': return 1;
      case 'gemini-error': case 'quota-exceeded': case 'api-error': return 2;
      case 'no-experiments': return 3;
      default: return 2;
    }
  };

  const handleAnalyze = async (url: string) => {
    setLastUrl(url);
    setState('loading');
    setErrorData(null);
    setLoadingFailedData(null);

    try {
      const result = await analyzeContent(url);
      const analysisData: AnalysisData = {
        contentInfo: result.contentInfo,
        experiments: result.experiments,
        tools: result.tools,
        summary: result.summary,
        processingTime: result.processingTime,
      };
      setAnalysisId(result.id);
      setAnalysisData(analysisData);
      setState('results');
      toast({
        title: "Analysis Complete",
        description: `Found ${result.experiments.length} experiments and ${result.tools.length} tools`,
      });
    } catch (error: any) {
      if (error instanceof AnalysisError) {
        if (error.type === 'authentication_required') {
          toast({
            title: "Sign in required",
            description: "Sign in with Google to analyze videos, or add your own API key in Settings.",
            variant: "destructive",
          });
          setState('input');
          return;
        }
        const errorType = error.type as ErrorType;
        const failedStep = getFailedStepFromErrorType(errorType);
        setErrorData({ type: errorType, message: error.message, details: error.details });
        setLoadingFailedData({ failedAtStep: failedStep });
        setState('loading-failed');
        setTimeout(() => setState('error'), 1500);
        if (error.type === 'generic' || error.type === 'api-error') {
          toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : "An error occurred during analysis";
        setErrorData({ type: 'generic' as ErrorType, message: errorMessage });
        setLoadingFailedData({ failedAtStep: 2 });
        setState('loading-failed');
        setTimeout(() => setState('error'), 1500);
        toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
      }
    }
  };

  const handleRetry = () => { if (lastUrl) handleAnalyze(lastUrl); };
  const handleNewAnalysis = () => {
    setState('input');
    setAnalysisData(null);
    setAnalysisId(null);
    setErrorData(null);
    setLastUrl('');
  };

  return (
    <div className="min-h-screen bg-background pt-[58px]">
      <Header />

      <main className="py-14">
        {state === 'input' && (
          <div className="editorial-container mx-auto space-y-14">
            <InputForm onAnalyze={handleAnalyze} />
            <TryExampleSection />
            <SuggestedVideosCarousel />
          </div>
        )}

        {state === 'loading' && (
          <div className="editorial-container mx-auto">
            <LoadingState />
          </div>
        )}

        {state === 'loading-failed' && loadingFailedData && (
          <div className="editorial-container mx-auto">
            <LoadingState hasFailed failedAtStep={loadingFailedData.failedAtStep} />
          </div>
        )}

        {state === 'results' && analysisData && (
          <AnalysisResults
            data={analysisData}
            onNewAnalysis={handleNewAnalysis}
            analysisId={analysisId || undefined}
          />
        )}

        {state === 'error' && errorData && (
          <div className="editorial-container mx-auto">
            <ErrorState
              errorType={errorData.type}
              message={errorData.message}
              onRetry={lastUrl ? handleRetry : undefined}
              onNewAnalysis={handleNewAnalysis}
            />
          </div>
        )}
      </main>
    </div>
  );
}
