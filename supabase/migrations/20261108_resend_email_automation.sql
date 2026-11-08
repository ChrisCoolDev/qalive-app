-- =============================================================================
-- qalive — Automatisation d'emails Resend & Campagne de changement de domaine
-- Idempotente : peut être exécutée en préprod et en production sans perte de données.
-- =============================================================================

-- 1. Table de file d'attente et d'historique d'envoi (anti-doublon strict)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID,
  session_id      INTEGER REFERENCES public.sessions(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name  TEXT,
  email_type      TEXT NOT NULL CHECK (
    email_type IN (
      'domain_migration',
      'welcome',
      'upcoming_reminder_30m',
      'session_recap',
      'first_session_feedback_1h'
    )
  ),
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'sent', 'failed', 'skipped')
  ),
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  resend_id       TEXT,
  error_message   TEXT,
  scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS activé : aucun accès public, uniquement accessible par l'Edge Function (service_role)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Index d'unicité 1 : 1 seul email par (recipient_email, email_type) pour les emails liés au compte
-- (domain_migration, welcome, first_session_feedback_1h)
CREATE UNIQUE INDEX IF NOT EXISTS email_logs_unique_recipient_account_idx
  ON public.email_logs (lower(recipient_email), email_type)
  WHERE session_id IS NULL;

-- Index d'unicité 2 : 1 seul email par (session_id, email_type) pour les emails liés à une session
-- (upcoming_reminder_30m, session_recap)
CREATE UNIQUE INDEX IF NOT EXISTS email_logs_unique_session_type_idx
  ON public.email_logs (session_id, email_type)
  WHERE session_id IS NOT NULL;

-- Index de performance pour dépiler rapidement les lots (Drip Queue)
CREATE INDEX IF NOT EXISTS email_logs_queue_lookup_idx
  ON public.email_logs (status, scheduled_for, created_at);

-- =============================================================================
-- 2. Fonction RPC (service_role uniquement) : Mise en file d'attente des 248 users
--    pour l'annonce du nouveau domaine (qalive.online / app.qalive.online)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_domain_migration_campaign()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
BEGIN
  INSERT INTO public.email_logs (
    user_id,
    recipient_email,
    recipient_name,
    email_type,
    status,
    scheduled_for
  )
  SELECT
    u.id,
    lower(trim(u.email)),
    COALESCE(
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1)
    ),
    'domain_migration',
    'queued',
    NOW()
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND trim(u.email) <> ''
  ON CONFLICT (lower(recipient_email), email_type) WHERE session_id IS NULL
  DO NOTHING;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_domain_migration_campaign() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_domain_migration_campaign() TO service_role;

-- =============================================================================
-- 3. Fonction RPC (service_role uniquement) : Synchronisation automatique
--    des 4 scénarios récurrents dans la file d'attente `public.email_logs`
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_automated_lifecycle_emails()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_welcome_count   INTEGER := 0;
  v_upcoming_count  INTEGER := 0;
  v_recap_count     INTEGER := 0;
  v_feedback_count  INTEGER := 0;
BEGIN
  -- A. Welcome email : nouveaux inscrits au cours des dernières 48h
  INSERT INTO public.email_logs (
    user_id,
    recipient_email,
    recipient_name,
    email_type,
    status,
    scheduled_for
  )
  SELECT
    u.id,
    lower(trim(u.email)),
    COALESCE(
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1)
    ),
    'welcome',
    'queued',
    NOW()
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND u.created_at >= NOW() - INTERVAL '48 hours'
  ON CONFLICT (lower(recipient_email), email_type) WHERE session_id IS NULL
  DO NOTHING;
  GET DIAGNOSTICS v_welcome_count = ROW_COUNT;

  -- B. Rappel 30 min avant une session "Upcoming" (starts_at entre maintenant et +30 min)
  INSERT INTO public.email_logs (
    user_id,
    session_id,
    recipient_email,
    recipient_name,
    email_type,
    status,
    payload,
    scheduled_for
  )
  SELECT
    s.user_id::uuid,
    s.id,
    lower(trim(u.email)),
    COALESCE(
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1)
    ),
    'upcoming_reminder_30m',
    'queued',
    jsonb_build_object(
      'session_name', s.name,
      'session_slug', s.slug,
      'starts_at', s.starts_at
    ),
    NOW()
  FROM public.sessions s
  JOIN auth.users u ON u.id = s.user_id::uuid
  WHERE s.starts_at IS NOT NULL
    AND s.starts_at > NOW()
    AND s.starts_at <= NOW() + INTERVAL '30 minutes'
    AND u.email IS NOT NULL
  ON CONFLICT (session_id, email_type) WHERE session_id IS NOT NULL
  DO NOTHING;
  GET DIAGNOSTICS v_upcoming_count = ROW_COUNT;

  -- C. Récapitulatif de fin de session (session expirée depuis moins de 24h)
  INSERT INTO public.email_logs (
    user_id,
    session_id,
    recipient_email,
    recipient_name,
    email_type,
    status,
    payload,
    scheduled_for
  )
  SELECT
    s.user_id::uuid,
    s.id,
    lower(trim(u.email)),
    COALESCE(
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1)
    ),
    'session_recap',
    'queued',
    jsonb_build_object(
      'session_name', s.name,
      'session_slug', s.slug,
      'question_count', (SELECT COUNT(*) FROM public.questions q WHERE q.session_id = s.id)
    ),
    NOW()
  FROM public.sessions s
  JOIN auth.users u ON u.id = s.user_id::uuid
  WHERE s.expires_at IS NOT NULL
    AND s.expires_at <= NOW()
    AND s.expires_at >= NOW() - INTERVAL '24 hours'
    AND u.email IS NOT NULL
  ON CONFLICT (session_id, email_type) WHERE session_id IS NOT NULL
  DO NOTHING;
  GET DIAGNOSTICS v_recap_count = ROW_COUNT;

  -- D. Feedback 1h après l'expiration de la TOUTE PREMIÈRE session de l'utilisateur
  WITH first_user_session AS (
    SELECT DISTINCT ON (s.user_id)
      s.id AS session_id,
      s.user_id::uuid AS user_id,
      s.name AS session_name,
      s.slug AS session_slug,
      s.expires_at
    FROM public.sessions s
    ORDER BY s.user_id, s.created_at ASC, s.id ASC
  )
  INSERT INTO public.email_logs (
    user_id,
    recipient_email,
    recipient_name,
    email_type,
    status,
    payload,
    scheduled_for
  )
  SELECT
    fs.user_id,
    lower(trim(u.email)),
    COALESCE(
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1)
    ),
    'first_session_feedback_1h',
    'queued',
    jsonb_build_object(
      'session_id', fs.session_id,
      'session_name', fs.session_name,
      'session_slug', fs.session_slug
    ),
    NOW()
  FROM first_user_session fs
  JOIN auth.users u ON u.id = fs.user_id
  WHERE fs.expires_at IS NOT NULL
    AND fs.expires_at <= NOW() - INTERVAL '1 hour'
    AND fs.expires_at >= NOW() - INTERVAL '7 days'
    AND u.email IS NOT NULL
  ON CONFLICT (lower(recipient_email), email_type) WHERE session_id IS NULL
  DO NOTHING;
  GET DIAGNOSTICS v_feedback_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'welcome_queued', v_welcome_count,
    'upcoming_queued', v_upcoming_count,
    'recap_queued', v_recap_count,
    'feedback_queued', v_feedback_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_automated_lifecycle_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_automated_lifecycle_emails() TO service_role;

