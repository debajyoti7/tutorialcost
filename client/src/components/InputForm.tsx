import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Link as LinkIcon,
  Youtube,
  Podcast,
  DollarSign,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
  Sparkles,
} from "lucide-react";

interface InputFormProps {
  onAnalyze: (url: string) => void;
  isLoading?: boolean;
}

export default function InputForm({ onAnalyze, isLoading = false }: InputFormProps) {
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const validateUrl = (inputUrl: string): string[] => {
    const validationErrors: string[] = [];
    if (!inputUrl.trim()) {
      validationErrors.push("Please enter a URL");
      return validationErrors;
    }
    try {
      const urlObj = new URL(inputUrl);
      const isYoutube =
        urlObj.hostname.includes("youtube.com") ||
        urlObj.hostname.includes("youtu.be");
      if (!isYoutube) {
        validationErrors.push("URL must be from YouTube");
      }
    } catch {
      validationErrors.push("Please enter a valid URL");
    }
    return validationErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateUrl(url);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    onAnalyze(url);
  };

  const getUrlType = (inputUrl: string) => {
    if (!inputUrl) return null;
    try {
      const urlObj = new URL(inputUrl);
      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        return "youtube";
      }
      return "podcast";
    } catch {
      return null;
    }
  };

  const urlType = getUrlType(url);

  return (
    <div className="editorial-container w-full space-y-16">

      {/* ── Hero ── */}
      <div className="text-center space-y-6 py-4">
        <p
          className="section-label animate-fade-up"
          style={{ opacity: 0 }}
        >
          Powered by Good Vibes
        </p>

        <h1
          className="animate-fade-up-1"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2.2rem, 6vw, 3.5rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "hsl(var(--foreground))",
            opacity: 0,
          }}
        >
          Decode AI Experiments
          <br />
          <em
            style={{
              fontStyle: "italic",
              color: "hsl(var(--sage))",
            }}
          >
            from any video
          </em>
        </h1>

        <p
          className="animate-fade-up-2"
          style={{
            fontSize: "1.1rem",
            color: "hsl(var(--muted-foreground))",
            maxWidth: "560px",
            margin: "0 auto",
            lineHeight: 1.65,
            opacity: 0,
          }}
        >
          Extract AI experiments, discover required tools, and get accurate cost
          breakdowns from YouTube tutorials — all in seconds.
        </p>
      </div>

      {/* ── Feature grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up-3" style={{ opacity: 0 }}>
        {[
          {
            icon: Sparkles,
            title: "AI-Powered Extraction",
            description: "Identifies LLM experiments with timestamps and descriptions",
          },
          {
            icon: Layers,
            title: "Tool Discovery",
            description: "Lists all mentioned tools with detailed feature breakdowns",
          },
          {
            icon: DollarSign,
            title: "Smart Pricing",
            description: "Context-aware tier selection with free and paid options",
          },
          {
            icon: Clock,
            title: "Time Estimates",
            description: "Implementation difficulty and time-to-build projections",
          },
        ].map((feature) => (
          <Card key={feature.title} className="border border-border hover-elevate">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-md"
                  style={{ background: "hsl(var(--sage-light))" }}
                >
                  <feature.icon className="w-4 h-4" style={{ color: "hsl(var(--sage))" }} />
                </div>
                <div>
                  <h3
                    className="font-semibold mb-1"
                    style={{ fontFamily: "var(--font-sans)", fontSize: "0.92rem" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── CTA / Input form ── */}
      <div className="animate-fade-up-4" style={{ opacity: 0 }}>
        <Card className="border border-border">
          <CardHeader className="pb-4">
            <CardTitle
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              Analyze a Video
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Paste a YouTube video URL to begin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-4 h-4" style={{ color: "hsl(var(--sage))" }} />
                  <span className="text-sm font-medium text-foreground">Video URL</span>
                  {urlType && (
                    <Badge
                      variant="outline"
                      className="ml-auto gap-1 text-xs"
                      style={{ borderRadius: "100px" }}
                    >
                      {urlType === "youtube" ? (
                        <><Youtube className="w-3 h-3" /> YouTube</>
                      ) : (
                        <><Podcast className="w-3 h-3" /> Podcast</>
                      )}
                    </Badge>
                  )}
                </div>
                <Textarea
                  data-testid="input-url"
                  placeholder="https://www.youtube.com/watch?v=example"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (errors.length > 0) setErrors([]);
                  }}
                  className="min-h-[90px] text-base resize-none"
                  disabled={isLoading}
                />
                {errors.length > 0 && (
                  <div className="space-y-1.5">
                    {errors.map((error, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-destructive bg-destructive/8 px-3 py-2 rounded-md"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  style={{
                    borderRadius: "100px",
                    fontSize: "0.82rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                  disabled={isLoading || !url.trim()}
                  data-testid="button-analyze"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Content
                    </>
                  )}
                </Button>
                {url && !isLoading && (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={() => { setUrl(""); setErrors([]); }}
                    style={{ borderRadius: "100px" }}
                    data-testid="button-clear"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-border space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: "hsl(var(--sage))" }} />
                  Supported Platforms
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="gap-1.5"
                    style={{ borderRadius: "100px", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                  >
                    <Youtube className="w-3 h-3" />
                    YouTube
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-muted/60 rounded-md border border-border">
                <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: "hsl(var(--sage))" }} />
                  Best Results
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Educational videos, tutorials, tech talks, and podcasts with transcripts work
                  best. Videos without available transcripts cannot be analyzed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── What This Is / Isn't ── */}
      <div className="grid md:grid-cols-2 gap-5 animate-fade-up-5" style={{ opacity: 0 }}>
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: "hsl(var(--sage))" }} />
              <CardTitle style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>
                What This Is
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["LLM Experiment Analyzer", "Extracts AI/automation experiments from technical content"],
              ["Cost Estimator", "Provides accurate pricing with context-aware tier recommendations"],
              ["Implementation Guide", "Estimates difficulty levels and time requirements"],
              ["Best for", "AI tutorials, automation workflows, LLM demos, and tech talks"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-2.5">
                <span className="mt-2 w-1 h-1 flex-shrink-0 rounded-full bg-sage" style={{ background: "hsl(var(--sage))" }} />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{title}</span>
                  {" — "}{desc}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" style={{ color: "hsl(var(--amber))" }} />
              <CardTitle style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>
                What This Isn't
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["General Transcription", "Not a video-to-text converter"],
              ["Universal Content Analyzer", "Requires transcript availability (YouTube only)"],
              ["Entertainment Content", "Won't extract useful data from non-technical videos"],
              ["Guaranteed Results", "Content must mention specific LLM experiments or tools"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-2.5">
                <span className="mt-2 w-1 h-1 flex-shrink-0 rounded-full" style={{ background: "hsl(var(--muted-foreground))" }} />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{title}</span>
                  {" — "}{desc}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
