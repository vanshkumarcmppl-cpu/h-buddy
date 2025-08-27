-- Create grievance reports table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.grievance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  complaint_category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  evidence_files TEXT[],
  priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for grievance reports
ALTER TABLE public.grievance_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for grievance reports
DROP POLICY IF EXISTS "Users can view their own reports" ON public.grievance_reports;
CREATE POLICY "Users can view their own reports" 
ON public.grievance_reports 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own reports" ON public.grievance_reports;
CREATE POLICY "Users can create their own reports" 
ON public.grievance_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reports" ON public.grievance_reports;
CREATE POLICY "Users can update their own reports" 
ON public.grievance_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create suspicious entities table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.suspicious_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('mobile_app', 'phone_number', 'social_media_id', 'upi_id', 'website', 'other')),
  entity_value TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_files TEXT[],
  threat_level TEXT DEFAULT 'medium' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'verified', 'false_positive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for suspicious entities
ALTER TABLE public.suspicious_entities ENABLE ROW LEVEL SECURITY;

-- Create policies for suspicious entities
DROP POLICY IF EXISTS "Users can view their own suspicious reports" ON public.suspicious_entities;
CREATE POLICY "Users can view their own suspicious reports" 
ON public.suspicious_entities 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own suspicious reports" ON public.suspicious_entities;
CREATE POLICY "Users can create their own suspicious reports" 
ON public.suspicious_entities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own suspicious reports" ON public.suspicious_entities;
CREATE POLICY "Users can update their own suspicious reports" 
ON public.suspicious_entities 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create AI chat history table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for AI chat history
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies for AI chat history
DROP POLICY IF EXISTS "Users can view their own chat history" ON public.ai_chat_history;
CREATE POLICY "Users can view their own chat history" 
ON public.ai_chat_history 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own chat history" ON public.ai_chat_history;
CREATE POLICY "Users can create their own chat history" 
ON public.ai_chat_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps (only if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_grievance_reports_updated_at ON public.grievance_reports;
CREATE TRIGGER update_grievance_reports_updated_at
  BEFORE UPDATE ON public.grievance_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_suspicious_entities_updated_at ON public.suspicious_entities;
CREATE TRIGGER update_suspicious_entities_updated_at
  BEFORE UPDATE ON public.suspicious_entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for file uploads (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
SELECT 'evidence-files', 'evidence-files', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'evidence-files'
);

-- Create storage policies
DROP POLICY IF EXISTS "Users can upload their own evidence files" ON storage.objects;
CREATE POLICY "Users can upload their own evidence files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'evidence-files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view their own evidence files" ON storage.objects;
CREATE POLICY "Users can view their own evidence files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'evidence-files' AND auth.uid()::text = (storage.foldername(name))[1]);