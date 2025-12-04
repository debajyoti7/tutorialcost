import { motion } from "framer-motion";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Chrome, 
  Download, 
  Zap, 
  Youtube, 
  MousePointer, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  ExternalLink
} from "lucide-react";

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

const installSteps = [
  {
    step: 1,
    title: "Download the Extension",
    description: "Click the download button to get the extension files"
  },
  {
    step: 2,
    title: "Open Chrome Extensions",
    description: "Go to chrome://extensions in your browser"
  },
  {
    step: 3,
    title: "Enable Developer Mode",
    description: "Toggle 'Developer mode' in the top right corner"
  },
  {
    step: 4,
    title: "Load Extension",
    description: "Click 'Load unpacked' and select the downloaded folder"
  }
];

export default function Extension() {
  const handleDownload = () => {
    window.location.href = '/api/extension/download';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="container mx-auto px-4 py-12">
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
                onClick={handleDownload}
                className="gap-3 text-lg px-8 py-6"
                data-testid="button-download-extension"
              >
                <Download className="h-5 w-5" />
                Download Extension
                <ArrowRight className="h-5 w-5" />
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
          >
            <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald" />
                  Installation Guide
                </CardTitle>
                <CardDescription>
                  Follow these steps to install the extension in Chrome
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {installSteps.map((step, index) => (
                    <div 
                      key={step.step} 
                      className="flex items-start gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        {step.step}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-medium text-foreground">
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Note:</strong> After installation, 
                    you'll see the Tutorial Cost icon in your browser toolbar. 
                    Navigate to any YouTube video and click the icon to analyze it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-primary/5 to-emerald/5 border-primary/10">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">
                  Coming Soon: Chrome Web Store
                </h3>
                <p className="text-muted-foreground mb-4">
                  We're working on getting the extension approved on the Chrome Web Store 
                  for even easier installation.
                </p>
                <Button variant="outline" disabled className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Chrome Web Store (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
