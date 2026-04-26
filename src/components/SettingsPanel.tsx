import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Brain, Cpu, Wifi, WifiOff, ExternalLink, Save, Check } from 'lucide-react';
import { useSettings, type AIProvider } from '../contexts/SettingsContext';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

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

  // Estado local para evitar múltiplos requests ao digitar
  const [localOpenai, setLocalOpenai] = useState(openaiKey || '');
  const [localAnthropic, setLocalAnthropic] = useState(anthropicKey || '');
  const [localGemini, setLocalGemini] = useState(geminiKey || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado local se as chaves mudarem externamente (ex: login)
  useEffect(() => {
    setLocalOpenai(openaiKey || '');
    setLocalAnthropic(anthropicKey || '');
    setLocalGemini(geminiKey || '');
  }, [openaiKey, anthropicKey, geminiKey]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setOpenaiKey(localOpenai);
      setAnthropicKey(localAnthropic);
      setGeminiKey(localGemini);
      toast.success("Configurações salvas e sincronizadas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectPollinations = () => {
    const params = new URLSearchParams({
      redirect_url: window.location.href,
      app_key: 'pk_saude_pessoal',
    });
    window.location.href = `https://enter.pollinations.ai/authorize?${params}`;
  };

  const providers: { id: AIProvider; name: string; icon: any; color: string }[] = [
    { id: 'gemini', name: 'Gemini 2.0 Flash', icon: Brain, color: 'text-blue-400' },
    { id: 'openai', name: 'GPT-4o-mini', icon: Cpu, color: 'text-green-400' },
    { id: 'pollinations', name: 'Pollinations AI', icon: Brain, color: 'text-purple-400' },
  ];

  return (
    <Dialog>
      <DialogTrigger 
        asChild
      >
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          {isOffline && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </DialogTrigger>
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
            <div className="space-y-3 p-4 rounded-xl border border-primary/30 bg-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-sm font-bold text-primary">Provedor Global (ADM)</h3>
                <Badge variant="secondary" className="text-[10px] uppercase">Admin Default</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 relative z-10 mt-3">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      provider === p.id 
                        ? "bg-black/40 border-primary text-primary" 
                        : "bg-black/20 border-white/5 hover:bg-black/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <p.icon className={cn("w-5 h-5", provider === p.id ? "text-primary" : p.color)} />
                      <span className="font-medium text-sm">
                        {p.name}
                      </span>
                    </div>
                    {provider === p.id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BYOP Pollinations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold opacity-70">Suas Chaves de API (BYOP)</h3>
              <Badge variant="outline" className="text-[10px] uppercase">Persistência Global</Badge>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
              <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-wider">
                Conecte sua conta ou insira chaves para usar no Celular e PC.
              </p>
              
              {/* Pollinations oauth */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Pollinations Account</label>
                {byopKey ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0 text-[10px]">Ativa</Badge>
                      <span className="text-[10px] font-mono">{byopKey.slice(0, 12)}...</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setByopKey(null)} className="h-6 px-2 text-[10px] text-rose-500">Desconectar</Button>
                  </div>
                ) : (
                  <Button onClick={handleConnectPollinations} variant="secondary" className="w-full h-9 gap-2 text-xs">
                    <ExternalLink className="w-3 h-3" /> Link Pollinations
                  </Button>
                )}
              </div>

              {/* API Keys inputs */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">OpenAI Key</label>
                  <input
                    type="password"
                    value={localOpenai}
                    onChange={(e) => setLocalOpenai(e.target.value)}
                    placeholder="sk-..."
                    className="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-xs focus:border-primary/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Anthropic Key</label>
                  <input
                    type="password"
                    value={localAnthropic}
                    onChange={(e) => setLocalAnthropic(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-xs focus:border-primary/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Gemini Key</label>
                  <input
                    type="password"
                    value={localGemini}
                    onChange={(e) => setLocalGemini(e.target.value)}
                    placeholder="AIza..."
                    className="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-xs focus:border-primary/50 outline-none transition-all"
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="w-full mt-4 bg-primary text-background hover:bg-primary/90 gap-2 font-bold"
                >
                  {isSaving ? <span className="animate-spin">🌀</span> : <Save className="w-4 h-4" />}
                  {isSaving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
ps} />;
