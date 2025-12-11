import { motion } from "framer-motion";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Chrome, 
  Download, 
  Zap, 
  Youtube, 
  MousePointer, 
  BarChart3,
  ExternalLink
} from "lucide-react";

const CHROME_STORE_URL = "https://chromewebstore.google.com/detail/lfgjflkhemomgiojmkiicijlmheocmng";

const features = [
  {
    icon: Youtube,
    title: "YouTube Integration",
    description: "Automatically detects when you're watching a YouTube video"
  },
  {
    icon: MousePointer,
    title: "One-Click Analysis",
    description: "Analyze any video with a single click from your browser"
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get experiments, tools, and cost breakdowns in seconds"
  },
  {
    icon: BarChart3,
    title: "Full Details",
    description: "View complete analysis on the web app with one click"
  }
];

export default function Extension() {
  const handleInstall = () => {
    window.open(CHROME_STORE_URL, '_blank');
  };

  const handleDevDownload = () => {
    window.location.href = '/api/extension/download';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-4xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald blur-2xl opacity-20 rounded-full" />
                <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl shadow-2xl shadow-primary/30">
                  <Chrome className="w-12 h-12 text-primary-foreground" />
                </div>
              </div>
            </div>

            <div>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Chrome Extension
              </Badge>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text mb-4">
                Analyze Videos Anywhere
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get the Tutorial Cost Chrome extension and analyze YouTube videos 
                directly from your browser without leaving the page.
              </p>
            </div>

            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Button 
                size="lg" 
                onClick={handleInstall}
                className="gap-3 text-lg px-8 py-6"
                data-testid="button-install-extension"
              >
                <Chrome className="h-5 w-5" />
                Install from Chrome Web Store
                <ExternalLink className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-center mb-8">
              What You Can Do
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="h-full hover-elevate">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary/20 to-emerald/20 rounded-xl flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-primary/5 to-emerald/5 border-primary/10">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">
                  How It Works
                </h3>
                <div className="text-muted-foreground space-y-2 text-left max-w-md mx-auto">
                  <p className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <span>Install the extension from Chrome Web Store</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <span>Navigate to any YouTube tutorial video</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <span>Click the extension icon and hit "Analyze"</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <span>Get instant cost breakdowns and tool lists</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-border/50 py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Tutorial Cost - Analyze YouTube tutorials for implementation costs</p>
            <button
              onClick={handleDevDownload}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
              data-testid="link-dev-download"
            >
              <Download className="h-4 w-4" />
              Developer: Download unpacked extension
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
