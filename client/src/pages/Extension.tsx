import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Chrome, Download, Zap, Youtube, MousePointer, BarChart3, ExternalLink, Lock, Loader2,
} from "lucide-react";

const CHROME_STORE_URL = "https://chromewebstore.google.com/detail/lfgjflkhemomgiojmkiicijlmheocmng";

const features = [
  { icon: Youtube, title: "YouTube Integration", description: "Automatically detects when you're watching a YouTube video" },
  { icon: MousePointer, title: "One-Click Analysis", description: "Analyze any video with a single click from your browser" },
  { icon: Zap, title: "Instant Results", description: "Get experiments, tools, and cost breakdowns in seconds" },
  { icon: BarChart3, title: "Full Details", description: "View complete analysis on the web app with one click" },
];

export default function Extension() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleInstall = () => window.open(CHROME_STORE_URL, '_blank');

  const handleDevDownload = () => {
    setShowPasswordDialog(true);
    setPassword("");
    setError("");
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) { setError("Please enter the password"); return; }
    setIsDownloading(true);
    setError("");
    try {
      const response = await fetch('/api/extension/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Download failed");
        setIsDownloading(false);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'content-analyzer-extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setShowPasswordDialog(false);
    } catch {
      setError("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-[58px]">
      <Header />

      <main className="flex-1 py-16">
        <div className="editorial-container mx-auto space-y-14">

          {/* Hero */}
          <div className="text-center space-y-6 animate-fade-up" style={{ opacity: 0 }}>
            <div className="flex justify-center">
              <div
                className="flex items-center justify-center w-20 h-20 rounded-md"
                style={{ background: "hsl(var(--sage-light))" }}
              >
                <Chrome className="w-10 h-10" style={{ color: "hsl(var(--sage))" }} />
              </div>
            </div>

            <Badge
              style={{
                borderRadius: "100px",
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                background: "hsl(var(--sage-light))",
                color: "hsl(var(--sage))",
                border: "1px solid hsl(var(--sage) / 0.3)",
              }}
            >
              Chrome Extension
            </Badge>

            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.8rem, 5vw, 2.75rem)",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Analyze Videos{" "}
              <em style={{ fontStyle: "italic", color: "hsl(var(--sage))" }}>
                Anywhere
              </em>
            </h1>

            <p
              className="text-muted-foreground mx-auto leading-relaxed"
              style={{ maxWidth: "500px", fontSize: "1rem" }}
            >
              Get the Tutorial Cost Chrome extension and analyze YouTube videos directly
              from your browser without leaving the page.
            </p>

            <Button
              size="lg"
              onClick={handleInstall}
              style={{
                borderRadius: "100px",
                fontSize: "0.82rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
              data-testid="button-install-extension"
            >
              <Chrome className="h-4 w-4 mr-2" />
              Install from Chrome Web Store
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Features */}
          <div className="animate-fade-up-2" style={{ opacity: 0 }}>
            <p className="section-label text-center mb-2">Features</p>
            <h2
              className="text-center mb-7"
              style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 600 }}
            >
              What You Can Do
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <Card key={feature.title} className="border border-border hover-elevate">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center"
                      style={{ background: "hsl(var(--sage-light))" }}
                    >
                      <feature.icon className="w-5 h-5" style={{ color: "hsl(var(--sage))" }} />
                    </div>
                    <div>
                      <h3
                        className="font-semibold mb-1"
                        style={{ fontFamily: "var(--font-sans)", fontSize: "0.92rem" }}
                      >
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="animate-fade-up-3" style={{ opacity: 0 }}>
            <Card className="border border-border">
              <CardContent className="p-7">
                <p className="section-label text-center mb-2">Process</p>
                <h3
                  className="text-center mb-6"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}
                >
                  How It Works
                </h3>
                <div className="space-y-4 max-w-md mx-auto">
                  {[
                    "Install the extension from Chrome Web Store",
                    "Navigate to any YouTube tutorial video",
                    "Click the extension icon and hit \"Analyze\"",
                    "Get instant cost breakdowns and tool lists",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                        style={{ background: "hsl(var(--sage))" }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <footer className="border-t border-border py-5 mt-auto">
        <div className="editorial-container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>Tutorial Cost — Analyze YouTube tutorials for implementation costs</p>
          <button
            onClick={handleDevDownload}
            className="flex items-center gap-2 hover:text-foreground transition-colors duration-150"
            data-testid="link-dev-download"
          >
            <Download className="h-4 w-4" />
            Developer: Download unpacked extension
          </button>
        </div>
      </footer>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
              <Lock className="h-4 w-4" />
              Developer Download
            </DialogTitle>
            <DialogDescription>
              Enter the password to download the unpacked extension.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                style={{ borderRadius: "100px" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordSubmit}
                disabled={isDownloading}
                style={{ borderRadius: "100px" }}
              >
                {isDownloading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Downloading…</>
                ) : (
                  <><Download className="h-4 w-4 mr-1" /> Download</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
