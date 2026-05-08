import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, ExternalLink } from "lucide-react";
import AnalysisResults from "@/components/AnalysisResults";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

export default function SharePage() {
  const [, params] = useRoute("/share/:shareId");
  const shareId = params?.shareId;

  const { data, isLoading, error } = useQuery<{
    id: string;
    contentInfo: { title: string; duration?: string; platform: string; url: string; };
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
      <div className="min-h-screen bg-background py-12">
        <div className="editorial-container mx-auto">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="editorial-container mx-auto">
          <ErrorState
            errorType="generic"
            message="This shared analysis could not be found. It may have been deleted or the link is incorrect."
          />
          <div className="mt-6 text-center">
            <Link href="/">
              <Button
                variant="outline"
                style={{ borderRadius: "100px", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                data-testid="button-home"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 border-b border-border"
        style={{
          height: "58px",
          background: "hsl(var(--background) / 0.88)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="editorial-container mx-auto h-full flex items-center justify-between">
          <Link href="/">
            <span
              className="cursor-pointer"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 500,
                fontSize: "1.125rem",
                color: "hsl(var(--foreground))",
              }}
            >
              Tutorial Cost
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="gap-1.5"
              style={{ borderRadius: "100px", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
              data-testid="badge-views"
            >
              <Eye className="h-3 w-3" />
              {data.viewCount} {data.viewCount === 1 ? "view" : "views"}
            </Badge>
            <Link href="/">
              <Button
                size="sm"
                style={{ borderRadius: "100px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                data-testid="button-analyze-own"
              >
                Analyze Your Own
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Custom label / tags */}
      {(data.label || (data.tags && data.tags.length > 0)) && (
        <div className="editorial-container mx-auto pt-[70px] pb-0 flex flex-wrap items-center gap-2">
          {data.label && (
            <Badge
              variant="outline"
              style={{ borderRadius: "100px", background: "hsl(var(--sage-light))", borderColor: "hsl(var(--sage) / 0.3)", color: "hsl(var(--sage))" }}
            >
              {data.label}
            </Badge>
          )}
          {data.tags && data.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="py-8">
        {/* Share banner */}
        <div className="editorial-container mx-auto mb-6 animate-fade-up" style={{ opacity: 0 }}>
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-4 flex-wrap">
                <div
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md"
                  style={{ background: "hsl(var(--sage-light))" }}
                >
                  <ExternalLink className="h-5 w-5" style={{ color: "hsl(var(--sage))" }} />
                </div>
                <div className="flex-1">
                  <h3
                    className="font-semibold"
                    style={{ fontFamily: "var(--font-serif)", fontSize: "1rem" }}
                  >
                    Shared Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This analysis was shared with you. Want to analyze your own YouTube videos?
                  </p>
                </div>
                <Link href="/">
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ borderRadius: "100px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                    data-testid="button-try-it"
                  >
                    Try It Free
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <AnalysisResults
          data={{
            contentInfo: data.contentInfo,
            experiments: data.experiments,
            tools: data.tools,
            summary: data.summary,
            processingTime: data.processingTime,
          }}
          hideShareButton
        />
      </div>
    </div>
  );
}
