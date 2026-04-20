-- ========================================================
-- CONFIGURAÇÃO SUPABASE (VERSÃO IDEMPOTENTE)
-- ========================================================

-- TABELA DE PERFIS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA DE EXAMES
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    laboratory TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA DE RESULTADOS
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

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage own exams" ON public.exams;
CREATE POLICY "Users manage own exams" ON public.exams FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users access own results" ON public.exam_results;
CREATE POLICY "Users access own results" ON public.exam_results FOR ALL USING (
  EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_results.exam_id AND exams.user_id = auth.uid())
);

-- LÓGICA GÊNESIS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, is_admin)
    VALUES (NEW.id, NEW.email, (SELECT NOT EXISTS (SELECT 1 FROM public.profiles)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('exam_photos', 'exam_photos', true) ON CONFLICT (id) DO NOTHING;

