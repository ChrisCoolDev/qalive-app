-- Alignement de l'enum "Plan" avec le webhook Lemon Squeezy ('pro', 'cancelled_pro')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Plan') THEN
    ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'pro';
    ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'cancelled_pro';
  END IF;
END $$;

-- Garantie d'existence de toutes les colonnes de production
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_portal_url TEXT,
  ADD COLUMN IF NOT EXISTS renews_at TIMESTAMPTZ;

-- Tables du Micro-Tracker Analytics (style Plausible minimaliste sans cookies)
CREATE TABLE IF NOT EXISTS public.analytics_page_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT DEFAULT 'Direct',
  utm_source TEXT,
  device_type TEXT DEFAULT 'Desktop',
  visitor_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_pv_created_at ON public.analytics_page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_pv_path ON public.analytics_page_views(path);
CREATE INDEX IF NOT EXISTS idx_analytics_pv_visitor ON public.analytics_page_views(visitor_hash);

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

