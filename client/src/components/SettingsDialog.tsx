import { useState } from 'react';
import { Settings, Key, ExternalLink, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';

export default function SettingsDialog() {
  const { apiKey, setApiKey, clearApiKey, hasApiKey, maskedKey } = useApiKey();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    if (!inputValue.trim()) {
      toast({
        title: 'API key required',
        description: 'Please enter your Gemini API key.',
        variant: 'destructive'
      });
      return;
    }

    if (!inputValue.startsWith('AIza')) {
      toast({
        title: 'Invalid API key format',
        description: 'Gemini API keys typically start with "AIza". Please check your key.',
        variant: 'destructive'
      });
      return;
    }

    setApiKey(inputValue);
    setInputValue('');
    setIsEditing(false);
    toast({
      title: 'API key saved',
      description: 'Your key is stored locally in your browser only.',
    });
  };

  const handleRemove = () => {
    clearApiKey();
    setIsEditing(false);
    toast({
      title: 'API key removed',
      description: 'Your API key has been removed from this browser.',
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setInputValue('');
      setIsEditing(false);
      setShowKey(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative"
          data-testid="button-settings"
        >
          <Settings className="h-4 w-4" />
          {hasApiKey && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Settings
          </DialogTitle>
          <DialogDescription>
            Use your own Gemini API key to analyze videos. Your key is stored in your browser and sent securely to our server only when making Gemini API calls. We do not store or log your key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasApiKey && !isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">API key configured</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Current key</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                    {showKey ? apiKey : maskedKey}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(true)}
                >
                  Change key
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="api-key">Gemini API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="AIza..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  data-testid="input-api-key"
                />
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>Get your free API key from Google AI Studio:</p>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  aistudio.google.com/apikey
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {(isEditing || !hasApiKey) && (
            <div className="flex gap-2 w-full">
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setInputValue('');
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button onClick={handleSave} className="flex-1" data-testid="button-save-api-key">
                Save API Key
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
