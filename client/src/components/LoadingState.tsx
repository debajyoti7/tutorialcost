import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Zap, Search, FileText, XCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface LoadingStateProps {
  currentStep?: string;
  hasFailed?: boolean;
  failedAtStep?: number;
}

export default function LoadingState({ currentStep, hasFailed = false, failedAtStep }: LoadingStateProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { icon: Search, text: "Extracting content from URL", duration: 2000 },
    { icon: FileText, text: "Transcribing audio content", duration: 3000 },
    { icon: Brain, text: "Analyzing with AI for experiments", duration: 4000 },
    { icon: Zap, text: "Identifying tools and calculating costs", duration: 2000 },
  ];

  useEffect(() => {
    if (hasFailed) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (failedAtStep !== undefined) {
        setStepIndex(failedAtStep);
        const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
        let cumulativeDuration = 0;
        for (let i = 0; i <= failedAtStep; i++) cumulativeDuration += steps[i].duration;
        setProgress(Math.min((cumulativeDuration / totalDuration) * 100, 100));
      }
      return;
    }

    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += 100;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      let cumulativeDuration = 0;
      for (let i = 0; i < steps.length; i++) {
        cumulativeDuration += steps[i].duration;
        if (elapsed <= cumulativeDuration) {
          setStepIndex(i);
          break;
        }
      }

      if (elapsed >= totalDuration && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasFailed, failedAtStep]);

  const CurrentIcon = steps[stepIndex]?.icon || Brain;

  return (
    <div className="w-full max-w-editorial mx-auto animate-fade-up">
      <Card className="border border-border">
        <CardHeader className="text-center pb-5">
          <div className="flex justify-center mb-4">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-md"
              style={{ background: "hsl(var(--sage-light))" }}
            >
              <CurrentIcon
                className="w-8 h-8"
                style={{ color: "hsl(var(--sage))" }}
              />
            </div>
          </div>
          <CardTitle
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.5rem",
              color: hasFailed ? "hsl(var(--destructive))" : "hsl(var(--foreground))",
            }}
          >
            {hasFailed ? "Analysis Failed" : "Analyzing Content"}
          </CardTitle>
          <CardDescription className="text-base mt-1">
            {hasFailed
              ? "An error occurred during the analysis process"
              : "Our AI is processing your content to identify LLM experiments and automation tools"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" data-testid="progress-analysis" />
          </div>

          <div className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isFailed = hasFailed && failedAtStep === index;
              const isActive = !hasFailed && index === stepIndex;
              const isCompleted = !hasFailed && index < stepIndex;

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-md transition-colors"
                  style={{
                    background: isFailed
                      ? "hsl(var(--destructive) / 0.08)"
                      : isActive
                      ? "hsl(var(--sage-light))"
                      : isCompleted
                      ? "hsl(var(--muted))"
                      : "transparent",
                    border: "1px solid",
                    borderColor: isFailed
                      ? "hsl(var(--destructive) / 0.25)"
                      : isActive
                      ? "hsl(var(--sage) / 0.25)"
                      : "hsl(var(--border))",
                  }}
                  data-testid={`step-${index}`}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
                    style={{
                      background: isFailed
                        ? "hsl(var(--destructive))"
                        : isActive
                        ? "hsl(var(--sage))"
                        : isCompleted
                        ? "hsl(var(--sage))"
                        : "hsl(var(--muted))",
                      color: isFailed || isActive || isCompleted ? "white" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {isFailed ? (
                      <XCircle className="w-4 h-4" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: isFailed
                        ? "hsl(var(--destructive))"
                        : isActive || isCompleted
                        ? "hsl(var(--foreground))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {step.text}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground text-center pt-2">
            This usually takes 10–15 seconds depending on content length
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
