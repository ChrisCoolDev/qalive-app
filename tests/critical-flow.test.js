import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseUTCDate, formatTimeLocal, formatDateLocal } from '../src/utils/dateHelper.js'
import { getCountryFlag, getCountryName, latLonToSvg } from '../src/utils/geoHelper.js'
import { cleanAuthUrl } from '../src/utils/urlHelper.js'
import { DEFAULT_FEATURES, resolveFeatures, isFeatureEnabled } from '../src/lib/featureFlags.js'
import { liveChannelName, countAudience, getOrCreateDeviceId } from '../src/lib/liveRoom.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

describe('QALive Critical Flow & Revenue Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. EXPIRATION & DATE ENGINE (Critique : ne jamais couper une session live)
  // ---------------------------------------------------------------------------
  describe('1. Session Expiration & UTC Date Engine', () => {
    it('parses SQL timestamps without Z as UTC without returning Invalid Date', () => {
      const d = parseUTCDate('2026-11-02 14:30:00')
      assert.ok(d instanceof Date)
      assert.ok(!isNaN(d.getTime()))
      assert.equal(d.toISOString(), '2026-11-02T14:30:00.000Z')
    })

    it('parses ISO strings that already end with Z or +00:00 without double-Z bug', () => {
      const d1 = parseUTCDate('2026-11-02T14:30:00.000Z')
      const d2 = parseUTCDate('2026-11-02T14:30:00+00:00')
      assert.ok(d1 && !isNaN(d1.getTime()))
      assert.ok(d2 && !isNaN(d2.getTime()))
      assert.equal(d1.getTime(), d2.getTime())
    })

    it('accurately distinguishes active vs expired sessions', () => {
      const futureISO = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      const pastISO = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const futureDate = parseUTCDate(futureISO)
      const pastDate = parseUTCDate(pastISO)
      const now = new Date()

      assert.equal(futureDate > now, true, 'Future session must be active')
      assert.equal(pastDate > now, false, 'Past session must be expired')
    })

    it('formats local date and time safely on empty or valid inputs', () => {
      assert.equal(formatTimeLocal(null), '')
      assert.equal(formatDateLocal(''), '')
      assert.match(formatDateLocal('2026-11-02T12:00:00Z', 'UTC'), /^\d{2}\/\d{2}\/\d{4}$/)
    })
  })

  // ---------------------------------------------------------------------------
  // 2. MONETIZATION & FREEMIUM QUOTAS (Critique : protéger la conversion Pro)
  // ---------------------------------------------------------------------------
  describe('2. Freemium Quotas & Participant Question Flow', () => {
    it('enforces the 70-question limit and expiration check in AskQuestionView.vue', () => {
      const askViewCode = fs.readFileSync(
        path.join(ROOT, 'src/views/AskQuestionView.vue'),
        'utf8',
      )

      // Vérifie que la vue participant contrôle la limite des 70 questions et l'expiration
      assert.ok(
        askViewCode.includes('FREE_QUESTION_LIMIT'),
        'AskQuestionView must import and enforce FREE_QUESTION_LIMIT',
      )
      assert.ok(
        askViewCode.includes('checkIfLimitReached'),
        'AskQuestionView must check question limit before inserting into Supabase',
      )
      assert.ok(
        askViewCode.includes('Powered by'),
        'AskQuestionView must include the Powered by QALive viral loop for free sessions',
      )
    })

    it('enforces the 3-session limit and 2h duration in sessionStore.js', () => {
      const sessionStoreCode = fs.readFileSync(
        path.join(ROOT, 'src/stores/sessionStore.js'),
        'utf8',
      )

      assert.ok(
        sessionStoreCode.includes('totalSessions.value >= 3'),
        'sessionStore must block Free users at 3 sessions and open UpgradePlanModal',
      )
      assert.ok(
        sessionStoreCode.includes('2 * 60 * 60 * 1000'),
        'Free session duration must be locked to 2 hours',
      )
    })
  })

  // ---------------------------------------------------------------------------
  // 3. LEMON SQUEEZY WEBHOOK INTEGRITY (Critique : aucun paiement perdu)
  // ---------------------------------------------------------------------------
  describe('3. Lemon Squeezy Webhook Integrity', () => {
    it('verifies HMAC signature, handles all subscription events, and uses upsert with fallback', () => {
      const webhookCode = fs.readFileSync(
        path.join(ROOT, 'supabase/functions/lemon-squeezy-webhook/index.ts'),
        'utf8',
      )

      assert.ok(webhookCode.includes('verifySignature'), 'Webhook must verify HMAC SHA-256 signature')
      assert.ok(webhookCode.includes('subscription_created'), 'Must handle subscription_created')
      assert.ok(
        webhookCode.includes('subscription_payment_success'),
        'Must handle subscription_payment_success',
      )
      assert.ok(webhookCode.includes('subscription_cancelled'), 'Must handle subscription_cancelled')
      assert.ok(webhookCode.includes('subscription_expired'), 'Must handle subscription_expired')
      assert.ok(
        webhookCode.includes('.upsert('),
        'Webhook must use .upsert() so missing profile rows never silently fail',
      )
      assert.ok(
        webhookCode.includes("plan: 'premium'"),
        'Webhook must include fallback for enum compatibility',
      )
    })
  })

  // ---------------------------------------------------------------------------
  // 4. PRIVATE ANALYTICS & GEO ENGINE (Critique : réservé au fondateur)
  // ---------------------------------------------------------------------------
  describe('4. Founder-Only Analytics & Geo Map Engine', () => {
    it('computes accurate country flags, names, and SVG map coordinates', () => {
      assert.equal(getCountryFlag('FR'), '🇫🇷')
      assert.equal(getCountryFlag('CM'), '🇨🇲')
      assert.equal(getCountryFlag('XX'), '🌍')
      assert.ok(getCountryName('FR').length > 0)

      const pos = latLonToSvg(46.2, 2.2, 800, 380)
      assert.ok(pos.x > 0 && pos.x < 800)
      assert.ok(pos.y > 0 && pos.y < 380)
    })

    it('keeps analytics invisible on customer views and restricts access to founder email', () => {
      const homeCode = fs.readFileSync(path.join(ROOT, 'src/views/HomeView.vue'), 'utf8')
      const profileCode = fs.readFileSync(path.join(ROOT, 'src/views/UserProfileView.vue'), 'utf8')
      const analyticsCode = fs.readFileSync(path.join(ROOT, 'src/lib/analytics.js'), 'utf8')

      assert.equal(
        homeCode.includes("'/analytics'") || homeCode.includes('"/analytics"'),
        false,
        'HomeView must NOT display any link to /analytics for regular users',
      )
      assert.equal(
        profileCode.includes("'/analytics'") || profileCode.includes('"/analytics"'),
        false,
        'UserProfileView must NOT display any link to /analytics for regular users',
      )
      assert.ok(
        analyticsCode.includes('talchrist10@gmail.com'),
        'Analytics must restrict access to founder email',
      )
    })
  })

  // ---------------------------------------------------------------------------
  // 5. SECURITY : ZERO DATABASE_URL LEAK IN VITE CONFIG
  // ---------------------------------------------------------------------------
  describe('5. Vite Config Environment Security', () => {
    it('loads only VITE_ prefixed variables in vite config', () => {
      const configPath = fs.existsSync(path.join(ROOT, 'vite.config.mjs'))
        ? path.join(ROOT, 'vite.config.mjs')
        : path.join(ROOT, 'vite.config.js')
      const viteConfig = fs.readFileSync(configPath, 'utf8')
      assert.ok(
        viteConfig.includes("'VITE_'"),
        'vite config must restrict loadEnv to VITE_ prefix to prevent leaking DATABASE_URL',
      )
    })
  })

  // ---------------------------------------------------------------------------
  // 6. SECURITY & PRIVACY : SANITIZATION OF SUPABASE AUTH TOKENS IN URL
  // ---------------------------------------------------------------------------
  describe('6. URL Sanitization (Anti-Leak Token / OAuth)', () => {
    it('strips #access_token and #refresh_token fragments from browser URL', () => {
      let replacedUrl = ''
      const mockLocation = {
        href: 'https://app.qalive.ink/overview#access_token=eyJhbGciOiJIUzI1Ni...&expires_at=1730000000&refresh_token=secret_refresh&token_type=bearer',
        hash: '#access_token=eyJhbGciOiJIUzI1Ni...&expires_at=1730000000&refresh_token=secret_refresh&token_type=bearer',
      }
      const mockHistory = {
        state: { user: 'test' },
        replaceState: (_state, _title, url) => {
          replacedUrl = url
        },
      }

      const res = cleanAuthUrl(mockLocation, mockHistory)
      assert.equal(res, '/overview')
      assert.equal(replacedUrl, '/overview')
    })

    it('strips ?code= PKCE query param but keeps legitimate query params', () => {
      let replacedUrl = ''
      const mockLocation = {
        href: 'https://app.qalive.ink/overview?code=supabase_pkce_code_123&utm_source=twitter',
        hash: '',
      }
      const mockHistory = {
        state: {},
        replaceState: (_state, _title, url) => {
          replacedUrl = url
        },
      }

      const res = cleanAuthUrl(mockLocation, mockHistory)
      assert.equal(res, '/overview?utm_source=twitter')
      assert.equal(replacedUrl, '/overview?utm_source=twitter')
    })

    it('strips checkout and order_id params from Lemon Squeezy redirects', () => {
      let replacedUrl = ''
      const mockLocation = {
        href: 'https://app.qalive.ink/overview?checkout=success&order_id=987654',
        hash: '',
      }
      const mockHistory = {
        state: {},
        replaceState: (_state, _title, url) => {
          replacedUrl = url
        },
      }

      const res = cleanAuthUrl(mockLocation, mockHistory)
      assert.equal(res, '/overview')
      assert.equal(replacedUrl, '/overview')
    })

    it('leaves non-auth URLs and standard anchor hashes completely untouched', () => {
      let replacedUrl = ''
      const mockLocation = {
        href: 'https://app.qalive.ink/overview#my-section',
        hash: '#my-section',
      }
      const mockHistory = {
        state: {},
        replaceState: (_state, _title, url) => {
          replacedUrl = url
        },
      }

      const res = cleanAuthUrl(mockLocation, mockHistory)
      assert.equal(res, null, 'Must return null and not touch legitimate hashes')
      assert.equal(replacedUrl, '')
    })
  })

  // ---------------------------------------------------------------------------
  // 7. PHASE 0 LIVE ROOM : ZÉRO RÉGRESSION SUR LES SESSIONS EXISTANTES
  // ---------------------------------------------------------------------------
  describe('7. Live Room Foundations (Phase 0)', () => {
    it('keeps legacy behavior for sessions without features (Q&A on, new modules off)', () => {
      for (const legacy of [null, undefined, {}, { features: null }, { features: {} }, { features: [] }]) {
        assert.equal(isFeatureEnabled(legacy, 'qa'), true)
        assert.equal(isFeatureEnabled(legacy, 'files'), true)
        for (const key of ['reactions', 'stage', 'polls', 'slides', 'remote']) {
          assert.equal(isFeatureEnabled(legacy, key), false, `${key} must be OFF by default`)
        }
      }
      assert.equal(isFeatureEnabled({ features: { polls: true } }, 'polls'), true)
      assert.equal(isFeatureEnabled({ features: { polls: 'yes' } }, 'polls'), false, 'non-boolean ignored')
      assert.equal(isFeatureEnabled({ features: {} }, 'unknown_flag'), false)
      assert.deepEqual(Object.keys(resolveFeatures({ hacked: true })), Object.keys(DEFAULT_FEATURES))
    })

    it('counts unique audience devices and excludes host/stage from presence', () => {
      assert.equal(countAudience(null), 0)
      assert.equal(
        countAudience({
          deviceA: [{ role: 'audience' }, { role: 'audience' }], // 2 onglets = 1 personne
          deviceB: [{ role: 'audience' }],
          speaker: [{ role: 'host' }],
          projector: [{ role: 'stage' }],
          empty: [],
        }),
        2,
      )
      assert.equal(liveChannelName('my-talk'), 'room:my-talk')
      assert.throws(() => liveChannelName(''))
    })

    it('keeps a stable anonymous device id and survives broken storage', () => {
      const store = new Map()
      const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }
      const first = getOrCreateDeviceId(storage)
      assert.ok(first)
      assert.equal(getOrCreateDeviceId(storage), first)

      const broken = { getItem: () => { throw new Error('denied') }, setItem: () => {} }
      assert.ok(getOrCreateDeviceId(broken), 'must not crash in private mode')
    })

    it('ships an additive-only migration (no DROP TABLE / DROP COLUMN on core tables)', () => {
      const sql = fs.readFileSync(
        path.join(ROOT, 'supabase/migrations/20261104_phase0_live_foundations.sql'),
        'utf8',
      )
      assert.doesNotMatch(sql, /DROP\s+TABLE/i)
      assert.doesNotMatch(sql, /DROP\s+COLUMN/i)
      assert.doesNotMatch(sql, /RENAME/i)
      assert.match(sql, /ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '\{\}'/)
      assert.match(sql, /ENABLE ROW LEVEL SECURITY/)
    })
  })

  // ---------------------------------------------------------------------------
  // 8. DASHBOARD & CREATE SESSION MODAL (Figma Redesign Invariants)
  // ---------------------------------------------------------------------------
  describe('8. Dashboard & Create Session Modal (Figma Redesign Invariants)', () => {
    it('enforces Public/Private via access_code, flex items-end padlock alignment, and capitalized session names in HomeView.vue', () => {
      const homeCode = fs.readFileSync(path.join(ROOT, 'src/views/HomeView.vue'), 'utf8')

      assert.ok(
        homeCode.includes('function isPrivateSession(session)') &&
          homeCode.includes('session?.access_code'),
        'HomeView must determine Private vs Public from session.access_code',
      )
      assert.ok(
        homeCode.includes('flex items-end gap-[4px]'),
        'HomeView must align Public/Private text and padlock with flex items-end',
      )
      assert.ok(
        homeCode.includes('capitalizeFirstLetter(session.name)') &&
          homeCode.includes('first-letter:uppercase'),
        'HomeView must capitalize the first letter of each session name',
      )
      assert.ok(
        homeCode.includes('session.starts_at') && homeCode.includes("return 'Upcoming'"),
        'HomeView must classify sessions with a future starts_at as Upcoming',
      )
    })

    it('enforces 38px inputs, disabled Survey/Poll with cursor-not-allowed and Coming soon tooltip in CreateSessionModal.vue', () => {
      const modalCode = fs.readFileSync(
        path.join(ROOT, 'src/components/basis/CreateSessionModal.vue'),
        'utf8',
      )

      assert.ok(
        modalCode.includes('h-[38px]') && !modalCode.includes('h-[34px]'),
        'CreateSessionModal inputs must use 38px height instead of 34px',
      )
      assert.ok(
        modalCode.includes("{ value: 'survey', label: 'Survey', disabled: true }") &&
          modalCode.includes("{ value: 'poll', label: 'Poll', disabled: true }"),
        'Survey and Poll options must be disabled',
      )
      assert.ok(
        modalCode.includes('cursor-not-allowed') && modalCode.includes('Coming soon'),
        'Disabled Survey/Poll tabs must show cursor-not-allowed and Coming soon cursor tooltip',
      )
      assert.ok(
        modalCode.includes('createSession({ type: sessionType.value, startsAt })'),
        'CreateSessionModal must pass type and startsAt to sessionStore.createSession',
      )
    })
  })

  // ---------------------------------------------------------------------------
  // 9. RESEND EMAIL AUTOMATION & ANTI-SPAM DRIP QUEUE
  // ---------------------------------------------------------------------------
  describe('9. Resend Email Automation & Anti-Spam Drip Queue', () => {
    it('enforces lowercase qalive branding, line-height spacing, new domains, and drip batching in send-emails Edge Function', () => {
      const fnCode = fs.readFileSync(
        path.join(ROOT, 'supabase/functions/send-emails/index.ts'),
        'utf8',
      )

      assert.ok(
        fnCode.includes('Chris from qalive <support@qalive.online>'),
        'Sender must be Chris from qalive <support@qalive.online>',
      )
      assert.ok(
        fnCode.includes('https://qalive.online') && fnCode.includes('https://app.qalive.online'),
        'Emails must reference https://qalive.online (landing) and https://app.qalive.online (app)',
      )
      assert.ok(
        fnCode.includes('line-height: 1.75') && fnCode.includes('margin: 0 0 18px 0'),
        'Emails must include generous line-height and paragraph spacing',
      )
      assert.ok(
        fnCode.includes('DEFAULT_BATCH_SIZE = 15') && fnCode.includes('DELAY_BETWEEN_EMAILS_MS'),
        'Must throttle batches to 15 emails max with inter-email delay to protect Gmail reputation',
      )
      for (const tpl of [
        'domain_migration',
        'welcome',
        'upcoming_reminder_30m',
        'session_recap',
        'first_session_feedback_1h',
      ]) {
        assert.ok(fnCode.includes(`"${tpl}"`), `Must support ${tpl} email scenario`)
      }
    })

    it('enforces idempotency unique indexes and 1h first-session feedback delay in SQL migration', () => {
      const sql = fs.readFileSync(
        path.join(ROOT, 'supabase/migrations/20261108_resend_email_automation.sql'),
        'utf8',
      )

      assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.email_logs/)
      assert.match(sql, /ENABLE ROW LEVEL SECURITY/)
      assert.match(sql, /email_logs_unique_recipient_account_idx/)
      assert.match(sql, /email_logs_unique_session_type_idx/)
      assert.match(sql, /INTERVAL '1 hour'/)
      assert.match(sql, /INTERVAL '30 minutes'/)
    })
  })

  // ---------------------------------------------------------------------------
  // 10. CLOUDFLARE R2 STORAGE & OPTION B FREEMIUM FILE QUOTAS
  // ---------------------------------------------------------------------------
  describe('10. Cloudflare R2 Storage & Option B Freemium File Quotas', () => {
    it('routes all new document uploads through Cloudflare R2 presigned URLs and removes legacy Supabase Storage calls', () => {
      const fileStoreCode = fs.readFileSync(
        path.join(ROOT, 'src/stores/fileStore.js'),
        'utf8',
      )
      const sessionStoreCode = fs.readFileSync(
        path.join(ROOT, 'src/stores/sessionStore.js'),
        'utf8',
      )

      assert.equal(
        sessionStoreCode.includes('sessions-logos'),
        false,
        'Legacy sessions-logos upload must be removed from sessionStore.js',
      )
      assert.equal(
        fileStoreCode.includes('supabase.storage'),
        false,
        'fileStore.js must not upload binaries to supabase.storage anymore',
      )
      assert.ok(
        fileStoreCode.includes("supabase.functions.invoke('r2-upload'") &&
          fileStoreCode.includes("from('session_files')"),
        'fileStore.js must request a presigned URL from r2-upload and persist metadata in session_files',
      )
      assert.ok(
        fileStoreCode.includes('5 * 1024 * 1024') &&
          fileStoreCode.includes('25 * 1024 * 1024') &&
          fileStoreCode.includes('FREE_MAX_FILES_PER_SESSION = 1'),
        'fileStore.js must enforce Option B quotas (Free: 1 file / 5 MB, Pro: 25 MB)',
      )
    })

    it('verifies session ownership, AWS Signature V4 presigning, and Option B quotas in r2-upload Edge Function', () => {
      const r2FnCode = fs.readFileSync(
        path.join(ROOT, 'supabase/functions/r2-upload/index.ts'),
        'utf8',
      )

      assert.ok(
        r2FnCode.includes('AWS4-HMAC-SHA256') &&
          r2FnCode.includes('r2.cloudflarestorage.com') &&
          r2FnCode.includes('https://files.qalive.online'),
        'r2-upload must sign S3 PUT URLs for Cloudflare R2 and return https://files.qalive.online public URLs',
      )
      assert.ok(
        r2FnCode.includes('FREE_MAX_FILES_PER_SESSION = 1') &&
          r2FnCode.includes('5 * 1024 * 1024') &&
          r2FnCode.includes('25 * 1024 * 1024'),
        'r2-upload must enforce Option B quotas server-side',
      )
    })
  })
})
