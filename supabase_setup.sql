-- ========================================================
-- CONFIGURAÇÃO GLOBAL SUPABASE - MICRO SAS SAÚDE
-- ========================================================

-- Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- 1. TABELA DE PERFIS (PROFILES)
-- Esta tabela armazena metadados dos usuários vinculados ao auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE EXAMES (EXAMS)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    laboratory TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE RESULTADOS DOS EXAMES (EXAM_RESULTS)
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    marker_name TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    reference_min NUMERIC,
    reference_max NUMERIC,
    clinical_status TEXT CHECK (clinical_status IN ('LOW', 'NORMAL', 'HIGH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ========================================================

-- Perfis: Usuários vêem o próprio perfil; Admins vêem tudo.
CREATE POLICY "Users view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles" ON public.profiles 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Exames e Resultados (Mesma lógica anterior)
CREATE POLICY "Users manage own exams" ON public.exams 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own results" ON public.exam_results 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_results.exam_id AND exams.user_id = auth.uid())
);

-- ========================================================
-- LÓGICA GÊNESIS (O PRIMEIRO É ADMIN)
-- ========================================================

-- Função que cria perfil automaticamente e define Admin se for o primeiro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first_user BOOLEAN;
BEGIN
    -- Verifica se é o primeiro usuário na tabela profiles
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (NEW.id, NEW.email, is_first_user);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para disparar a função no cadastro do Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- STORAGE BUCKET
-- ========================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exam_photos', 'exam_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage simplificadas para desenvolvimento
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'exam_photos');
CREATE POLICY "Auth Insert Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exam_photos' AND auth.role() = 'authenticated');
