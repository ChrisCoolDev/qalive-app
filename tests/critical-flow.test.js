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
    it('loads only VITE_ prefixed variables in vite.config.js', () => {
      const viteConfig = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8')
      assert.ok(
        viteConfig.includes("'VITE_'"),
        'vite.config.js must restrict loadEnv to VITE_ prefix to prevent leaking DATABASE_URL',
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
})
