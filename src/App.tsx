import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/useAuthStore';
import { FileUpload } from './components/FileUpload';
import { DataGrid } from './components/DataGrid';
import { EvolutionChart } from './components/EvolutionChart';
import { useExams } from './hooks/useExams';
import { visionService } from './services/visionService';
import type { ExamMarker, SavedResult } from './types/exam';
import { Toaster, toast } from 'sonner';
import { 
  Activity, 
  History, 
  Plus, 
  User as UserIcon, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  LogOut
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { calculateDelta } from './lib/calculations';
import { Badge } from './components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

import { useSettings } from './contexts/SettingsContext';
import { SettingsPanel } from './components/SettingsPanel';
import { AuthForm } from './components/AuthForm';
import { storageService } from './services/storageService';
import { cn } from './lib/utils';

function App() {
  const { user, setUser, loading, setLoading, fetchProfile } = useAuthStore();
  const { provider, geminiKey, openaiKey, anthropicKey, byopKey, setByopKey } = useSettings();
  const [view, setView] = useState<'dashboard' | 'upload' | 'review'>('dashboard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExamMarker[]>([]);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const { getExams, saveExamMutation } = useExams(user?.id || "");

  // Capturar chave BYOP do fragmento da URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const apiKey = hashParams.get('api_key');
    if (apiKey) {
      setByopKey(apiKey);
      window.location.hash = ''; // Limpar URL
      toast.success("Conta Pollinations conectada!");
    }
  }, [setByopKey]);

  useEffect(() => {
    console.log("App version 1.1 loaded");
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Fallback: Detectar modo de recuperação via URL caso o evento demore a chegar
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
      setIsResettingPassword(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      setUser(session?.user ?? null);
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      } else if (event === 'SIGNED_IN') {
        // Se já estávamos resetando e o evento foi SIGNED_IN (após reset com sucesso), limpamos o estado
        // Mas o resetPassword for email não dispara SIGNED_IN automaticamente da mesma forma.
        // Vamos manter o isResettingPassword até que o usuário execute a ação no AuthForm.
      } else if (event === 'SIGNED_OUT') {
        setIsResettingPassword(false);
      }

      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, fetchProfile]);

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      // 1. Upload para o Storage primeiro
      const publicUrl = await storageService.uploadExamPhoto(file, user.id);
      setDocumentUrl(publicUrl);
      
      // 2. Extrair dados via Vision API
      const currentKey = 
        provider === 'gemini' ? geminiKey :
        provider === 'openai' ? openaiKey :
        provider === 'anthropic' ? anthropicKey :
        byopKey;

      const data = await visionService.extractExamData(file, provider, currentKey);
      
      // 3. Salvar URL no estado temporário para o Review
      setExtractedData(data.results);
      setView('review');
      toast.success("Foto salva e dados extraídos com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar exame. Verifique sua chave de API e conexão.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveExam = async (finalResults: SavedResult[]) => {
    if (!user) return;
    
    try {
      await saveExamMutation.mutateAsync({
        examData: {
          user_id: user.id,
          exam_date: new Date().toISOString().split('T')[0],
          laboratory: "Laboratório Extraído",
          document_url: documentUrl
        },
        results: finalResults
      });
      toast.success("Exame salvo com sucesso!");
      setView('dashboard');
    } catch (error) {
      toast.error("Erro ao salvar exame no banco de dados.");
    }
  };

  /* handleLogin removido pois agora usamos o AuthForm */

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user || isResettingPassword) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AuthForm 
          initialMode={isResettingPassword ? 'reset' : 'login'} 
          onSuccess={() => setIsResettingPassword(false)}
        />
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-background" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Saúde Pessoal v1.1</span>
          </div>
          
          <div className="flex items-center gap-4">
            <SettingsPanel />
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold">Monitoramento Evolutivo</h1>
                  <p className="text-muted-foreground">Acompanhe sua saúde baseado em dados laboratoriais precisos.</p>
                </div>
                <Button onClick={() => setView('upload')} className="h-12 px-6 rounded-xl gap-2 shadow-lg shadow-primary/10">
                  <Plus className="w-5 h-5" /> Adicionar Exame
                </Button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Historical List */}
                <Card className="lg:col-span-2 glass border-white/5">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" /> Últimas Análises
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {getExams.data && getExams.data.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {getExams.data.map((exam, idx) => (
                          <div key={exam.id} className="p-6 hover:bg-white/5 transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="font-semibold text-lg">{new Date(exam.exam_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
                                <p className="text-sm text-muted-foreground">{exam.laboratory}</p>
                              </div>
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                {exam.exam_results?.length} Marcadores
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {exam.exam_results?.slice(0, 4).map((result: any) => {
                                // Lógica Delta Simples para Demo
                                const prevExam = getExams.data?.[idx + 1];
                                const prevResult = prevExam?.exam_results?.find((r: any) => r.marker_name === result.marker_name);
                                const delta = prevResult ? calculateDelta(result.value, prevResult.value) : null;

                                return (
                                  <div 
                                    key={result.id} 
                                    className="p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-primary/30 transition-all group"
                                    onClick={() => setSelectedMarker(result.marker_name)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-muted-foreground">{result.marker_name}</span>
                                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-primary" />
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-lg font-bold">{result.value}</span>
                                      <span className="text-xs opacity-50">{result.unit}</span>
                                      {delta !== null && (
                                        <span className={cn(
                                          "flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full",
                                          delta > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                        )}>
                                          {delta > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                          {Math.abs(delta).toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-muted-foreground">
                        Nenhum exame cadastrado. Clique em "Adicionar Exame" para começar.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Focus/Charts Sidebar */}
                <div className="space-y-6">
                  {selectedMarker && getExams.data ? (
                    <EvolutionChart 
                      markerName={selectedMarker}
                      unit={getExams.data[0]?.exam_results?.find((r: any) => r.marker_name === selectedMarker)?.unit || ""}
                      data={getExams.data
                        .filter((e: any) => e.exam_results.some((r: any) => r.marker_name === selectedMarker))
                        .reverse()
                        .map((e: any) => ({
                          date: new Date(e.exam_date).toLocaleDateString('pt-BR', { month: 'short' }),
                          value: e.exam_results.find((r: any) => r.marker_name === selectedMarker)?.value || 0
                        }))
                      }
                      minRef={getExams.data[0]?.exam_results?.find((r: any) => r.marker_name === selectedMarker)?.reference_min}
                      maxRef={getExams.data[0]?.exam_results?.find((r: any) => r.marker_name === selectedMarker)?.reference_max}
                    />
                  ) : (
                    <Card className="glass border-white/5 border-dashed bg-transparent h-[400px] flex items-center justify-center text-center p-8">
                      <p className="text-muted-foreground text-sm">Selecione um marcador na lista para ver seu histórico evolutivo.</p>
                    </Card>
                  )}

                  <Card className="glass bg-primary/5 border-primary/20">
                     <CardHeader>
                        <CardTitle className="text-sm">Status de Saúde</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="space-y-4">
                           <div className="flex justify-between text-xs">
                              <span className="opacity-70">Marcadores Estáveis</span>
                              <span className="font-bold">85%</span>
                           </div>
                           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-primary w-[85%]" />
                           </div>
                        </div>
                     </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Novo Exame</h2>
                  <p className="text-muted-foreground text-sm">Faça o upload do documento original.</p>
                </div>
                <Button variant="ghost" onClick={() => setView('dashboard')}>Cancelar</Button>
              </div>
              <FileUpload onFileSelect={handleFileUpload} isProcessing={isProcessing} />
            </motion.div>
          )}

          {view === 'review' && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
               <DataGrid 
                initialMarkers={extractedData} 
                onSave={handleSaveExam}
                isSaving={saveExamMutation.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Pollinations.ai Branding */}
      <footer className="w-full py-8 mt-auto border-t border-white/5 flex items-center justify-center">
        <a 
          href="https://pollinations.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="opacity-50 hover:opacity-100 transition-opacity duration-300 flex items-center gap-2"
        >
          <span className="text-xs text-muted-foreground font-medium tracking-wide">BUILT WITH</span>
          <img 
            src="https://pollinations.ai/pollinations_logo_text_white.png" 
            alt="pollinations.ai" 
            className="h-4"
          />
        </a>
      </footer>
    </div>
  );
}

export default App;
