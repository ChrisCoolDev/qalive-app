-- Migration : Mise à jour des limites du Plan Free (Figma 389:1192)
-- 1. Session : 1 session test max, durée 1h forcée, mode public uniquement (pas d'access_code), pas d'upcoming
-- 2. Questions : 15 questions max par session

-- 1. RPC : get_public_session_status avec seuil à 15 questions
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
  WHERE p.id::text = v_session.user_id
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
    (NOT COALESCE(v_is_premium, FALSE) AND v_q_count >= 15) AS is_limit_reached,
    v_session.logo_url;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_session_status(TEXT) TO anon, authenticated;

-- 2. Trigger Serveur : Protection de la limite de 1 session et durée 1h (Plan Gratuit)
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
  WHERE p.id::text = NEW.user_id
  LIMIT 1;

  IF NOT COALESCE(v_is_premium, FALSE) THEN
    SELECT COUNT(*)
    INTO v_session_count
    FROM public.sessions s
    WHERE s.user_id = NEW.user_id;

    IF v_session_count >= 1 THEN
      RAISE EXCEPTION 'Free plan limit reached: 1 test session allowed. Upgrade to Pro for unlimited sessions.';
    END IF;

    -- Pas de session privée pour le plan Free
    NEW.access_code := NULL;

    -- Pas de programmation upcoming pour le plan Free
    NEW.starts_at := NULL;

    -- Forcer une expiration maximale de 1h sur le plan gratuit
    IF NEW.expires_at IS NULL OR NEW.expires_at > (NOW() + INTERVAL '1 hour 5 minutes') THEN
      NEW.expires_at := NOW() + INTERVAL '1 hour';
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

-- 3. Trigger Serveur : Protection de la limite de 15 questions sur "questions" (Plan Gratuit)
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
  WHERE p.id::text = v_session.user_id
  LIMIT 1;

  -- Appliquer la limite de 15 questions si l'organisateur est en plan Gratuit
  IF NOT COALESCE(v_is_premium, FALSE) THEN
    SELECT COUNT(*)
    INTO v_question_count
    FROM public.questions q
    WHERE q.session_id = NEW.session_id;

    IF v_question_count >= 15 THEN
      RAISE EXCEPTION 'This session has reached its limit of 15 questions (Free Plan).';
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

