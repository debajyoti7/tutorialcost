import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowLeft, ExternalLink, Eye } from "lucide-react";
import AnalysisResults from "@/components/AnalysisResults";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

export default function SharePage() {
  const [, params] = useRoute("/share/:shareId");
  const shareId = params?.shareId;

  const { data, isLoading, error } = useQuery<{
    id: string;
    contentInfo: {
      title: string;
      duration?: string;
      platform: string;
      url: string;
    };
    experiments: any[];
    tools: any[];
    summary: any;
    processingTime: number;
    viewCount: number;
    label?: string;
    tags?: string[];
    createdAt: string;
  }>({
    queryKey: ["/api/share", shareId],
    enabled: !!shareId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <ErrorState
            errorType="generic"
            message="This shared analysis could not be found. It may have been deleted or the link is incorrect."
          />
          <div className="mt-6 text-center">
            <Link href="/">
              <Button variant="outline" className="gap-2" data-testid="button-home">
                <ArrowLeft className="h-4 w-4" />
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-card/80 backdrop-blur-xl">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <motion.div
                className="flex items-center gap-3 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-emerald-500 rounded-xl">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Content Analyzer
                  </h1>
                  <p className="text-xs text-muted-foreground">Shared Analysis</p>
                </div>
              </motion.div>
            </Link>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1.5" data-testid="badge-views">
                <Eye className="h-3 w-3" />
                {data.viewCount} {data.viewCount === 1 ? 'view' : 'views'}
              </Badge>
              <Link href="/">
                <Button variant="default" className="gap-2" data-testid="button-analyze-own">
                  <Sparkles className="h-4 w-4" />
                  Analyze Your Own
                </Button>
              </Link>
            </div>
          </div>

          {/* Custom label and tags */}
          {(data.label || (data.tags && data.tags.length > 0)) && (
            <motion.div
              className="mt-4 flex flex-wrap items-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {data.label && (
                <Badge variant="outline" className="bg-primary/10 border-primary/30">
                  {data.label}
                </Badge>
              )}
              {data.tags && data.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </motion.div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Share Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-emerald-500/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary/20 to-emerald-500/20 rounded-xl">
                  <ExternalLink className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Shared Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    This analysis was shared with you. Want to analyze your own YouTube videos?
                  </p>
                </div>
                <Link href="/">
                  <Button variant="outline" size="sm" data-testid="button-try-it">
                    Try It Free
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analysis Results */}
        <AnalysisResults
          data={{
            contentInfo: data.contentInfo,
            experiments: data.experiments,
            tools: data.tools,
            summary: data.summary,
            processingTime: data.processingTime,
          }}
          hideShareButton={true}
        />
      </div>
    </div>
  );
}
