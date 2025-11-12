import { Brain, Archive, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Header() {
  const [location] = useLocation();
  
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home">
            <motion.div 
              className="flex items-center gap-3 hover-elevate cursor-pointer rounded-lg px-2 py-1 -ml-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Content Analyzer
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  AI-powered experiment extraction
                </p>
              </div>
            </motion.div>
          </Link>
          
          <nav className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/5 to-emerald-500/5 rounded-full border border-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Powered by Gemini</span>
            </div>
            
            <Link href="/archive">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant={location === "/archive" ? "default" : "outline"} 
                  size="default"
                  className="gap-2"
                  data-testid="button-archive"
                >
                  <Archive className="h-4 w-4" />
                  <span className="hidden sm:inline">Archive</span>
                </Button>
              </motion.div>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}