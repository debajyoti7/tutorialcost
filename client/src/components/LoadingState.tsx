import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Zap, Search, FileText } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingStateProps {
  currentStep?: string;
}

export default function LoadingState({ currentStep }: LoadingStateProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    { icon: Search, text: "Extracting content from URL", duration: 2000 },
    { icon: FileText, text: "Transcribing audio content", duration: 3000 }, 
    { icon: Brain, text: "Analyzing with AI for experiments", duration: 4000 },
    { icon: Zap, text: "Identifying tools and calculating costs", duration: 2000 }
  ];

  useEffect(() => {
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Update step index based on elapsed time
      let cumulativeDuration = 0;
      for (let i = 0; i < steps.length; i++) {
        cumulativeDuration += steps[i].duration;
        if (elapsed <= cumulativeDuration) {
          setStepIndex(i);
          break;
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[stepIndex]?.icon || Brain;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-border shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
              <CurrentIcon className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Analyzing Content
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Our AI is processing your content to identify LLM experiments and automation tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" data-testid="progress-analysis" />
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex;
              
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/20' 
                      : isCompleted 
                        ? 'bg-emerald/10 border border-emerald/20'
                        : 'bg-muted/30'
                  }`}
                  data-testid={`step-${index}`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted
                        ? 'bg-emerald text-emerald-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isActive 
                      ? 'text-foreground font-medium' 
                      : isCompleted
                        ? 'text-emerald font-medium'
                        : 'text-muted-foreground'
                  }`}>
                    {step.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              This usually takes 10-15 seconds depending on content length
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}