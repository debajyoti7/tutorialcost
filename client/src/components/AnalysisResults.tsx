import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { FeedbackButton } from "@/components/FeedbackButton";
import {
  ExternalLink, DollarSign, Zap, Clock, Star, TrendingUp, Download, Share2,
  FileText, FileSpreadsheet, AlertCircle,
} from "lucide-react";

export interface Tool {
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
    priceType?: 'fixed' | 'usage-based' | 'per-token' | 'free';
    tierName?: string;
    pricingSource?: 'database' | 'ai-estimated';
    allTiers?: {
      tier: string;
      monthlyMin: number;
      monthlyMax?: number;
      priceType: string;
      usage?: string;
    }[];
  };
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeToImplement: string;
  url: string;
  mentioned: string[];
  suggestedContext?: string;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tools: string[];
  estimatedCostMin: number;
  estimatedCostMax: number;
  complexity: 'Low' | 'Medium' | 'High';
}

export interface AnalysisData {
  contentInfo: {
    title: string;
    duration: string;
    platform: 'YouTube' | 'Podcast';
    url: string;
    transcriptSource?: 'youtube' | 'ai-generated' | 'description-only';
  };
  experiments: Experiment[];
  tools: Tool[];
  summary: {
    totalExperiments: number;
    totalToolsRequired: number;
    toolSubscriptionCostMin: number;
    toolSubscriptionCostMax: number;
    infrastructureCostMin: number;
    infrastructureCostMax: number;
    infrastructureBreakdown: Array<{
      toolName: string;
      component: string;
      description: string;
      costMin: number;
      costMax: number;
    }>;
    totalCostMin: number;
    totalCostMax: number;
    implementationTimeEstimate: string;
    difficultyLevel: 'Low' | 'Medium' | 'High';
    costClassification?: 'Free' | 'Low' | 'Medium' | 'High';
    costClassificationLabel?: string;
  };
  processingTime: number;
}

interface AnalysisResultsProps {
  data: AnalysisData;
  onNewAnalysis?: () => void;
  hideShareButton?: boolean;
  analysisId?: string;
}

const BADGE_PILL = { borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" };

export default function AnalysisResults({ data, onNewAnalysis, hideShareButton = false, analysisId }: AnalysisResultsProps) {
  const { toast } = useToast();

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return { color: "hsl(var(--sage))", background: "hsl(var(--sage-light))" };
      case 'Intermediate': return { color: "hsl(var(--amber))", background: "hsl(var(--amber-light))" };
      case 'Advanced': return { color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.1)" };
      default: return {};
    }
  };

  const getComplexityStyle = (complexity: string) => {
    switch (complexity) {
      case 'Low': return { color: "hsl(var(--sage))", background: "hsl(var(--sage-light))" };
      case 'Medium': return { color: "hsl(var(--amber))", background: "hsl(var(--amber-light))" };
      case 'High': return { color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.1)" };
      default: return {};
    }
  };

  const getCostStyle = (classification?: string) => {
    switch (classification) {
      case 'Free': return { color: "hsl(var(--sage))", background: "hsl(var(--sage-light))" };
      case 'Low': return { color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.1)" };
      case 'Medium': return { color: "hsl(var(--amber))", background: "hsl(var(--amber-light))" };
      case 'High': return { color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.1)" };
      default: return {};
    }
  };

  const handleExportJSON = () => {
    try {
      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        summary: {
          experimentsCount: data.experiments?.length || 0,
          toolsCount: data.tools?.length || 0,
          toolSubscriptionCostMin: data.summary.toolSubscriptionCostMin,
          toolSubscriptionCostMax: data.summary.toolSubscriptionCostMax,
          infrastructureCostMin: data.summary.infrastructureCostMin,
          infrastructureCostMax: data.summary.infrastructureCostMax,
          totalEstimatedCostMin: data.summary.totalCostMin,
          totalEstimatedCostMax: data.summary.totalCostMax,
          processingTime: data.processingTime,
        },
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `content-analysis-${Date.now()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export Successful", description: "Analysis data exported as JSON file" });
    } catch {
      toast({ title: "Export Failed", description: "Failed to export analysis data", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "Content Analysis Report\n\n";
      csvContent += `Title,${data.contentInfo.title}\n`;
      csvContent += `Platform,${data.contentInfo.platform}\n`;
      csvContent += `Duration,${data.contentInfo.duration}\n`;
      csvContent += `Processing Time,${data.processingTime}s\n`;
      csvContent += `Tool Subscription Costs,$${data.summary.toolSubscriptionCostMin}-$${data.summary.toolSubscriptionCostMax}\n`;
      csvContent += `Infrastructure Costs,$${data.summary.infrastructureCostMin}-$${data.summary.infrastructureCostMax}\n`;
      csvContent += `Total Estimated Cost Range,$${data.summary.totalCostMin}-$${data.summary.totalCostMax}\n\n`;
      csvContent += "Experiments\nTitle,Description,Timestamp,Complexity,Estimated Cost,Tools Used\n";
      data.experiments.forEach(exp => {
        csvContent += `"${exp.title}","${exp.description}","${exp.timestamp}","${exp.complexity}","$${exp.estimatedCostMin}-$${exp.estimatedCostMax}","${exp.tools.join('; ')}"\n`;
      });
      csvContent += "\nTools\nName,Category,Description,Difficulty,Monthly Cost,Free Tier,Implementation Time,URL\n";
      data.tools.forEach(tool => {
        const monthlyCost = tool.pricing.monthlyMin && tool.pricing.monthlyMax
          ? `$${tool.pricing.monthlyMin}-${tool.pricing.monthlyMax}`
          : tool.pricing.monthlyMin ? `$${tool.pricing.monthlyMin}` : 'N/A';
        csvContent += `"${tool.name}","${tool.category}","${tool.description}","${tool.difficulty}","${monthlyCost}","${tool.pricing.free ? 'Yes' : 'No'}","${tool.timeToImplement}","${tool.url}"\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `content-analysis-${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export Successful", description: "Analysis data exported as CSV file" });
    } catch {
      toast({ title: "Export Failed", description: "Failed to export analysis data", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    try {
      if (!analysisId) throw new Error('No analysis ID available');
      const response = await fetch(`/api/analyses/${analysisId}/share`, { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Failed to generate share link');
      const { shareUrl } = await response.json();
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Share Link Copied!", description: "Anyone with this link can view your analysis" });
    } catch {
      toast({ title: "Share Failed", description: "Failed to generate shareable link", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Summary card ── */}
      <div className="editorial-container mx-auto animate-fade-up" style={{ opacity: 0 }}>
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle
                  className="leading-snug"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem" }}
                >
                  {data.contentInfo.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" style={BADGE_PILL}>{data.contentInfo.platform}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Processed in {data.processingTime}s
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {!hideShareButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    style={{ borderRadius: "100px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                    data-testid="button-share"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    Share
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ borderRadius: "100px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                      data-testid="button-export"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportJSON} data-testid="export-json">
                      <FileText className="w-4 h-4 mr-2" />
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV} data-testid="export-csv">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-5 bg-muted rounded-md min-h-[90px]">
                <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                  {data.experiments?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Experiments Found</div>
              </div>
              <div className="flex flex-col items-center justify-center p-5 bg-muted rounded-md min-h-[90px]">
                <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                  {data.tools?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Tools Identified</div>
              </div>
              <div
                className="flex flex-col items-center justify-center p-5 rounded-md min-h-[90px]"
                style={{ background: "hsl(var(--sage-light))" }}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-serif)", color: "hsl(var(--sage))" }}
                >
                  ${data.summary.totalCostMin}–${data.summary.totalCostMax}
                </div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Est. Monthly Cost</div>
                <div className="text-xs text-muted-foreground/70 mt-1.5 text-center space-y-0.5">
                  <div>Tools: ${data.summary.toolSubscriptionCostMin}–${data.summary.toolSubscriptionCostMax}</div>
                  {(data.summary.infrastructureCostMin > 0 || data.summary.infrastructureCostMax > 0) && (
                    <div>Infra: ${data.summary.infrastructureCostMin}–${data.summary.infrastructureCostMax}</div>
                  )}
                </div>
                {data.summary.costClassification && (
                  <Badge
                    className="mt-2"
                    style={{ ...BADGE_PILL, ...getCostStyle(data.summary.costClassification) }}
                    data-testid={`badge-cost-${data.summary.costClassification.toLowerCase()}`}
                  >
                    {data.summary.costClassificationLabel || data.summary.costClassification}
                  </Badge>
                )}
              </div>
            </div>

            {analysisId && (
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-3">
                <span className="text-sm text-muted-foreground">Was this analysis helpful?</span>
                <FeedbackButton analysisId={analysisId} feedbackType="overall" variant="ghost" size="sm" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Warning banners ── */}
      {data.contentInfo.transcriptSource === 'ai-generated' && (
        <div className="editorial-container mx-auto">
          <div
            className="flex items-start gap-3 p-4 rounded-md border"
            style={{ background: "hsl(205 60% 95%)", borderColor: "hsl(205 40% 80%)" }}
            data-testid="banner-ai-transcript"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(205 60% 40%)" }} />
            <div>
              <p className="font-medium text-sm" style={{ color: "hsl(205 60% 25%)" }}>AI-Generated Transcript</p>
              <p className="text-sm mt-0.5" style={{ color: "hsl(205 50% 35%)" }}>
                YouTube captions were not available. The transcript was generated using AI, which may contain inaccuracies.
              </p>
            </div>
          </div>
        </div>
      )}

      {data.contentInfo.transcriptSource === 'description-only' && (
        <div className="editorial-container mx-auto">
          <div
            className="flex items-start gap-3 p-4 rounded-md border"
            style={{ background: "hsl(var(--amber-light))", borderColor: "hsl(var(--amber) / 0.3)" }}
            data-testid="banner-description-only"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--amber))" }} />
            <div>
              <p className="font-medium text-sm" style={{ color: "hsl(var(--foreground))" }}>Limited Analysis</p>
              <p className="text-sm mt-0.5 text-muted-foreground">
                No transcript or AI transcription was available. This analysis is based only on the video description.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Experiments + Tools ── */}
      <div className="editorial-container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Experiments */}
          <div className="space-y-4 animate-fade-up-1" style={{ opacity: 0 }}>
            <h2
              className="flex items-center gap-2 text-lg font-semibold"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <Zap className="w-5 h-5" style={{ color: "hsl(var(--amber))" }} />
              LLM Experiments
            </h2>
            <div className="space-y-4">
              {data.experiments.map((experiment, index) => (
                <Card key={experiment.id} className="border border-border hover-elevate">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle
                          className="text-base leading-snug"
                          style={{ fontFamily: "var(--font-serif)" }}
                        >
                          {experiment.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {analysisId && (
                          <FeedbackButton analysisId={analysisId} feedbackType="experiment" targetId={index.toString()} />
                        )}
                        <Badge style={{ ...BADGE_PILL, ...getComplexityStyle(experiment.complexity) }}>
                          {experiment.complexity}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="mt-1">{experiment.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-between text-sm gap-2 mb-2.5">
                      <span className="text-muted-foreground">@ {experiment.timestamp}</span>
                      <span className="font-semibold whitespace-nowrap" style={{ color: "hsl(var(--sage))" }}>
                        ${experiment.estimatedCostMin}–${experiment.estimatedCostMax}/mo
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {experiment.tools.map((toolId) => {
                        const tool = data.tools.find(t => t.id === toolId);
                        return (
                          <Badge
                            key={toolId}
                            variant="secondary"
                            style={BADGE_PILL}
                            data-testid={`badge-tool-${toolId}`}
                          >
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

          {/* Tools */}
          <div className="space-y-4 animate-fade-up-2" style={{ opacity: 0 }}>
            <h2
              className="flex items-center gap-2 text-lg font-semibold"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: "hsl(var(--sage))" }} />
              Required Tools
            </h2>
            <div className="space-y-4">
              {data.tools.map((tool) => (
                <Card key={tool.id} className="border border-border hover-elevate">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <CardTitle
                          className="text-base flex items-center gap-2 leading-snug"
                          style={{ fontFamily: "var(--font-serif)" }}
                        >
                          {tool.name}
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground flex-shrink-0"
                            style={{ textDecoration: "none" }}
                            data-testid={`link-tool-${tool.id}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </CardTitle>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" style={BADGE_PILL}>{tool.category}</Badge>
                          <Badge style={{ ...BADGE_PILL, ...getDifficultyStyle(tool.difficulty) }}>
                            {tool.difficulty}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 flex-shrink-0">
                        {analysisId && (
                          <FeedbackButton analysisId={analysisId} feedbackType="tool" targetId={tool.name} />
                        )}
                        <div className="text-right min-w-[90px]">
                          {tool.pricing.free ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <Badge style={{ ...BADGE_PILL, ...getDifficultyStyle('Beginner') }}>Free</Badge>
                                {tool.pricing.pricingSource === 'ai-estimated' && (
                                  <Badge variant="outline" style={BADGE_PILL} title="AI estimated">AI Est.</Badge>
                                )}
                              </div>
                              {tool.pricing.tierName && (
                                <div className="text-xs text-muted-foreground">{tool.pricing.tierName}</div>
                              )}
                              {tool.pricing.monthlyMin && tool.pricing.monthlyMin > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Paid: {tool.pricing.monthlyMax
                                    ? `$${tool.pricing.monthlyMin}–${tool.pricing.monthlyMax}`
                                    : `$${tool.pricing.monthlyMin}+`}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="font-semibold text-sm whitespace-nowrap">
                                  {tool.pricing.monthlyMin && tool.pricing.monthlyMax
                                    ? `$${tool.pricing.monthlyMin}–${tool.pricing.monthlyMax}/mo`
                                    : tool.pricing.monthlyMin
                                    ? `$${tool.pricing.monthlyMin}+/mo`
                                    : 'Contact'}
                                </span>
                                {tool.pricing.pricingSource === 'ai-estimated' && (
                                  <Badge variant="outline" style={BADGE_PILL} title="AI estimated">AI Est.</Badge>
                                )}
                              </div>
                              {tool.pricing.tierName && (
                                <div className="text-xs text-muted-foreground">{tool.pricing.tierName}</div>
                              )}
                              {tool.pricing.priceType && (
                                <div className="text-xs text-muted-foreground">
                                  {tool.pricing.priceType === 'usage-based' && 'Usage-based'}
                                  {tool.pricing.priceType === 'per-token' && 'Per-token'}
                                  {tool.pricing.priceType === 'fixed' && 'Fixed price'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Implementation: {tool.timeToImplement}</span>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Key Features
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1.5">
                          {tool.pricing.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Star className="w-3 h-3 mt-1 flex-shrink-0" style={{ color: "hsl(var(--amber))" }} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {tool.suggestedContext && tool.pricing.pricingSource === 'ai-estimated' && (
                        <div
                          className="p-3 rounded-md border"
                          style={{ background: "hsl(205 60% 95%)", borderColor: "hsl(205 40% 80%)" }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(205 60% 40%)" }} />
                            <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(205 60% 30%)" }}>
                              AI Pricing Estimate
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">{tool.suggestedContext}</p>
                          <p className="text-xs text-muted-foreground mt-1 italic">Verify pricing on the official website.</p>
                        </div>
                      )}

                      {tool.pricing.allTiers && tool.pricing.allTiers.length > 1 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Available Tiers
                          </h4>
                          <div className="space-y-1.5">
                            {tool.pricing.allTiers.map((tier, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between text-xs p-2 rounded-md"
                                style={{ background: "hsl(var(--muted))" }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{tier.tier}</span>
                                  {tier.priceType === 'free' && (
                                    <Badge style={{ ...BADGE_PILL, ...getDifficultyStyle('Beginner') }}>Free</Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    {tier.monthlyMin === 0 && !tier.monthlyMax
                                      ? 'Free'
                                      : tier.monthlyMax
                                      ? `$${tier.monthlyMin}–${tier.monthlyMax}/mo`
                                      : `$${tier.monthlyMin}+/mo`}
                                  </div>
                                  {tier.usage && (
                                    <div className="text-muted-foreground">{tier.usage}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {tool.mentioned.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Mentioned in
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {tool.mentioned.map((mention, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                style={BADGE_PILL}
                                data-testid={`badge-mention-${index}`}
                              >
                                {mention}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Infrastructure costs ── */}
      {data.summary.infrastructureBreakdown && data.summary.infrastructureBreakdown.length > 0 && (
        <div className="editorial-container mx-auto space-y-4 animate-fade-up-3" style={{ opacity: 0 }}>
          <h2
            className="flex items-center gap-2 text-lg font-semibold"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <DollarSign className="w-5 h-5" style={{ color: "hsl(var(--sage))" }} />
            Infrastructure Costs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.summary.infrastructureBreakdown.map((infra, index) => (
              <Card key={index} className="border border-border hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-sm" style={{ fontFamily: "var(--font-serif)" }}>
                        {infra.toolName}
                      </CardTitle>
                      <Badge variant="outline" style={BADGE_PILL}>{infra.component}</Badge>
                    </div>
                    <div className="font-semibold text-sm" style={{ color: "hsl(var(--sage))" }}>
                      ${infra.costMin}–${infra.costMax}/mo
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{infra.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="editorial-container mx-auto">
        <Card className="border border-border bg-muted/40">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground font-medium">Pricing Disclaimer:</strong>
                {" "}Cost ranges are estimated using 2025 pricing data, last updated September 2025.
                Actual costs may vary. Please verify current pricing on each tool's official website.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── New analysis CTA ── */}
      {onNewAnalysis && (
        <div className="editorial-container mx-auto flex justify-center pb-6">
          <Button
            onClick={onNewAnalysis}
            style={{
              borderRadius: "100px",
              fontSize: "0.82rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
            data-testid="button-new-analysis"
          >
            Analyze Another Video
          </Button>
        </div>
      )}
    </div>
  );
}
