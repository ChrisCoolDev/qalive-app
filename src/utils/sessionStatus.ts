import type { Session, SessionType } from '@/types'

export type SessionStatus = 'live' | 'upcoming' | 'expired'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_WEEK_MS = 7 * ONE_DAY_MS

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  qna: 'Q&A',
  survey: 'Survey',
  poll: 'Poll',
}

export function getSessionStartsAt(session: Session): Date | null {
  const raw = session.startsAt ?? session.starts_at
  return raw ? new Date(raw) : null
}

/**
 * - upcoming: has a scheduled start date in the future
 * - live: started (or no start date) and not expired yet
 * - expired: past its expiry date
 */
export function getSessionStatus(session: Session, now: Date = new Date()): SessionStatus {
  const startsAt = getSessionStartsAt(session)
  if (startsAt && startsAt.getTime() > now.getTime()) return 'upcoming'

  const rawExpires = session.expires_at ?? session.expiresAt
  if (rawExpires) {
    const expires = new Date(rawExpires)
    if (expires.getTime() <= now.getTime()) return 'expired'
  }

  const isActive = session.is_active ?? session.isActive
  return isActive === false ? 'expired' : 'live'
}

export function isSessionExpired(session?: Session | null, now: Date = new Date()): boolean {
  if (!session) return false
  return getSessionStatus(session, now) === 'expired'
}

const pad = (n: number) => String(n).padStart(2, '0')

const formatTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

const formatFullDate = (date: Date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export type SessionDateTone = 'live' | 'soon' | 'default'

/**
 * Label + tone shown on the Kanban card:
 * - live      -> "Today - Live" (green)
 * - upcoming within 7 days -> "Friday - 17:00" / "Today - 17:00" (purple)
 * - otherwise -> "12/12/2026 - 17:00" (#666)
 */
export function getSessionDateLabel(
  session: Session,
  now: Date = new Date(),
): { label: string; tone: SessionDateTone } {
  const status = getSessionStatus(session, now)

  if (status === 'live') return { label: 'Today - Live', tone: 'live' }

  const date = getSessionStartsAt(session) ?? new Date(session.createdAt ?? session.created_at ?? now)

  if (status === 'upcoming' && date.getTime() - now.getTime() <= ONE_WEEK_MS) {
    const day = isSameDay(date, now)
      ? 'Today'
      : date.toLocaleDateString('en-US', { weekday: 'long' })
    return { label: `${day} - ${formatTime(date)}`, tone: 'soon' }
  }

  return { label: `${formatFullDate(date)} - ${formatTime(date)}`, tone: 'default' }
}

/** Offset (ms) between UTC and the given IANA time zone at a given instant. */
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const asUTC = Date.UTC(+map.year, +map.month - 1, +map.day, +map.hour, +map.minute, +map.second)
  return asUTC - date.getTime()
}

/**
 * Converts a `datetime-local` value ("2026-12-12T17:00") expressed in `timeZone`
 * into a real UTC Date.
 */
export function zonedDateTimeToUtc(localValue: string, timeZone: string): Date {
  const [datePart, timePart = '00:00'] = localValue.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [h, min] = timePart.split(':').map(Number)
  const utcGuess = Date.UTC(y, m - 1, d, h, min)
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone)
  return new Date(utcGuess - offset)
}
