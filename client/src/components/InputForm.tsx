import { useState } from "react";
import { motion } from "framer-motion";
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
import { Loader2, Link as LinkIcon, Youtube, Podcast, Sparkles, DollarSign, Clock, Layers, AlertCircle, CheckCircle2, XCircle, Zap, Target } from "lucide-react";

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
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Gradient Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-12 md:p-16">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Powered by Gemini AI</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold text-foreground leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-primary via-primary to-emerald-500 bg-clip-text text-transparent">
              Decode AI Experiments
            </span>
            <br />
            <span className="text-foreground">From Any Video</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Extract AI experiments, discover required tools, and get accurate cost breakdowns 
            from YouTube tutorials and tech talks—all in seconds
          </motion.p>
        </div>
      </div>

      {/* Glassmorphism Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: Sparkles,
            title: "AI-Powered Extraction",
            description: "Identifies LLM experiments with timestamps and descriptions",
            delay: 0.1
          },
          {
            icon: Layers,
            title: "Tool Discovery",
            description: "Lists all mentioned tools with detailed feature breakdowns",
            delay: 0.2
          },
          {
            icon: DollarSign,
            title: "Smart Pricing",
            description: "Context-aware tier selection with free and paid options",
            delay: 0.3
          },
          {
            icon: Clock,
            title: "Time Estimates",
            description: "Implementation difficulty and time-to-build projections",
            delay: 0.4
          }
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: feature.delay }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover-elevate">
              {/* Gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-start gap-3">
                  <motion.div
                    className="p-3 bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <feature.icon className="w-5 h-5 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Enhanced CTA Section with Gradient Border */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative"
      >
        {/* Gradient border wrapper */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-emerald-500 to-primary rounded-2xl blur opacity-30"></div>
        
        <Card className="relative border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-6 space-y-2">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Get Started
              </CardTitle>
            </motion.div>
            <CardDescription className="text-lg text-muted-foreground">
              Paste a YouTube video URL to begin analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  <span className="text-base font-semibold text-foreground">
                    Video URL
                  </span>
                  {urlType && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Badge variant="outline" className="ml-auto gap-1">
                        {urlType === "youtube" ? (
                          <>
                            <Youtube className="w-3 h-3" />
                            YouTube
                          </>
                        ) : (
                          <>
                            <Podcast className="w-3 h-3" />
                            Podcast
                          </>
                        )}
                      </Badge>
                    </motion.div>
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
                  className="min-h-[100px] text-base resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                  disabled={isLoading}
                />
                {errors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-primary-foreground h-14 text-base font-semibold shadow-lg shadow-primary/20"
                    disabled={isLoading || !url.trim()}
                    data-testid="button-analyze"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing Content...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Analyze Content
                      </>
                    )}
                  </Button>
                </motion.div>
                {url && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        setUrl("");
                        setErrors([]);
                      }}
                      className="h-14 px-8"
                      data-testid="button-clear"
                    >
                      Clear
                    </Button>
                  </motion.div>
                )}
              </div>
            </form>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="p-5 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/30">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Supported Platforms
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                    <Youtube className="w-3.5 h-3.5" />
                    YouTube
                  </Badge>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-primary/5 dark:from-blue-950/30 dark:to-primary/10 rounded-xl border-l-4 border-primary"
              >
                <p className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Best Results
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Educational videos, tutorials, tech talks, and podcasts with
                  transcripts work best. Videos without available transcripts
                  cannot be analyzed.
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
