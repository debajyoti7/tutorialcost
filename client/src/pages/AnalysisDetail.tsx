import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Star, 
  Eye, 
  Edit2, 
  Save, 
  X,
  Plus,
  Tag
} from "lucide-react";
import AnalysisResults from "@/components/AnalysisResults";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AnalysisDetailData {
  id: string;
  contentInfo: {
    title: string;
    duration: string | null;
    platform: string;
    url: string;
  };
  experiments: any[];
  tools: any[];
  summary: any;
  processingTime: number;
  viewCount: number;
  lastViewedAt: Date | null;
  label: string | null;
  tags: string[];
  isFavorite: boolean;
  notes: string | null;
  isOwnedByCurrentSession: boolean;
  createdAt: Date;
}

export default function AnalysisDetail() {
  const [, params] = useRoute("/analysis/:id");
  const id = params?.id;
  const { toast } = useToast();

  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [editFavorite, setEditFavorite] = useState(false);

  const { data: analysis, isLoading } = useQuery<AnalysisDetailData>({
    queryKey: ["/api/analyses", id],
    enabled: !!id,
  });

  const updateMetadataMutation = useMutation({
    mutationFn: async (metadata: {
      label?: string;
      tags?: string[];
      isFavorite?: boolean;
      notes?: string;
    }) => {
      return apiRequest("PATCH", `/api/analyses/${id}`, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      setIsEditingMetadata(false);
      toast({
        title: "Updated",
        description: "Analysis metadata has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update metadata",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (isFavorite: boolean) => {
      return apiRequest("PATCH", `/api/analyses/${id}`, { isFavorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
    },
  });

  const startEditing = () => {
    if (analysis) {
      setEditLabel(analysis.label || "");
      setEditNotes(analysis.notes || "");
      setEditTags([...analysis.tags]);
      setEditFavorite(analysis.isFavorite);
      setIsEditingMetadata(true);
    }
  };

  const saveMetadata = () => {
    updateMetadataMutation.mutate({
      label: editLabel || undefined,
      tags: editTags,
      isFavorite: editFavorite,
      notes: editNotes || undefined,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading analysis...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Analysis Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This analysis doesn't exist or has been removed.
            </p>
            <Link href="/archive">
              <Button>Back to Archive</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Sticky Header with Glassmorphism */}
      <header className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Link href="/archive">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" className="hover-elevate" data-testid="button-back-archive">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <div className="min-w-0 flex-1">
                <motion.h1 
                  className="text-2xl font-bold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {analysis.label || analysis.contentInfo.title}
                </motion.h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-primary" />
                    {analysis.viewCount} views
                  </span>
                  {analysis.isOwnedByCurrentSession && (
                    <Badge variant="outline" className="text-xs">
                      Your Analysis
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover-elevate"
                  onClick={() => toggleFavoriteMutation.mutate(!analysis.isFavorite)}
                  data-testid="button-toggle-favorite"
                >
                  <Star
                    className={`h-5 w-5 ${
                      analysis.isFavorite
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
              </motion.div>
              {!isEditingMetadata ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="default" onClick={startEditing} className="gap-2" data-testid="button-edit-metadata">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="default" onClick={() => setIsEditingMetadata(false)} className="gap-2" data-testid="button-cancel-edit">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="default" onClick={saveMetadata} disabled={updateMetadataMutation.isPending} className="gap-2" data-testid="button-save-metadata">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Metadata Edit Panel with Modern Styling */}
        {isEditingMetadata && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="mb-6 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-primary" />
                  Edit Metadata
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Custom Label
                </label>
                <Input
                  placeholder="e.g., My RAG Chatbot Research"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  data-testid="input-label"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional custom name for this analysis
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    data-testid="input-new-tag"
                  />
                  <Button type="button" onClick={addTag} size="sm" data-testid="button-add-tag">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1" data-testid={`badge-tag-${tag}`}>
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                        data-testid={`button-remove-tag-${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Textarea
                  placeholder="Add your notes, observations, or learnings..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  data-testid="textarea-notes"
                />
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* Analysis Results */}
        <AnalysisResults
          data={{
            contentInfo: analysis.contentInfo,
            experiments: analysis.experiments,
            tools: analysis.tools,
            summary: analysis.summary,
            processingTime: analysis.processingTime
          }}
          analysisId={id}
        />

        {/* Notes Display (when not editing) */}
        {!isEditingMetadata && analysis.notes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mt-6 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{analysis.notes}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
