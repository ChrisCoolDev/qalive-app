-- ============================================================================
-- MIGRATION CRITIQUE QALIVE : CORRECTIFS SÉCURITÉ, WEBHOOK & MICRO-ANALYTICS
-- ============================================================================

-- 1. Alignement de l'enum "Plan" avec le webhook Lemon Squeezy ('pro', 'cancelled_pro')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Plan') THEN
    ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'pro';
    ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'cancelled_pro';
  END IF;
END $$;

-- 2. Garantie d'existence de toutes les colonnes de production
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_portal_url TEXT,
  ADD COLUMN IF NOT EXISTS renews_at TIMESTAMPTZ;

-- 3. Fonction RPC sécurisée (SECURITY DEFINER) permettant au front public (/ask/:slug)
--    de vérifier l'état d'une session (active, limite 70 questions, statut Pro de l'hôte)
--    sans exposer la table profiles aux visiteurs anonymes.
CREATE OR REPLACE FUNCTION public.get_public_session_status(p_slug TEXT)
RETURNS TABLE (
  session_id INTEGER,
  session_name TEXT,
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN,
  is_owner_premium BOOLEAN,
  question_count BIGINT,
  is_limit_reached BOOLEAN,
  logo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_is_premium BOOLEAN := FALSE;
  v_q_count BIGINT := 0;
BEGIN
  SELECT s.id, s.name, s.expires_at, s.user_id, s.logo_url
  INTO v_session
  FROM public.sessions s
  WHERE s.slug = p_slug
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Vérifier si le créateur de la session est Premium
  SELECT COALESCE(p.is_premium, FALSE)
  INTO v_is_premium
  FROM public.profiles p
  WHERE p.id::text = v_session.user_id::text
  LIMIT 1;

  -- Compter le nombre actuel de questions
  SELECT COUNT(*)
  INTO v_q_count
  FROM public.questions q
  WHERE q.session_id = v_session.id;

  RETURN QUERY SELECT
    v_session.id,
    v_session.name,
    v_session.expires_at::timestamptz,
    (v_session.expires_at IS NOT NULL AND v_session.expires_at::timestamptz < NOW()) AS is_expired,
    COALESCE(v_is_premium, FALSE) AS is_owner_premium,
    v_q_count AS question_count,
    (NOT COALESCE(v_is_premium, FALSE) AND v_q_count >= 70) AS is_limit_reached,
    v_session.logo_url;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_session_status(TEXT) TO anon, authenticated;

-- 4. Trigger Serveur : Protection de la limite de 3 sessions et durée 2h (Plan Gratuit)
CREATE OR REPLACE FUNCTION public.enforce_session_creation_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium BOOLEAN := FALSE;
  v_session_count BIGINT := 0;
BEGIN
  SELECT COALESCE(p.is_premium, FALSE)
  INTO v_is_premium
  FROM public.profiles p
  WHERE p.id::text = NEW.user_id::text
  LIMIT 1;

  IF NOT COALESCE(v_is_premium, FALSE) THEN
    SELECT COUNT(*)
    INTO v_session_count
    FROM public.sessions s
    WHERE s.user_id::text = NEW.user_id::text;

    IF v_session_count >= 3 THEN
      RAISE EXCEPTION 'Free plan limit reached: maximum 3 sessions allowed. Upgrade to Pro for unlimited sessions.';
    END IF;

    -- Forcer une expiration maximale de 2h sur le plan gratuit
    IF NEW.expires_at IS NULL OR NEW.expires_at > (NOW() + INTERVAL '2 hours 5 minutes') THEN
      NEW.expires_at := NOW() + INTERVAL '2 hours';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_session_creation_limits ON public.sessions;
CREATE TRIGGER trg_enforce_session_creation_limits
BEFORE INSERT ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_session_creation_limits();

-- 5. Trigger Serveur : Protection de la limite de 70 questions et expiration sur "questions"
CREATE OR REPLACE FUNCTION public.enforce_question_submission_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_is_premium BOOLEAN := FALSE;
  v_question_count BIGINT := 0;
BEGIN
  SELECT s.id, s.user_id, s.expires_at
  INTO v_session
  FROM public.sessions s
  WHERE s.id = NEW.session_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found.';
  END IF;

  -- Vérifier l'expiration côté serveur
  IF v_session.expires_at IS NOT NULL AND v_session.expires_at::timestamptz < NOW() THEN
    RAISE EXCEPTION 'This questions session is over.';
  END IF;

  -- Vérifier le statut Pro du propriétaire de la session
  SELECT COALESCE(p.is_premium, FALSE)
  INTO v_is_premium
  FROM public.profiles p
  WHERE p.id::text = v_session.user_id::text
  LIMIT 1;

  -- Appliquer la limite de 70 questions si l'organisateur est en plan Gratuit
  IF NOT COALESCE(v_is_premium, FALSE) THEN
    SELECT COUNT(*)
    INTO v_question_count
    FROM public.questions q
    WHERE q.session_id = NEW.session_id;

    IF v_question_count >= 70 THEN
      RAISE EXCEPTION 'This session has reached its limit of 70 questions (Free Plan).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_question_submission_limits ON public.questions;
CREATE TRIGGER trg_enforce_question_submission_limits
BEFORE INSERT ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_question_submission_limits();

-- ============================================================================
-- 6. TABLES DU MICRO-TRACKER ANALYTICS (STYLE PLAUSIBLE MINIMALISTE SANS COOKIES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_page_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT DEFAULT 'Direct',
  utm_source TEXT,
  device_type TEXT DEFAULT 'Desktop',
  country_code TEXT DEFAULT 'XX',
  visitor_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_page_views
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'XX';

CREATE INDEX IF NOT EXISTS idx_analytics_pv_created_at ON public.analytics_page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_pv_path ON public.analytics_page_views(path);
CREATE INDEX IF NOT EXISTS idx_analytics_pv_visitor ON public.analytics_page_views(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_pv_country ON public.analytics_page_views(country_code);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_name TEXT NOT NULL,
  path TEXT,
  visitor_hash TEXT,
  user_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_ev_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_ev_name ON public.analytics_events(event_name);

-- Activer RLS sur les tables analytics
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Autoriser l'insertion anonyme et authentifiée (pour le tracker front sur app.qalive.ink)
DROP POLICY IF EXISTS "Allow public insert page_views" ON public.analytics_page_views;
CREATE POLICY "Allow public insert page_views"
  ON public.analytics_page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Restreindre la lecture (SELECT) EXCLUSIVEMENT à l'email du fondateur
DROP POLICY IF EXISTS "Allow authenticated select page_views" ON public.analytics_page_views;
DROP POLICY IF EXISTS "Allow founder select page_views" ON public.analytics_page_views;
CREATE POLICY "Allow founder select page_views"
  ON public.analytics_page_views FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('talchrist10@gmail.com', 'talchrist09@gmail.com'));

DROP POLICY IF EXISTS "Allow public insert analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public insert analytics_events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated select analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow founder select analytics_events" ON public.analytics_events;
CREATE POLICY "Allow founder select analytics_events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('talchrist10@gmail.com', 'talchrist09@gmail.com'));

