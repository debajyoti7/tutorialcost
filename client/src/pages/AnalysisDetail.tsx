import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Star, Eye, Edit2, Save, X, Plus, Tag,
} from "lucide-react";
import AnalysisResults from "@/components/AnalysisResults";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface AnalysisDetailData {
  id: string;
  contentInfo: { title: string; duration: string | null; platform: string; url: string; };
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
    mutationFn: async (metadata: { label?: string; tags?: string[]; isFavorite?: boolean; notes?: string; }) => {
      return apiRequest("PATCH", `/api/analyses/${id}`, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      setIsEditingMetadata(false);
      toast({ title: "Updated", description: "Analysis metadata has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update metadata", variant: "destructive" });
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

  const removeTag = (tag: string) => setEditTags(editTags.filter((t) => t !== tag));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          Loading analysis…
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="editorial-container mx-auto py-16 text-center">
          <Card className="border border-border max-w-sm mx-auto">
            <CardContent className="pt-6 pb-6">
              <h2
                className="font-semibold mb-2"
                style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem" }}
              >
                Analysis Not Found
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                This analysis doesn't exist or has been removed.
              </p>
              <Link href="/archive">
                <Button style={{ borderRadius: "100px" }}>Back to Archive</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-[58px]">
      <Header />

      {/* Sub-header */}
      <header
        className="sticky top-[58px] z-40 border-b border-border"
        style={{ background: "hsl(var(--background) / 0.88)", backdropFilter: "blur(12px)" }}
      >
        <div className="editorial-container mx-auto py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link href="/archive">
                <Button variant="ghost" size="icon" style={{ borderRadius: "100px" }} data-testid="button-back-archive">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1
                  className="truncate"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                  }}
                >
                  {analysis.label || analysis.contentInfo.title}
                </h1>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {analysis.viewCount} views
                  </span>
                  {analysis.isOwnedByCurrentSession && (
                    <Badge
                      variant="outline"
                      style={{ borderRadius: "100px", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                    >
                      Your Analysis
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                style={{ borderRadius: "100px" }}
                onClick={() => toggleFavoriteMutation.mutate(!analysis.isFavorite)}
                data-testid="button-toggle-favorite"
              >
                <Star
                  className="h-4 w-4"
                  style={
                    analysis.isFavorite
                      ? { fill: "hsl(var(--amber))", color: "hsl(var(--amber))" }
                      : {}
                  }
                />
              </Button>
              {!isEditingMetadata ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  style={{ borderRadius: "100px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                  data-testid="button-edit-metadata"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingMetadata(false)}
                    style={{ borderRadius: "100px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveMetadata}
                    disabled={updateMetadataMutation.isPending}
                    style={{ borderRadius: "100px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                    data-testid="button-save-metadata"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="py-8">
        {isEditingMetadata && (
          <div className="editorial-container mx-auto mb-6 animate-fade-up" style={{ opacity: 0 }}>
            <Card className="border border-border">
              <CardHeader>
                <CardTitle
                  className="flex items-center gap-2"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}
                >
                  <Edit2 className="h-4 w-4" style={{ color: "hsl(var(--sage))" }} />
                  Edit Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Custom Label</label>
                  <Input
                    placeholder="e.g., My RAG Chatbot Research"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    data-testid="input-label"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional custom name</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a tag…"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      data-testid="input-new-tag"
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      size="sm"
                      style={{ borderRadius: "100px" }}
                      data-testid="button-add-tag"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1"
                        style={{ borderRadius: "100px" }}
                        data-testid={`badge-tag-${tag}`}
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive transition-colors"
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
                    placeholder="Add your notes, observations, or learnings…"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    data-testid="textarea-notes"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <AnalysisResults
          data={{
            contentInfo: analysis.contentInfo,
            experiments: analysis.experiments,
            tools: analysis.tools,
            summary: analysis.summary,
            processingTime: analysis.processingTime,
          }}
          analysisId={id}
        />

        {!isEditingMetadata && analysis.notes && (
          <div className="editorial-container mx-auto mt-6">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle
                  className="flex items-center gap-2"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}
                >
                  <Tag className="h-4 w-4" style={{ color: "hsl(var(--sage))" }} />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {analysis.notes}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
