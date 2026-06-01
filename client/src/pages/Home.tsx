import { useState, useRef } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { analyzeContentStreaming, StreamStep, AnalysisError } from "@/lib/api";
import type { AnalysisResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, TrendingUp, Zap, DollarSign, FileText } from "lucide-react";

type AppState = 'input' | 'streaming' | 'results' | 'error';

interface ErrorData { type: ErrorType; message: string; details?: string; }

type StreamingSteps = {
  transcription?: { source: string; wordCount: number; transcript: string };
  experiments?: AnalysisResponse['experiments'];
  tools?: AnalysisResponse['tools'];
  experimentsWithCosts?: AnalysisResponse['experiments'];
  toolsWithCosts?: AnalysisResponse['tools'];
  summary?: AnalysisResponse['summary'];
  contentInfo?: AnalysisResponse['contentInfo'];
  id?: string;
  currentStep: 'transcription' | 'experiments' | 'tools' | 'costs' | 'summary' | 'done';
};

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
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}>
              Try an example analysis
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm text-center leading-relaxed">
              See how we analyze real AI tutorials and break down their costs
            </p>
            <Link href={`/analysis/${randomAnalysis.id}`}>
              <Button
                size="default"
                style={{ borderRadius: "100px", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
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
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 600 }}>
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
                  <CardTitle className="text-base line-clamp-2 flex-1" style={{ fontFamily: "var(--font-serif)" }}>
                    {analysis.title}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0" style={{ borderRadius: "100px", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
                  <span className="flex items-center gap-1 font-semibold" style={{ color: "hsl(var(--sage))" }}>
                    <DollarSign className="h-3.5 w-3.5" />
                    ${analysis.summary.totalCostMin}–${analysis.summary.totalCostMax}/mo
                  </span>
                </div>
                {analysis.tags && analysis.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {analysis.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
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

// ── Streaming skeleton helpers ─────────────────────────────────────────────

function SummarySkeleton() {
  return (
    <div className="editorial-container mx-auto">
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="p-5 bg-muted rounded-md min-h-[90px] flex flex-col items-center justify-center gap-2">
                <Skeleton className="h-9 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExperimentsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      {[0, 1].map(i => (
        <Card key={i} className="border border-border">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/2 mb-2" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ToolsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-36" />
      {[0, 1].map(i => (
        <Card key={i} className="border border-border">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Streaming results view ─────────────────────────────────────────────────

function StreamingResults({ streaming, onNewAnalysis }: { streaming: StreamingSteps; onNewAnalysis: () => void }) {
  const stepIndex = ['transcription', 'experiments', 'tools', 'costs', 'summary', 'done'].indexOf(streaming.currentStep);
  const isDone = streaming.currentStep === 'done';

  const experiments = streaming.experimentsWithCosts || streaming.experiments;
  const tools = streaming.toolsWithCosts || streaming.tools;

  return (
    <div className="space-y-6">
      {/* Step progress indicator */}
      {!isDone && (
        <div className="editorial-container mx-auto">
          <LoadingState compact currentStreamStep={streaming.currentStep} />
        </div>
      )}

      {/* Transcript section — appears first when transcription arrives */}
      {streaming.transcription && (
        <div className="editorial-container mx-auto animate-fade-up" style={{ opacity: 0 }}>
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-base font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                    Transcript
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                    {streaming.transcription.source === 'usetranscribe.io-cached'
                      ? 'cached'
                      : streaming.transcription.source === 'usetranscribe.io-live'
                      ? 'live'
                      : streaming.transcription.source || 'youtube'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {streaming.transcription.wordCount.toLocaleString()} words
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 font-mono">
                {streaming.transcription.transcript.slice(0, 400)}
                {streaming.transcription.transcript.length > 400 && '…'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary card — skeleton until summary arrives */}
      {streaming.summary && streaming.contentInfo ? (
        <div className="editorial-container mx-auto animate-fade-up" style={{ opacity: 0 }}>
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <div className="text-lg font-semibold leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                  {streaming.contentInfo.title}
                </div>
                <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                  <Badge variant="outline" style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                    {streaming.contentInfo.platform}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center p-5 bg-muted rounded-md min-h-[90px]">
                  <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                    {experiments?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Experiments Found</div>
                </div>
                <div className="flex flex-col items-center justify-center p-5 bg-muted rounded-md min-h-[90px]">
                  <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                    {tools?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Tools Identified</div>
                </div>
                <div className="flex flex-col items-center justify-center p-5 rounded-md min-h-[90px]" style={{ background: "hsl(var(--sage-light))" }}>
                  <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "hsl(var(--sage))" }}>
                    ${streaming.summary.totalCostMin}–${streaming.summary.totalCostMax}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Est. Monthly Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <SummarySkeleton />
      )}

      {/* Experiments + Tools */}
      <div className="editorial-container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Experiments */}
          <div>
            {experiments ? (
              <div className="space-y-4 animate-fade-up-1" style={{ opacity: 0 }}>
                <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                  <Zap className="w-5 h-5" style={{ color: "hsl(var(--amber))" }} />
                  LLM Experiments
                </h2>
                <div className="space-y-4">
                  {experiments.map((experiment) => (
                    <Card key={experiment.id} className="border border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                              {experiment.title}
                            </div>
                          </div>
                          <Badge style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                            {experiment.complexity}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{experiment.description}</div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex items-center justify-between text-sm gap-2 mb-2.5">
                          <span className="text-muted-foreground">@ {experiment.timestamp}</span>
                          {experiment.estimatedCostMin !== undefined ? (
                            <span className="font-semibold whitespace-nowrap" style={{ color: "hsl(var(--sage))" }}>
                              ${experiment.estimatedCostMin}–${experiment.estimatedCostMax}/mo
                            </span>
                          ) : (
                            <Skeleton className="h-4 w-20" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {experiment.tools.map((toolId) => {
                            const tool = tools?.find(t => t.id === toolId);
                            return (
                              <Badge key={toolId} variant="secondary" style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                                {tool?.name || toolId}
                              </Badge>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <ExperimentsSkeleton />
            )}
          </div>

          {/* Tools */}
          <div>
            {tools ? (
              <div className="space-y-4 animate-fade-up-2" style={{ opacity: 0 }}>
                <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                  <TrendingUp className="w-5 h-5" style={{ color: "hsl(var(--sage))" }} />
                  Required Tools
                </h2>
                <div className="space-y-4">
                  {tools.map((tool) => (
                    <Card key={tool.id} className="border border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="text-base font-semibold leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                              {tool.name}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                                {tool.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right min-w-[80px]">
                            {tool.pricing.free ? (
                              <Badge style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Free</Badge>
                            ) : (
                              <span className="font-semibold text-sm whitespace-nowrap">
                                {tool.pricing.monthlyMin && tool.pricing.monthlyMax
                                  ? `$${tool.pricing.monthlyMin}–${tool.pricing.monthlyMax}/mo`
                                  : tool.pricing.monthlyMin
                                  ? `$${tool.pricing.monthlyMin}+/mo`
                                  : 'Contact'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">{tool.description}</div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <ToolsSkeleton />
            )}
          </div>
        </div>
      </div>

      {/* New analysis CTA */}
      {isDone && (
        <div className="editorial-container mx-auto flex justify-center pb-6">
          <Button
            onClick={onNewAnalysis}
            style={{ borderRadius: "100px", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
            data-testid="button-new-analysis"
          >
            Analyze Another Video
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Home component ───────────────────────────────────────────────────

export default function Home() {
  const [state, setState] = useState<AppState>('input');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [errorData, setErrorData] = useState<ErrorData | null>(null);
  const [streamingData, setStreamingData] = useState<StreamingSteps | null>(null);
  const [lastUrl, setLastUrl] = useState<string>('');
  const { toast } = useToast();
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleNewAnalysis = () => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    setState('input');
    setAnalysisData(null);
    setAnalysisId(null);
    setErrorData(null);
    setStreamingData(null);
    setLastUrl('');
  };

  const handleAnalyze = (url: string) => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    setLastUrl(url);
    setState('streaming');
    setErrorData(null);
    setStreamingData({ currentStep: 'transcription' });

    const cleanup = analyzeContentStreaming(url, {
      onStep: (event: StreamStep) => {
        setStreamingData(prev => {
          if (!prev) return prev;

          switch (event.step) {
            case 'transcription':
              return { ...prev, transcription: { source: event.source, wordCount: event.wordCount, transcript: event.transcript }, currentStep: 'transcription' };

            case 'experiments':
              return { ...prev, experiments: event.experiments, currentStep: 'experiments' };

            case 'tools':
              return { ...prev, tools: event.tools, currentStep: 'tools' };

            case 'costs':
              return { ...prev, experimentsWithCosts: event.experiments, toolsWithCosts: event.tools, currentStep: 'costs' };

            case 'summary':
              return {
                ...prev,
                summary: event.summary,
                contentInfo: event.contentInfo,
                id: event.id,
                currentStep: 'summary',
              };

            default:
              return prev;
          }
        });
      },

      onDone: () => {
        setStreamingData(prev => {
          if (!prev) return prev;

          // Transition to full AnalysisResults if we have all data
          if (prev.summary && prev.contentInfo && prev.id) {
            const fullData: AnalysisData = {
              contentInfo: prev.contentInfo as any,
              experiments: prev.experimentsWithCosts || prev.experiments || [],
              tools: prev.toolsWithCosts || prev.tools || [],
              summary: prev.summary,
              processingTime: 0,
            };
            setAnalysisId(prev.id);
            setAnalysisData(fullData);
            setState('results');
            toast({
              title: "Analysis Complete",
              description: `Found ${fullData.experiments.length} experiments and ${fullData.tools.length} tools`,
            });
            return null;
          }

          return { ...prev, currentStep: 'done' };
        });
      },

      onError: (message: string) => {
        const isAuthError = message.toLowerCase().includes('sign in') || message.toLowerCase().includes('api key');
        if (isAuthError) {
          toast({ title: "Sign in required", description: message, variant: "destructive" });
          setState('input');
          setStreamingData(null);
          return;
        }

        const isRateLimit = message.toLowerCase().includes('too many') || message.toLowerCase().includes('rate limit');
        const errorType: ErrorType = isRateLimit ? 'rate-limited' as any : 'generic';

        setErrorData({ type: errorType, message });
        setState('error');
        setStreamingData(null);
        toast({ title: "Analysis Failed", description: message, variant: "destructive" });
      },
    });

    cleanupRef.current = cleanup;
  };

  const handleRetry = () => { if (lastUrl) handleAnalyze(lastUrl); };

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

        {state === 'streaming' && streamingData && (
          <StreamingResults streaming={streamingData} onNewAnalysis={handleNewAnalysis} />
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
