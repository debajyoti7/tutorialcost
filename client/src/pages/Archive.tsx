import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Star, 
  Eye, 
  Calendar, 
  DollarSign, 
  Zap,
  Filter,
  ArrowLeft
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

  const { data: analyses = [], isLoading } = useQuery<AnalysisListItem[]>({
    queryKey: ["/api/analyses"],
  });

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = 
      analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (analysis.label && analysis.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
      analysis.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFavorite = !filterFavorites || analysis.isFavorite;
    
    return matchesSearch && matchesFavorite;
  });

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
                {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'analysis' : 'analyses'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
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
              Favorites Only
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading analyses...</div>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No analyses found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filterFavorites
                ? "Try adjusting your filters"
                : "Run your first analysis to see results here"}
            </p>
            {!searchQuery && !filterFavorites && (
              <Link href="/">
                <Button data-testid="button-new-analysis">
                  Start New Analysis
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnalyses.map((analysis) => (
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
