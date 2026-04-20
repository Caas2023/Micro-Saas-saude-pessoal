import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Mail, Lock, Activity, ArrowRight, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface AuthFormProps {
  initialMode?: 'login' | 'signup' | 'forgot' | 'reset';
}

export function AuthForm({ initialMode = 'login' }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  
  // Se o componente for remontado em modo reset, garantimos que a mensagem de envio de e-mail suma
  React.useEffect(() => {
    if (mode === 'reset') {
      setIsEmailSent(false);
    }
  }, [mode]);

  // Detectar se estamos em modo de recuperação via prop ou evento externo
  // (O App.tsx passará o estado de reset se detectar o evento PASSWORD_RECOVERY)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Bem-vindo de volta!');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Conta criada! Verifique seu e-mail.');
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setIsEmailSent(true);
        toast.success('E-mail de recuperação enviado!');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success('Senha atualizada com sucesso! Você já está logado.');
        // O Supabase já loga o usuário após o reset
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background overflow-hidden relative">
      {/* Background blobs for depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8 space-y-2">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4"
          >
            <Activity className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Saúde Pessoal
          </h1>
          <p className="text-muted-foreground">
            {mode === 'reset' ? 'Defina sua nova senha de acesso.' : 'Monitoramento clínico inteligente de ponta.'}
          </p>
        </div>

        <Card className="glass-morphism border-white/10 shadow-2xl overflow-hidden rounded-[2rem]">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {mode !== 'reset' && !isEmailSent && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground ml-1">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30"
                          placeholder="nome@exemplo.com"
                        />
                      </div>
                    </div>
                  )}

                  {isEmailSent && mode === 'forgot' && (
                    <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-3">
                      <div className="inline-flex p-2 rounded-full bg-primary/20">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg">E-mail Enviado!</h3>
                      <p className="text-sm text-muted-foreground">
                        Enviamos instruções de recuperação para <br/>
                        <span className="text-foreground font-medium">{email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground/70 italic">
                        Não esqueça de checar a pasta de Spam.
                      </p>
                    </div>
                  )}

                  {mode !== 'forgot' && mode !== 'reset' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-medium text-muted-foreground">Senha</label>
                        {mode === 'login' && (
                          <button 
                            type="button"
                            onClick={() => {
                              setMode('forgot');
                              setIsEmailSent(false);
                            }}
                            className="text-xs text-primary/70 hover:text-primary transition-colors"
                          >
                            Esqueci minha senha
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  {mode === 'reset' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground ml-1">Nova Senha</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          placeholder="Digite sua nova senha"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!isEmailSent && (
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-xl text-lg font-semibold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {loading ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' ? 'Entrar Agora' : 
                         mode === 'signup' ? 'Criar Conta' : 
                         mode === 'forgot' ? 'Enviar E-mail' : 'Atualizar Senha'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                )}

                {mode !== 'reset' && !isEmailSent && (
                  <>
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-muted-foreground">Ou continue com</span></div>
                    </div>

                    <Button variant="outline" type="button" className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 gap-2">
                      <Globe className="w-5 h-5" />
                      Social Sync
                    </Button>
                  </>
                )}
              </motion.form>
            </AnimatePresence>

            <div className="mt-8 text-center space-y-4">
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setIsEmailSent(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Não tem uma conta? Cadastre-se
                </button>
              )}
              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setIsEmailSent(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Já possui conta? Faça o login
                </button>
              )}
              {(mode === 'forgot' || isEmailSent) && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setIsEmailSent(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline decoration-primary/30"
                >
                  Voltar para o login
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          Ao entrar você concorda com nossos Termos de Uso e <br/> Políticas de Privacidade de Dados Médicos.
        </p>
      </motion.div>

      <style>{`
        .glass-morphism {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  );
}
