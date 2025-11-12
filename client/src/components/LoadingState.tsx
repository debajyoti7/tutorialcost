import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Zap, Search, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
    <motion.div 
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-6">
          <motion.div 
            className="flex justify-center mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-emerald-500/20 rounded-2xl backdrop-blur-sm border border-primary/20">
              <CurrentIcon className="w-10 h-10 text-primary" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Analyzing Content
            </CardTitle>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <CardDescription className="text-base text-muted-foreground mt-2">
              Our AI is processing your content to identify LLM experiments and automation tools
            </CardDescription>
          </motion.div>
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
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 shadow-lg shadow-primary/10' 
                      : isCompleted 
                        ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30'
                        : 'bg-muted/20 border border-border/30'
                  }`}
                  data-testid={`step-${index}`}
                >
                  <motion.div 
                    className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                      isActive 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20' 
                        : isCompleted
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <span className={`text-sm font-medium ${
                    isActive 
                      ? 'text-foreground' 
                      : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  }`}>
                    {step.text}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <motion.div 
            className="text-center pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-sm text-muted-foreground">
              This usually takes 10-15 seconds depending on content length
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}