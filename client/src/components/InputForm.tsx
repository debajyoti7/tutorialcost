import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link as LinkIcon, Youtube, Podcast, Sparkles, DollarSign, Clock, Layers, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface InputFormProps {
  onAnalyze: (url: string) => void;
  isLoading?: boolean;
}

export default function InputForm({
  onAnalyze,
  isLoading = false,
}: InputFormProps) {
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
      const isPodcast =
        urlObj.hostname.includes("spotify.com") ||
        urlObj.hostname.includes("apple.com") ||
        urlObj.hostname.includes("overcast.fm") ||
        inputUrl.includes(".mp3") ||
        inputUrl.includes("podcast");

      if (!isYoutube) {
        //&& !isPodcast) {
        validationErrors.push("URL must be from YouTube"); // or a podcast platform");
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
    console.log("Analyzing URL:", url);
  };

  const getUrlType = (inputUrl: string) => {
    if (!inputUrl) return null;

    try {
      const urlObj = new URL(inputUrl);
      if (
        urlObj.hostname.includes("youtube.com") ||
        urlObj.hostname.includes("youtu.be")
      ) {
        return "youtube";
      }
      return "podcast";
    } catch {
      return null;
    }
  };

  const urlType = getUrlType(url);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Analyze LLM Experiments from Video Content
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Extract AI experiments, discover required tools, and get accurate cost breakdowns 
          from YouTube tutorials and tech talks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">AI-Powered Extraction</h3>
                <p className="text-sm text-muted-foreground">
                  Identifies LLM experiments with timestamps and descriptions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Tool Discovery</h3>
                <p className="text-sm text-muted-foreground">
                  Lists all mentioned tools with detailed feature breakdowns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Smart Pricing</h3>
                <p className="text-sm text-muted-foreground">
                  Context-aware tier selection with free and paid options
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Time Estimates</h3>
                <p className="text-sm text-muted-foreground">
                  Implementation difficulty and time-to-build projections
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-foreground">
            Get Started
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Paste a YouTube video URL to analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Content URL
                </span>
                {urlType && (
                  <Badge variant="outline" className="ml-auto">
                    {urlType === "youtube" ? (
                      <>
                        <Youtube className="w-3 h-3 mr-1" />
                        YouTube
                      </>
                    ) : (
                      <>
                        <Podcast className="w-3 h-3 mr-1" />
                        Podcast
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <Textarea
                data-testid="input-url"
                placeholder="https://www.youtube.com/watch?v=... "
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errors.length > 0) setErrors([]);
                }}
                className="min-h-[80px] text-base resize-none"
                disabled={isLoading}
              />
              {errors.length > 0 && (
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12"
                disabled={isLoading || !url.trim()}
                data-testid="button-analyze"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Content...
                  </>
                ) : (
                  "Analyze Content"
                )}
              </Button>
              {url && !isLoading && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUrl("");
                    setErrors([]);
                  }}
                  className="h-12"
                  data-testid="button-clear"
                >
                  Clear
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="text-sm font-medium text-foreground mb-2">
                Supported Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Youtube className="w-3 h-3" />
                  YouTube
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-2 border-blue-500">
              <p className="text-xs font-medium text-foreground mb-1">
                Best Results:
              </p>
              <p className="text-xs text-muted-foreground">
                Educational videos, tutorials, tech talks, and podcasts with
                transcripts work best. Videos without available transcripts
                cannot be analyzed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-lg">What This Is</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">LLM Experiment Analyzer</span> - Extracts AI/automation experiments from technical content
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Cost Estimator</span> - Provides accurate pricing for tools with context-aware tier recommendations
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Implementation Guide</span> - Estimates difficulty levels and time requirements
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Best for</span> - AI tutorials, automation workflows, LLM demos, and tech talks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-lg">What This Isn't</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">General Transcription</span> - Not a video-to-text converter
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Universal Content Analyzer</span> - Requires transcript availability (YouTube only)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Entertainment Content</span> - Won't extract useful data from non-technical videos
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Guaranteed Results</span> - Content must mention specific LLM experiments or automation tools
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
