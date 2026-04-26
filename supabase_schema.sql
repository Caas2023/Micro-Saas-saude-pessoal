-- 1. Enums
CREATE TYPE clinical_status AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- 2. Profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Exams
CREATE TABLE public.exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    exam_date DATE NOT NULL,
    laboratory TEXT,
    document_url TEXT NOT NULL, -- Link no Storage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Exam Results
CREATE TABLE public.exam_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    marker_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    reference_min NUMERIC,
    reference_max NUMERIC,
    clinical_status clinical_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- 6. Policies - Profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 7. Policies - Exams
CREATE POLICY "Users can view their own exams"
ON public.exams FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exams"
ON public.exams FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams"
ON public.exams FOR DELETE
USING (auth.uid() = user_id);

-- 8. Policies - Exam Results
CREATE POLICY "Users can view their own exam results"
ON public.exam_results FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.exams
        WHERE exams.id = exam_results.exam_id
        AND exams.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own exam results"
ON public.exam_results FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exams
        WHERE exams.id = exam_results.exam_id
        AND exams.user_id = auth.uid()
    )
);

-- 9. Function for Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  -- Se a tabela de perfis estiver vazia, este é o primeiro usuário do sistema (ADM)
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first;

  INSERT INTO public.profiles (id, full_name, avatar_url, is_admin)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    is_first
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Global Secrets (Configuradas pelo ADM, lidas por clientes autenticados)
CREATE TABLE public.app_secrets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT UNIQUE NOT NULL, -- Ex: 'gemini', 'openai', 'anthropic'
    key_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read secrets"
ON public.app_secrets FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins can insert secrets"
ON public.app_secrets FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins can update secrets"
ON public.app_secrets FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
