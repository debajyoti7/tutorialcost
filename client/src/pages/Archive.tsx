import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Star, 
  Eye, 
  Calendar, 
  DollarSign, 
  Zap,
  Filter,
  ArrowLeft,
  SlidersHorizontal
} from "lucide-react";
import { format } from "date-fns";

interface AnalysisListItem {
  id: string;
  title: string;
  label: string | null;
  platform: string;
  url: string;
  experimentsCount: number;
  toolsCount: number;
  summary: {
    totalCostMin: number;
    totalCostMax: number;
    difficultyLevel: string;
  };
  viewCount: number;
  lastViewedAt: Date | null;
  tags: string[];
  isFavorite: boolean;
  notes: string | null;
  isOwnedByCurrentSession: boolean;
  createdAt: Date;
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

  // Extract all unique tags from analyses
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    analyses.forEach(analysis => {
      analysis.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [analyses]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredAndSortedAnalyses = useMemo(() => {
    let filtered = analyses.filter(analysis => {
      // Search filter
      const matchesSearch = 
        analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (analysis.label && analysis.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
        analysis.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Favorites filter
      const matchesFavorite = !filterFavorites || analysis.isFavorite;
      
      // Tags filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => analysis.tags.includes(tag));
      
      // Cost range filter
      let matchesCost = true;
      if (costRange !== "all") {
        const maxCost = analysis.summary.totalCostMax;
        if (costRange === "free") {
          matchesCost = maxCost === 0;
        } else if (costRange === "low") {
          matchesCost = maxCost > 0 && maxCost <= 50;
        } else if (costRange === "medium") {
          matchesCost = maxCost > 50 && maxCost <= 200;
        } else if (costRange === "high") {
          matchesCost = maxCost > 200;
        }
      }
      
      return matchesSearch && matchesFavorite && matchesTags && matchesCost;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "most-viewed") {
        return b.viewCount - a.viewCount;
      }
      return 0;
    });

    return filtered;
  }, [analyses, searchQuery, filterFavorites, selectedTags, costRange, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Archived Experiments</h1>
              <p className="text-sm text-muted-foreground">
                {filteredAndSortedAnalyses.length} {filteredAndSortedAnalyses.length === 1 ? 'analysis' : 'analyses'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, URL, label, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Button
              variant={filterFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterFavorites(!filterFavorites)}
              data-testid="button-filter-favorites"
            >
              <Star className={`h-4 w-4 mr-2 ${filterFavorites ? 'fill-current' : ''}`} />
              Favorites
            </Button>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            {/* Tags Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-filter-tags">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {allTags.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No tags available
                  </div>
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

            {/* Cost Range Filter */}
            <Select value={costRange} onValueChange={setCostRange}>
              <SelectTrigger className="w-[180px]" data-testid="select-cost-range">
                <SelectValue placeholder="Cost Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Costs</SelectItem>
                <SelectItem value="free">Free ($0)</SelectItem>
                <SelectItem value="low">Low ($1-50)</SelectItem>
                <SelectItem value="medium">Medium ($51-200)</SelectItem>
                <SelectItem value="high">High ($200+)</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort">
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
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading analyses...</div>
          </div>
        ) : filteredAndSortedAnalyses.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No analyses found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filterFavorites || selectedTags.length > 0 || costRange !== "all"
                ? "Try adjusting your filters"
                : "Run your first analysis to see results here"}
            </p>
            {!searchQuery && !filterFavorites && selectedTags.length === 0 && costRange === "all" && (
              <Link href="/">
                <Button data-testid="button-new-analysis">
                  Start New Analysis
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedAnalyses.map((analysis) => (
              <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
                <Card className="h-full hover-elevate cursor-pointer transition-all" data-testid={`card-analysis-${analysis.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" title={analysis.label || analysis.title}>
                          {analysis.label || analysis.title}
                        </h3>
                        {analysis.label && (
                          <p className="text-xs text-muted-foreground truncate" title={analysis.title}>
                            {analysis.title}
                          </p>
                        )}
                      </div>
                      {analysis.isFavorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Tags */}
                    {analysis.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {analysis.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {analysis.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{analysis.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Platform Badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {analysis.platform}
                      </Badge>
                      {analysis.isOwnedByCurrentSession && (
                        <Badge variant="outline" className="text-xs">
                          Your Analysis
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{analysis.experimentsCount} exp</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          ${analysis.summary.totalCostMin}-${analysis.summary.totalCostMax}
                        </span>
                      </div>
                    </div>

                    {/* View count and difficulty */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{analysis.viewCount} views</span>
                      </div>
                      <Badge variant="secondary" className="text-xs w-fit">
                        {analysis.summary.difficultyLevel}
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(analysis.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
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
