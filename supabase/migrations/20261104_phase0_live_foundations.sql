-- =============================================================================
-- QALive — Phase 0 : Fondations Live Room
-- Migration 100 % ADDITIVE : aucun DROP, aucun renommage sur sessions/questions.
-- Les sessions existantes gardent exactement leur comportement actuel.
-- =============================================================================

-- 1. Feature flags par session ------------------------------------------------
-- '{}' = comportement historique (Q&A + documents uniquement).
-- Exemple futur : '{"reactions": true, "polls": true, "slides": false}'
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. État live persistant d'une room -----------------------------------------
-- Les événements éphémères (réactions, clics) passent par Realtime Broadcast
-- et ne touchent PAS cette table. Elle ne stocke que l'état "reprenable" :
-- si l'écran de scène recharge la page, il retrouve le bon slide / sondage.
CREATE TABLE IF NOT EXISTS public.session_live_state (
  session_id     INTEGER PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
  current_slide  INTEGER NOT NULL DEFAULT 1 CHECK (current_slide >= 1),
  active_poll_id BIGINT,
  highlighted_question_id INTEGER REFERENCES public.questions(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.session_live_state ENABLE ROW LEVEL SECURITY;

-- Lecture publique : le public (anonyme) doit pouvoir suivre le slide courant
DROP POLICY IF EXISTS "Public can read live state" ON public.session_live_state;
CREATE POLICY "Public can read live state"
  ON public.session_live_state FOR SELECT
  TO anon, authenticated
  USING (true);

-- Écriture réservée au propriétaire de la session (télécommande / scène)
DROP POLICY IF EXISTS "Owner can insert live state" ON public.session_live_state;
CREATE POLICY "Owner can insert live state"
  ON public.session_live_state FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Owner can update live state" ON public.session_live_state;
CREATE POLICY "Owner can update live state"
  ON public.session_live_state FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()::text
    )
  );

-- updated_at automatique
CREATE OR REPLACE FUNCTION public.touch_session_live_state()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_session_live_state ON public.session_live_state;
CREATE TRIGGER trg_touch_session_live_state
  BEFORE UPDATE ON public.session_live_state
  FOR EACH ROW EXECUTE FUNCTION public.touch_session_live_state();

-- Diffusion des changements d'état via Realtime (postgres_changes)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.session_live_state;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END;
$$;

