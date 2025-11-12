import { Brain, Lightbulb, Archive } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="w-full bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Content Analyzer</h1>
              <p className="text-sm text-muted-foreground">Extract LLM experiments from podcasts & videos</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber" />
              <span className="text-sm text-muted-foreground hidden sm:inline">AI-Powered Analysis</span>
            </div>
            <Link href="/archive">
              <Button variant="outline" size="sm" data-testid="button-archive">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}