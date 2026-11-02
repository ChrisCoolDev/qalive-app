import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseUTCDate, formatTimeLocal, formatDateLocal } from '../src/utils/dateHelper.js'
import { getCountryFlag, getCountryName, latLonToSvg } from '../src/utils/geoHelper.js'

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
})
