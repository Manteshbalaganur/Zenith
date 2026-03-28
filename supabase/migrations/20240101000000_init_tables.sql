-- Create tables for Zenith persistent storage
CREATE TABLE IF NOT EXISTS public.knowledge_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL, -- using session_id for anonymous users
  query text NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  map_data jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.exploration_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid REFERENCES public.knowledge_maps(id) ON DELETE CASCADE,
  timestamp timestamp with time zone DEFAULT now(),
  action text NOT NULL,
  node_id text NOT NULL,
  node_title text NOT NULL
);

-- Enable RLS
ALTER TABLE public.knowledge_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exploration_history ENABLE ROW LEVEL SECURITY;

-- Anonymous access policies (since we don't have full auth setup yet)
CREATE POLICY "Enable all actions for everyone" ON public.knowledge_maps
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all actions for everyone" ON public.exploration_history
  FOR ALL USING (true) WITH CHECK (true);

-- Enable real-time for both tables
alter publication supabase_realtime add table public.knowledge_maps;
alter publication supabase_realtime add table public.exploration_history;
