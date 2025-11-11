import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  ExternalLink, 
  DollarSign, 
  Zap, 
  Clock, 
  Star,
  TrendingUp,
  Download,
  Share2,
  FileText,
  FileSpreadsheet,
  Copy,
  AlertCircle
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
}

export default function AnalysisResults({ data, onNewAnalysis }: AnalysisResultsProps) {
  const { toast } = useToast();
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-emerald text-emerald-foreground';
      case 'Intermediate': return 'bg-amber text-amber-foreground';
      case 'Advanced': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-emerald text-emerald-foreground';
      case 'Medium': return 'bg-amber text-amber-foreground';
      case 'High': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getCostClassificationColor = (classification?: string) => {
    switch (classification) {
      case 'Free': return 'bg-emerald text-emerald-foreground';
      case 'Low': return 'bg-primary text-primary-foreground';
      case 'Medium': return 'bg-amber text-amber-foreground';
      case 'High': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleExportJSON = () => {
    try {
      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        summary: {
          experimentsCount: data.experiments.length,
          toolsCount: data.tools.length,
          toolSubscriptionCostMin: data.summary.toolSubscriptionCostMin,
          toolSubscriptionCostMax: data.summary.toolSubscriptionCostMax,
          infrastructureCostMin: data.summary.infrastructureCostMin,
          infrastructureCostMax: data.summary.infrastructureCostMax,
          totalEstimatedCostMin: data.summary.totalCostMin,
          totalEstimatedCostMax: data.summary.totalCostMax,
          processingTime: data.processingTime
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-analysis-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Analysis data exported as JSON file",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analysis data",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    try {
      // Create CSV content
      let csvContent = "Content Analysis Report\n\n";
      csvContent += `Title,${data.contentInfo.title}\n`;
      csvContent += `Platform,${data.contentInfo.platform}\n`;
      csvContent += `Duration,${data.contentInfo.duration}\n`;
      csvContent += `Processing Time,${data.processingTime}s\n`;
      csvContent += `Tool Subscription Costs,$${data.summary.toolSubscriptionCostMin}-$${data.summary.toolSubscriptionCostMax}\n`;
      csvContent += `Infrastructure Costs,$${data.summary.infrastructureCostMin}-$${data.summary.infrastructureCostMax}\n`;
      csvContent += `Total Estimated Cost Range,$${data.summary.totalCostMin}-$${data.summary.totalCostMax}\n\n`;
      
      // Experiments section
      csvContent += "Experiments\n";
      csvContent += "Title,Description,Timestamp,Complexity,Estimated Cost,Tools Used\n";
      data.experiments.forEach(exp => {
        const toolsList = exp.tools.join('; ');
        csvContent += `"${exp.title}","${exp.description}","${exp.timestamp}","${exp.complexity}","$${exp.estimatedCostMin}-$${exp.estimatedCostMax}","${toolsList}"\n`;
      });
      
      csvContent += "\nTools\n";
      csvContent += "Name,Category,Description,Difficulty,Monthly Cost,Free Tier,Implementation Time,URL\n";
      data.tools.forEach(tool => {
        const monthlyCost = tool.pricing.monthlyMin && tool.pricing.monthlyMax 
          ? `$${tool.pricing.monthlyMin}-${tool.pricing.monthlyMax}` 
          : tool.pricing.monthlyMin 
            ? `$${tool.pricing.monthlyMin}` 
            : 'N/A';
        csvContent += `"${tool.name}","${tool.category}","${tool.description}","${tool.difficulty}","${monthlyCost}","${tool.pricing.free ? 'Yes' : 'No'}","${tool.timeToImplement}","${tool.url}"\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-analysis-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Analysis data exported as CSV file",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analysis data",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareText = `Content Analysis Results: ${data.contentInfo.title}
      
Found ${data.experiments.length} LLM experiments and ${data.tools.length} tools with an estimated total cost of $${data.summary.totalCostMin}-$${data.summary.totalCostMax}/month (Tools: $${data.summary.toolSubscriptionCostMin}-$${data.summary.toolSubscriptionCostMax}, Infrastructure: $${data.summary.infrastructureCostMin}-$${data.summary.infrastructureCostMax}).

Experiments:
${data.experiments.map(exp => `• ${exp.title} (${exp.complexity} complexity)`).join('\n')}

Key Tools:
${data.tools.slice(0, 5).map(tool => `• ${tool.name} - ${tool.category}`).join('\n')}

Analyzed with Content Analyzer for LLM Experiments`;

      if (navigator.share) {
        await navigator.share({
          title: 'Content Analysis Results',
          text: shareText,
          url: window.location.href
        });
        
        toast({
          title: "Shared Successfully",
          description: "Analysis results shared",
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to Clipboard",
          description: "Analysis summary copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Failed to share analysis results",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header with content info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{data.contentInfo.title}</CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {data.contentInfo.duration}
                </span>
                <Badge variant="outline">{data.contentInfo.platform}</Badge>
                <span className="text-muted-foreground text-sm">
                  Processed in {data.processingTime}s
                </span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-export">
                    <Download className="w-4 h-4 mr-2" />
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{data.experiments.length}</div>
              <div className="text-sm text-muted-foreground">Experiments Found</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{data.tools.length}</div>
              <div className="text-sm text-muted-foreground">Tools Identified</div>
            </div>
            <div className="text-center p-4 bg-emerald/10 rounded-lg space-y-2">
              <div className="text-2xl font-bold text-emerald">
                ${data.summary.totalCostMin}-${data.summary.totalCostMax}
              </div>
              <div className="text-sm text-muted-foreground">Est. Monthly Cost Range</div>
              <div className="text-xs text-muted-foreground/80 space-y-0.5">
                <div>Tools: ${data.summary.toolSubscriptionCostMin}-${data.summary.toolSubscriptionCostMax}</div>
                {(data.summary.infrastructureCostMin > 0 || data.summary.infrastructureCostMax > 0) && (
                  <div>Infrastructure: ${data.summary.infrastructureCostMin}-${data.summary.infrastructureCostMax}</div>
                )}
              </div>
              {data.summary.costClassification && (
                <Badge 
                  className={getCostClassificationColor(data.summary.costClassification)}
                  data-testid={`badge-cost-${data.summary.costClassification.toLowerCase()}`}
                >
                  {data.summary.costClassificationLabel || data.summary.costClassification}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Experiments Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber" />
            LLM Experiments
          </h2>
          <div className="space-y-4">
            {data.experiments.map((experiment) => (
              <Card key={experiment.id} className="hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{experiment.title}</CardTitle>
                    <Badge className={getComplexityColor(experiment.complexity)}>
                      {experiment.complexity}
                    </Badge>
                  </div>
                  <CardDescription>{experiment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Timestamp: {experiment.timestamp}</span>
                      <span className="font-medium text-emerald">
                        ${experiment.estimatedCostMin}-${experiment.estimatedCostMax}/mo
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {experiment.tools.map((toolId) => {
                        const tool = data.tools.find(t => t.id === toolId);
                        return (
                          <Badge key={toolId} variant="secondary" className="text-xs">
                            {tool?.name || toolId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Required Tools
          </h2>
          <div className="space-y-4">
            {data.tools.map((tool) => (
              <Card key={tool.id} className="hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {tool.name}
                        <a 
                          href={tool.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                          data-testid={`link-tool-${tool.id}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{tool.category}</Badge>
                        <Badge className={getDifficultyColor(tool.difficulty)}>
                          {tool.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {/* Two-line pricing hierarchy: free tier first, optional paid second */}
                      {tool.pricing.free ? (
                        <div className="space-y-1">
                          {/* Primary line: Free tier headline */}
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant="secondary" className="bg-emerald text-emerald-foreground">
                              Free
                            </Badge>
                            {tool.pricing.pricingSource === 'ai-estimated' && (
                              <Badge variant="outline" className="text-xs" title="Pricing estimated via AI analysis">
                                AI Estimated
                              </Badge>
                            )}
                          </div>
                          {tool.pricing.tierName && (
                            <div className="text-xs text-muted-foreground">
                              {tool.pricing.tierName}
                            </div>
                          )}
                          
                          {/* Secondary line: Optional paid tier if available */}
                          {tool.pricing.monthlyMin && tool.pricing.monthlyMin > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Optional: {tool.pricing.monthlyMax 
                                ? `$${tool.pricing.monthlyMin}-${tool.pricing.monthlyMax}/mo` 
                                : `$${tool.pricing.monthlyMin}+/mo`}
                              {tool.pricing.priceType === 'usage-based' && ' (usage-based)'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-right space-y-1">
                          {/* Paid tier headline */}
                          <div className="flex items-center justify-end gap-2">
                            <div className="font-semibold text-foreground">
                              {tool.pricing.monthlyMin && tool.pricing.monthlyMax ? (
                                `$${tool.pricing.monthlyMin}-${tool.pricing.monthlyMax}/mo`
                              ) : tool.pricing.monthlyMin ? (
                                `$${tool.pricing.monthlyMin}+/mo`
                              ) : (
                                'Contact for pricing'
                              )}
                            </div>
                            {tool.pricing.pricingSource === 'ai-estimated' && (
                              <Badge variant="outline" className="text-xs" title="Pricing estimated via AI analysis">
                                AI Estimated
                              </Badge>
                            )}
                          </div>
                          {tool.pricing.tierName && (
                            <Badge variant="outline" className="text-xs">
                              {tool.pricing.tierName}
                            </Badge>
                          )}
                          {tool.pricing.priceType && (
                            <div className="text-xs text-muted-foreground">
                              {tool.pricing.priceType === 'usage-based' && 'Usage-based'}
                              {tool.pricing.priceType === 'per-token' && 'Per-token'}
                              {tool.pricing.priceType === 'fixed' && 'Fixed price'}
                            </div>
                          )}
                          {tool.pricing.usage && (
                            <div className="text-xs text-muted-foreground">
                              {tool.pricing.usage}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Implementation time: {tool.timeToImplement}</span>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Key Features:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {tool.pricing.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className="w-3 h-3 mt-0.5 text-amber flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {tool.suggestedContext && tool.pricing.pricingSource === 'ai-estimated' && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-2 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <h4 className="text-sm font-medium text-foreground">AI Pricing Estimate:</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{tool.suggestedContext}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          This pricing is estimated from AI analysis. Verify on the official website.
                        </p>
                      </div>
                    )}

                    {tool.pricing.allTiers && tool.pricing.allTiers.length > 1 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Available Pricing Tiers:</h4>
                        <div className="space-y-2">
                          {tool.pricing.allTiers.map((tier, index) => (
                            <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{tier.tier}</span>
                                {tier.priceType === 'free' && (
                                  <Badge variant="secondary" className="text-xs bg-emerald text-emerald-foreground">Free</Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-foreground">
                                  {tier.monthlyMin === 0 && !tier.monthlyMax ? (
                                    'Free'
                                  ) : tier.monthlyMax ? (
                                    `$${tier.monthlyMin}-${tier.monthlyMax}/mo`
                                  ) : (
                                    `$${tier.monthlyMin}+/mo`
                                  )}
                                </div>
                                {tier.usage && (
                                  <div className="text-muted-foreground text-xs">{tier.usage}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tool.mentioned.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Mentioned in:</h4>
                        <div className="flex flex-wrap gap-1">
                          {tool.mentioned.map((mention, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
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

      {/* Infrastructure Costs Section */}
      {data.summary.infrastructureBreakdown && data.summary.infrastructureBreakdown.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald" />
            Infrastructure Costs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.summary.infrastructureBreakdown.map((infra, index) => (
              <Card key={index} className="hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{infra.toolName}</CardTitle>
                      <Badge variant="outline" className="text-xs">{infra.component}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald">
                        ${infra.costMin}-${infra.costMax}/mo
                      </div>
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

      {/* Pricing Disclaimer */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-foreground">Pricing Disclaimer:</strong>
              {" "}
              Cost ranges are estimated using 2025 pricing data, last updated September 2025. 
              Actual costs may vary based on usage, subscription tiers, and current pricing. 
              Please verify current pricing on each tool's official website.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-center pt-6">
        <Button 
          onClick={onNewAnalysis}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          data-testid="button-new-analysis"
        >
          Analyze Another Content
        </Button>
      </div>
    </div>
  );
}