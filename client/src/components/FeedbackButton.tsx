import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FeedbackButtonProps {
  analysisId: string;
  feedbackType: "overall" | "experiment" | "tool";
  targetId?: string;
  variant?: "default" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function FeedbackButton({ 
  analysisId, 
  feedbackType, 
  targetId,
  variant = "ghost",
  size = "icon"
}: FeedbackButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<"positive" | "negative" | null>(null);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const feedbackMutation = useMutation({
    mutationFn: async (data: {
      analysisId: string;
      feedbackType: string;
      targetId?: string;
      sentiment: string;
      comment?: string;
    }) => {
      return apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      toast({
        title: "Thanks for your feedback!",
        description: "Your input helps us improve the analysis quality.",
      });
      setIsDialogOpen(false);
      setComment("");
      setSelectedSentiment(null);
    },
    onError: () => {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleThumbsClick = (sentiment: "positive" | "negative") => {
    setSelectedSentiment(sentiment);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedSentiment) return;

    feedbackMutation.mutate({
      analysisId,
      feedbackType,
      targetId,
      sentiment: selectedSentiment,
      comment: comment.trim() || undefined,
    });
  };

  const handleSkipComment = () => {
    if (!selectedSentiment) return;

    feedbackMutation.mutate({
      analysisId,
      feedbackType,
      targetId,
      sentiment: selectedSentiment,
    });
  };

  return (
    <>
      <div className="flex items-center gap-1" data-testid={`feedback-${feedbackType}${targetId ? `-${targetId}` : ''}`}>
        <Button
          variant={variant}
          size={size}
          onClick={() => handleThumbsClick("positive")}
          data-testid={`button-thumbs-up-${feedbackType}${targetId ? `-${targetId}` : ''}`}
          className="hover-elevate active-elevate-2"
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant={variant}
          size={size}
          onClick={() => handleThumbsClick("negative")}
          data-testid={`button-thumbs-down-${feedbackType}${targetId ? `-${targetId}` : ''}`}
          className="hover-elevate active-elevate-2"
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSentiment === "positive" ? "What went well?" : "What could be better?"}
            </DialogTitle>
            <DialogDescription>
              {selectedSentiment === "positive"
                ? "Help us understand what you found useful."
                : "Let us know how we can improve this analysis."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Share your thoughts (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px]"
              data-testid="input-feedback-comment"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkipComment}
              disabled={feedbackMutation.isPending}
              data-testid="button-skip-comment"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={feedbackMutation.isPending}
              data-testid="button-submit-feedback"
            >
              {feedbackMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
