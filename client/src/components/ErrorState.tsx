import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, Youtube, FileText, Wifi, Brain, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export type ErrorType = 
  | 'transcript-disabled'
  | 'no-experiments'
  | 'api-error'
  | 'network-error'
  | 'invalid-url'
  | 'empty-content'
  | 'unsupported-platform'
  | 'gemini-error'
  | 'generic';

interface ErrorStateProps {
  errorType: ErrorType;
  message?: string;
  onRetry?: () => void;
  onNewAnalysis?: () => void;
}

const errorConfigs = {
  'transcript-disabled': {
    icon: FileText,
    title: 'Transcript Not Available',
    description: 'This video does not have transcripts enabled or available.',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    suggestions: [
      'Try a different video that has captions/transcripts enabled',
      'Look for educational or tutorial videos - they usually have transcripts',
      'Check if the video has the "CC" button available on YouTube'
    ]
  },
  'no-experiments': {
    icon: Brain,
    title: 'No LLM Experiments Found',
    description: 'The content was analyzed, but no AI/LLM experiments were detected.',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    suggestions: [
      'This tool works best with AI tutorials, automation workflows, and LLM demos',
      'Try videos about ChatGPT, LangChain, OpenAI, or AI automation tools',
      'The video might be too general - look for specific implementation tutorials'
    ]
  },
  'api-error': {
    icon: AlertCircle,
    title: 'Analysis Service Issue',
    description: 'The AI analysis service encountered an error.',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    suggestions: [
      'This is usually temporary - try again in a moment',
      'The content might be too long or complex to process',
      'If the issue persists, try a shorter video (under 30 minutes)'
    ]
  },
  'network-error': {
    icon: Wifi,
    title: 'Connection Problem',
    description: 'Unable to connect to the analysis service.',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Wait a moment and try again'
    ]
  },
  'invalid-url': {
    icon: Youtube,
    title: 'Invalid Video URL',
    description: 'The URL provided is not a valid YouTube video.',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    suggestions: [
      'Make sure the URL is from YouTube (youtube.com or youtu.be)',
      'The URL should include a video ID (e.g., ?v=xxxxx)',
      'Try copying the URL directly from your browser\'s address bar'
    ]
  },
  'empty-content': {
    icon: FileText,
    title: 'Insufficient Content',
    description: 'The video content is too short or empty to analyze.',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    suggestions: [
      'Try videos that are at least 5 minutes long',
      'Make sure the video has actual spoken content',
      'Educational content with demonstrations works best'
    ]
  },
  'unsupported-platform': {
    icon: Youtube,
    title: 'Platform Not Supported',
    description: 'Only YouTube videos are currently supported.',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    suggestions: [
      'Please use a YouTube video URL (youtube.com or youtu.be)',
      'Podcasts uploaded to YouTube are supported',
      'All YouTube video formats work (tutorials, talks, demos)'
    ]
  },
  'gemini-error': {
    icon: Brain,
    title: 'AI Analysis Error',
    description: 'The AI service encountered an issue while analyzing the content.',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    suggestions: [
      'This is usually temporary - wait a moment and try again',
      'Very long videos (>1 hour) may time out - try a shorter video',
      'The content might be too complex or unclear for analysis'
    ]
  },
  'generic': {
    icon: HelpCircle,
    title: 'Analysis Failed',
    description: 'An unexpected error occurred during analysis.',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    suggestions: [
      'Try again with a different video',
      'Make sure the video has transcripts enabled',
      'Educational and tutorial videos work best'
    ]
  }
};

export default function ErrorState({ 
  errorType, 
  message, 
  onRetry, 
  onNewAnalysis 
}: ErrorStateProps) {
  const config = errorConfigs[errorType];
  const Icon = config.icon;

  return (
    <motion.div 
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <motion.div 
            className="flex items-start gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className={`p-4 ${config.bgColor} rounded-2xl border border-current/10`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon className={`w-7 h-7 ${config.color}`} />
            </motion.div>
            <div className="flex-1">
              <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {config.title}
              </CardTitle>
              <CardDescription className="text-base mt-2 leading-relaxed">
                {message || config.description}
              </CardDescription>
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              What you can try:
            </h4>
            <div className="space-y-3">
              {config.suggestions.map((suggestion, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{suggestion}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="p-5 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h4 className="text-sm font-semibold text-foreground mb-3">Example of Good Content:</h4>
            <p className="text-sm text-foreground font-medium mb-3">
              "How to Build an AI Voice Agent with ElevenLabs and n8n"
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">AI Tutorial</Badge>
              <Badge variant="secondary" className="text-xs">Has Transcript</Badge>
              <Badge variant="secondary" className="text-xs">Technical Content</Badge>
            </div>
          </motion.div>

          <motion.div 
            className="flex gap-3 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {onRetry && (
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={onRetry}
                  variant="default"
                  size="lg"
                  className="w-full gap-2"
                  data-testid="button-retry"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              </motion.div>
            )}
            {onNewAnalysis && (
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={onNewAnalysis}
                  variant={onRetry ? "outline" : "default"}
                  size="lg"
                  className="w-full"
                  data-testid="button-new-analysis"
                >
                  Analyze Different Video
                </Button>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
