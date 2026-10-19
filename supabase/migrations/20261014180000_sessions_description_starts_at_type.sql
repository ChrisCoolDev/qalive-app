-- Kanban redesign: session description, scheduled start date and session type.
-- Non-destructive: only adds nullable / defaulted columns.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor).

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS starts_at   timestamptz,
  ADD COLUMN IF NOT EXISTS type        text NOT NULL DEFAULT 'qna';

ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_type_check;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_type_check CHECK (type IN ('qna', 'survey', 'poll'));
