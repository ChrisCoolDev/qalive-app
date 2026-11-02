#!/usr/bin/env node
/**
 * QALive Ticket Linker Helper
 * Permet d'associer automatiquement tous tes commits sur `develop` à un ticket GitHub
 * sans avoir besoin de créer une branche par ticket.
 *
 * Usage:
 *   npm run ticket 42     -> Active le ticket #42 (tous les prochains commits auront "(#42)")
 *   npm run ticket        -> Affiche le ticket actif
 *   npm run ticket clear  -> Désactive le ticket actif
 */
import fs from 'node:fs'
import path from 'node:path'

const ticketFile = path.resolve(process.cwd(), '.git', 'CURRENT_TICKET')
const arg = process.argv[2]?.trim()

if (!arg) {
  if (fs.existsSync(ticketFile)) {
    const current = fs.readFileSync(ticketFile, 'utf8').trim()
    if (current) {
      console.log(`🎯 Ticket actif : #${current} (sera ajouté automatiquement à tes commits)`)
      process.exit(0)
    }
  }
  console.log('ℹ️  Aucun ticket actif. Lance `npm run ticket <numero>` (ex: `npm run ticket 12`) pour lier tes commits.')
  process.exit(0)
}

if (['off', 'clear', 'none', 'reset', 'stop'].includes(arg.toLowerCase())) {
  if (fs.existsSync(ticketFile)) fs.unlinkSync(ticketFile)
  console.log('🧹 Ticket actif désactivé.')
  process.exit(0)
}

const cleanId = arg.replace(/^#/, '')
if (!/^\d+$/.test(cleanId)) {
  console.error(`❌ Numéro de ticket invalide : "${arg}". Utilise un nombre (ex: npm run ticket 12).`)
  process.exit(1)
}

fs.writeFileSync(ticketFile, cleanId, 'utf8')
console.log(`✅ Ticket #${cleanId} activé !`)
console.log(`   Tous tes prochains commits sur \`develop\` seront automatiquement liés à #${cleanId}.`)
console.log(`   Pour désactiver : npm run ticket clear`)

