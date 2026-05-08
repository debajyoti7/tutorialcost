import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Star, Eye, Calendar, DollarSign, Zap, Filter, ArrowLeft, SlidersHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/Header";

interface AnalysisListItem {
  id: string; title: string; label: string | null; platform: string; url: string;
  experimentsCount: number; toolsCount: number;
  summary: { totalCostMin: number; totalCostMax: number; difficultyLevel: 'Easy' | 'Intermediate' | 'Advanced' | 'Not AI'; };
  viewCount: number; lastViewedAt: Date | null; tags: string[]; isFavorite: boolean;
  notes: string | null; isOwnedByCurrentSession: boolean; createdAt: Date;
}

export default function Archive() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [costRange, setCostRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: analyses = [], isLoading } = useQuery<AnalysisListItem[]>({
    queryKey: ["/api/analyses"],
  });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    analyses.forEach(a => a.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [analyses]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const filteredAndSortedAnalyses = useMemo(() => {
    let filtered = analyses.filter(analysis => {
      const matchesSearch =
        analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (analysis.label && analysis.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
        analysis.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFavorite = !filterFavorites || analysis.isFavorite;
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => analysis.tags.includes(tag));
      let matchesCost = true;
      if (costRange !== "all") {
        const maxCost = analysis.summary.totalCostMax;
        if (costRange === "free") matchesCost = maxCost === 0;
        else if (costRange === "low") matchesCost = maxCost > 0 && maxCost <= 50;
        else if (costRange === "medium") matchesCost = maxCost > 50 && maxCost <= 200;
        else if (costRange === "high") matchesCost = maxCost > 200;
      }
      return matchesSearch && matchesFavorite && matchesTags && matchesCost;
    });

    filtered.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "most-viewed") return b.viewCount - a.viewCount;
      return 0;
    });

    return filtered;
  }, [analyses, searchQuery, filterFavorites, selectedTags, costRange, sortBy]);

  const difficultyColor = (level: string) => {
    if (level === 'Easy') return "hsl(var(--sage))";
    if (level === 'Advanced') return "hsl(var(--amber))";
    return "hsl(var(--muted-foreground))";
  };

  return (
    <div className="min-h-screen bg-background pt-[58px]">
      <Header />

      {/* Page header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="editorial-container py-8 mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <Button variant="ghost" size="icon" style={{ borderRadius: "100px" }} data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <p className="section-label mb-0.5">Collection</p>
              <h1
                className="animate-fade-up"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "2rem",
                  fontWeight: 700,
                  opacity: 0,
                }}
              >
                Archived Experiments
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filteredAndSortedAnalyses.length}{" "}
                {filteredAndSortedAnalyses.length === 1 ? "analysis" : "analyses"} in your collection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div
        className="sticky top-[58px] z-40 border-b border-border"
        style={{ background: "hsl(var(--background) / 0.9)", backdropFilter: "blur(12px)" }}
      >
        <div className="editorial-container py-3 mx-auto space-y-2">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by title, URL, label, or tags…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Button
              variant={filterFavorites ? "default" : "outline"}
              onClick={() => setFilterFavorites(!filterFavorites)}
              size="default"
              style={{ borderRadius: "100px", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
              data-testid="button-filter-favorites"
            >
              <Star className={`h-3.5 w-3.5 mr-1.5 ${filterFavorites ? 'fill-current' : ''}`} />
              Favorites
            </Button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" style={{ borderRadius: "100px", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }} data-testid="button-filter-tags">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {allTags.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No tags available</div>
                ) : (
                  allTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                      data-testid={`checkbox-tag-${tag}`}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={costRange} onValueChange={setCostRange}>
              <SelectTrigger className="w-[150px]" data-testid="select-cost-range">
                <SelectValue placeholder="Cost Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Costs</SelectItem>
                <SelectItem value="free">Free ($0)</SelectItem>
                <SelectItem value="low">Low ($1–50)</SelectItem>
                <SelectItem value="medium">Medium ($51–200)</SelectItem>
                <SelectItem value="high">High ($200+)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]" data-testid="select-sort">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="most-viewed">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="editorial-container py-10 mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Loading analyses…
          </div>
        ) : filteredAndSortedAnalyses.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h2
              style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem" }}
              className="font-semibold mb-2"
            >
              No analyses found
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              {searchQuery || filterFavorites || selectedTags.length > 0 || costRange !== "all"
                ? "Try adjusting your filters"
                : "Run your first analysis to see results here"}
            </p>
            {!searchQuery && !filterFavorites && selectedTags.length === 0 && costRange === "all" && (
              <Link href="/">
                <Button
                  style={{ borderRadius: "100px", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}
                  data-testid="button-new-analysis"
                >
                  Start New Analysis
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAndSortedAnalyses.map((analysis, index) => (
              <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
                <Card
                  className="h-full hover-elevate cursor-pointer border border-border transition-all"
                  data-testid={`card-analysis-${analysis.id}`}
                  style={{
                    animationDelay: `${index * 0.04}s`,
                  }}
                >
                  <CardHeader className="pb-2 flex-row items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold truncate leading-snug"
                        style={{ fontFamily: "var(--font-serif)" }}
                        title={analysis.label || analysis.title}
                      >
                        {analysis.label || analysis.title}
                      </h3>
                      {analysis.label && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{analysis.title}</p>
                      )}
                    </div>
                    {analysis.isFavorite && (
                      <Star className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--amber))", fill: "hsl(var(--amber))" }} />
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    {analysis.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {analysis.tags.length > 3 && (
                          <Badge
                            variant="secondary"
                            style={{ borderRadius: "100px", fontSize: "0.68rem" }}
                          >
                            +{analysis.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        style={{ borderRadius: "100px", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}
                      >
                        {analysis.platform}
                      </Badge>
                      {analysis.isOwnedByCurrentSession && (
                        <Badge
                          variant="outline"
                          style={{ borderRadius: "100px", fontSize: "0.68rem" }}
                        >
                          Your Analysis
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                        {analysis.experimentsCount} exp
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">${analysis.summary.totalCostMin}–${analysis.summary.totalCostMax}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Eye className="h-3.5 w-3.5 flex-shrink-0" />
                        {analysis.viewCount} views
                      </span>
                      <Badge
                        variant="secondary"
                        style={{
                          borderRadius: "100px",
                          fontSize: "0.68rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: difficultyColor(analysis.summary.difficultyLevel),
                        }}
                      >
                        {analysis.summary.difficultyLevel}
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="text-xs text-muted-foreground pt-2 flex-wrap gap-1">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    {format(new Date(analysis.createdAt), 'MMM d, yyyy')}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
