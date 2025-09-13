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
  Copy
} from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  pricing: {
    free: boolean;
    monthly?: number;
    usage?: string;
    features: string[];
  };
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeToImplement: string;
  url: string;
  mentioned: string[];
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tools: string[];
  estimatedCost: number;
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
  totalEstimatedCost: number;
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

  const handleExportJSON = () => {
    try {
      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        summary: {
          experimentsCount: data.experiments.length,
          toolsCount: data.tools.length,
          totalEstimatedCost: data.totalEstimatedCost,
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
      csvContent += `Total Estimated Cost,$${data.totalEstimatedCost}\n\n`;
      
      // Experiments section
      csvContent += "Experiments\n";
      csvContent += "Title,Description,Timestamp,Complexity,Estimated Cost,Tools Used\n";
      data.experiments.forEach(exp => {
        const toolsList = exp.tools.join('; ');
        csvContent += `"${exp.title}","${exp.description}","${exp.timestamp}","${exp.complexity}","$${exp.estimatedCost}","${toolsList}"\n`;
      });
      
      csvContent += "\nTools\n";
      csvContent += "Name,Category,Description,Difficulty,Monthly Cost,Free Tier,Implementation Time,URL\n";
      data.tools.forEach(tool => {
        const monthlyCost = tool.pricing.monthly ? `$${tool.pricing.monthly}` : 'N/A';
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
      
Found ${data.experiments.length} LLM experiments and ${data.tools.length} tools with an estimated cost of $${data.totalEstimatedCost}/month.

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
            <div className="text-center p-4 bg-emerald/10 rounded-lg">
              <div className="text-2xl font-bold text-emerald">${data.totalEstimatedCost}</div>
              <div className="text-sm text-muted-foreground">Est. Monthly Cost</div>
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
                      <span className="font-medium text-emerald">${experiment.estimatedCost}/mo</span>
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
                    <div className="text-right">
                      {tool.pricing.free ? (
                        <Badge variant="secondary" className="bg-emerald text-emerald-foreground">
                          Free
                        </Badge>
                      ) : (
                        <div className="text-right">
                          <div className="font-semibold text-foreground">
                            ${tool.pricing.monthly}/mo
                          </div>
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