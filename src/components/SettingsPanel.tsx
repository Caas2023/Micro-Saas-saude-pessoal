import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Brain, Cpu, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { useSettings, type AIProvider } from '../contexts/SettingsContext';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from "@/lib/utils";

export const SettingsPanel: React.FC = () => {
  const { 
    provider, setProvider, 
    byopKey, setByopKey, 
    openaiKey, setOpenaiKey,
    anthropicKey, setAnthropicKey,
    geminiKey, setGeminiKey,
    isOffline 
  } = useSettings();
  const { isAdmin } = useAuthStore();

  const handleConnectPollinations = () => {
    const params = new URLSearchParams({
      redirect_url: window.location.href,
      app_key: 'pk_saude_pessoal', // Placeholder App Key
    });
    window.location.href = `https://enter.pollinations.ai/authorize?${params}`;
  };

  const providers: { id: AIProvider; name: string; icon: any; color: string }[] = [
    { id: 'gemini', name: 'Gemini 1.5 Pro', icon: Brain, color: 'text-blue-400' },
    { id: 'openai', name: 'GPT-4o-mini', icon: Cpu, color: 'text-green-400' },
    { id: 'pollinations', name: 'Pollinations AI', icon: Activity, color: 'text-purple-400' },
  ];

  return (
    <Dialog>
      <DialogTrigger 
        render={
          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            {isOffline && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
            )}
          </Button>
        }
      />
      <DialogContent className="glass border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" /> Configurações de IA & Sistema
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Network Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
              {isOffline ? <WifiOff className="w-5 h-5 text-rose-500" /> : <Wifi className="w-5 h-5 text-emerald-500" />}
              <span className="text-sm font-medium">Status da Rede</span>
            </div>
            <Badge variant={isOffline ? "destructive" : "secondary"} className={cn(!isOffline && "bg-emerald-500/10 text-emerald-500")}>
              {isOffline ? "Offline" : "Online"}
            </Badge>
          </div>

          {/* AI Providers (ADM Only) */}
          {isAdmin && (
            <div className="space-y-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-sm font-bold text-destructive">Painel ADM Global</h3>
                <Badge variant="destructive" className="text-[10px] uppercase">Admin</Badge>
              </div>
              <p className="text-xs text-muted-foreground relative z-10">
                Configure o motor de OCR primário para todos os usuários que não possuem chaves BYOP.
              </p>
              <div className="grid grid-cols-1 gap-2 relative z-10 mt-3">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      provider === p.id 
                        ? "bg-black/40 border-destructive text-primary" 
                        : "bg-black/20 border-white/5 hover:bg-black/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <p.icon className={cn("w-5 h-5", provider === p.id ? "text-primary" : p.color)} />
                      <span className="font-medium text-sm text-left leading-tight">
                        {p.name}
                        {p.id === 'gemini' && <span className="block text-[10px] text-muted-foreground font-normal">Recomendado (Maior precisão clínica)</span>}
                      </span>
                    </div>
                    {provider === p.id && <div className="w-2 h-2 rounded-full bg-destructive" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BYOP Pollinations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold opacity-70">Bring Your Own Pollen (BYOP)</h3>
              <Badge variant="outline" className="text-[10px] uppercase">Beta</Badge>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conecte sua conta Pollinations ou insira suas próprias chaves de API para processar exames.
              </p>
              
              {/* Pollinations oauth */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Pollinations (OAuth)</label>
                {byopKey ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0 text-[10px]">Conectado</Badge>
                      <span className="text-[10px] font-mono">{byopKey.slice(0, 12)}...</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setByopKey(null)} className="h-6 px-2 text-[10px] text-rose-500">Sair</Button>
                  </div>
                ) : (
                  <Button onClick={handleConnectPollinations} className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white gap-2 text-sm">
                    <ExternalLink className="w-4 h-4" /> Conectar Pollinations
                  </Button>
                )}
              </div>

              {/* API Keys inputs */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">OpenAI API Key</label>
                  <input
                    type="password"
                    value={openaiKey || ''}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full h-9 px-3 rounded-lg bg-black/20 border border-white/10 text-xs focus:border-purple-500/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Anthropic API Key</label>
                  <input
                    type="password"
                    value={anthropicKey || ''}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full h-9 px-3 rounded-lg bg-black/20 border border-white/10 text-xs focus:border-purple-500/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Gemini API Key</label>
                  <input
                    type="password"
                    value={geminiKey || ''}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full h-9 px-3 rounded-lg bg-black/20 border border-white/10 text-xs focus:border-purple-500/50 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Mock utility functions to avoid import issues
const Activity = (props: any) => <Brain {...props} />;
