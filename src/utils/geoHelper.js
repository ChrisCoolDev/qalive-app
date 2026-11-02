// Mapping IANA Timezone -> Code Pays ISO 3166-1 alpha-2 (100% sans cookie, 0ms de latence, conforme RGPD)
const TIMEZONE_TO_COUNTRY = {
  // Europe
  'Europe/Paris': 'FR',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Brussels': 'BE',
  'Europe/Zurich': 'CH',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Lisbon': 'PT',
  'Europe/Luxembourg': 'LU',
  'Europe/Monaco': 'MC',
  'Europe/Vienna': 'AT',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Athens': 'GR',
  'Europe/Bucharest': 'RO',
  'Europe/Budapest': 'HU',
  'Europe/Istanbul': 'TR',
  'Europe/Kyiv': 'UA',
  'Europe/Kiev': 'UA',
  'Europe/Moscow': 'RU',

  // Afrique
  'Africa/Douala': 'CM',
  'Africa/Abidjan': 'CI',
  'Africa/Dakar': 'SN',
  'Africa/Casablanca': 'MA',
  'Africa/Algiers': 'DZ',
  'Africa/Tunis': 'TN',
  'Africa/Lagos': 'NG',
  'Africa/Accra': 'GH',
  'Africa/Kinshasa': 'CD',
  'Africa/Lubumbashi': 'CD',
  'Africa/Brazzaville': 'CG',
  'Africa/Libreville': 'GA',
  'Africa/Lome': 'TG',
  'Africa/Porto-Novo': 'BJ',
  'Africa/Ouagadougou': 'BF',
  'Africa/Bamako': 'ML',
  'Africa/Conakry': 'GN',
  'Africa/Niamey': 'NE',
  'Africa/Ndjamena': 'TD',
  'Africa/Bangui': 'CF',
  'Africa/Kigali': 'RW',
  'Africa/Bujumbura': 'BI',
  'Africa/Nairobi': 'KE',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Kampala': 'UG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Cairo': 'EG',
  'Africa/Antananarivo': 'MG',
  'Indian/Mauritius': 'MU',

  // Amériques
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Detroit': 'US',
  'America/Toronto': 'CA',
  'America/Montreal': 'CA',
  'America/Vancouver': 'CA',
  'America/Halifax': 'CA',
  'America/Winnipeg': 'CA',
  'America/Edmonton': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',

  // Moyen-Orient & Asie
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Jerusalem': 'IL',
  'Asia/Beirut': 'LB',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Singapore': 'SG',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Taipei': 'TW',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Kuala_Lumpur': 'MY',

  // Océanie
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ',
}

// Coordonnées [latitude, longitude] des pays pour le placement précis sur la carte du monde
export const COUNTRY_LAT_LON = {
  FR: { lat: 46.2, lon: 2.2, region: 'Europe' },
  BE: { lat: 50.8, lon: 4.4, region: 'Europe' },
  CH: { lat: 46.8, lon: 8.2, region: 'Europe' },
  LU: { lat: 49.8, lon: 6.1, region: 'Europe' },
  GB: { lat: 54.0, lon: -2.0, region: 'Europe' },
  IE: { lat: 53.1, lon: -8.0, region: 'Europe' },
  DE: { lat: 51.2, lon: 10.4, region: 'Europe' },
  ES: { lat: 40.4, lon: -3.7, region: 'Europe' },
  IT: { lat: 42.5, lon: 12.5, region: 'Europe' },
  NL: { lat: 52.3, lon: 5.3, region: 'Europe' },
  PT: { lat: 39.4, lon: -8.2, region: 'Europe' },
  AT: { lat: 47.5, lon: 14.5, region: 'Europe' },
  PL: { lat: 52.0, lon: 19.1, region: 'Europe' },
  CZ: { lat: 49.8, lon: 15.5, region: 'Europe' },
  SE: { lat: 60.1, lon: 18.6, region: 'Europe' },
  NO: { lat: 60.5, lon: 8.5, region: 'Europe' },
  DK: { lat: 56.2, lon: 9.5, region: 'Europe' },
  FI: { lat: 61.9, lon: 25.7, region: 'Europe' },
  GR: { lat: 39.1, lon: 21.8, region: 'Europe' },
  RO: { lat: 45.9, lon: 25.0, region: 'Europe' },
  TR: { lat: 38.9, lon: 35.2, region: 'Europe' },
  UA: { lat: 48.4, lon: 31.2, region: 'Europe' },
  RU: { lat: 55.8, lon: 37.6, region: 'Europe' },

  // Afrique
  CM: { lat: 5.9, lon: 12.3, region: 'Africa' },
  CI: { lat: 7.5, lon: -5.5, region: 'Africa' },
  SN: { lat: 14.5, lon: -14.5, region: 'Africa' },
  MA: { lat: 31.8, lon: -7.1, region: 'Africa' },
  DZ: { lat: 28.0, lon: 1.7, region: 'Africa' },
  TN: { lat: 33.9, lon: 9.5, region: 'Africa' },
  NG: { lat: 9.1, lon: 8.7, region: 'Africa' },
  GH: { lat: 7.9, lon: -1.0, region: 'Africa' },
  CD: { lat: -4.0, lon: 21.8, region: 'Africa' },
  CG: { lat: -0.2, lon: 15.8, region: 'Africa' },
  GA: { lat: -0.8, lon: 11.6, region: 'Africa' },
  TG: { lat: 8.6, lon: 0.8, region: 'Africa' },
  BJ: { lat: 9.3, lon: 2.3, region: 'Africa' },
  BF: { lat: 12.2, lon: -1.6, region: 'Africa' },
  ML: { lat: 17.6, lon: -4.0, region: 'Africa' },
  GN: { lat: 9.9, lon: -9.7, region: 'Africa' },
  NE: { lat: 17.6, lon: 8.1, region: 'Africa' },
  TD: { lat: 15.5, lon: 18.7, region: 'Africa' },
  RW: { lat: -1.9, lon: 29.9, region: 'Africa' },
  KE: { lat: -0.02, lon: 37.9, region: 'Africa' },
  ET: { lat: 9.1, lon: 40.5, region: 'Africa' },
  ZA: { lat: -30.6, lon: 22.9, region: 'Africa' },
  EG: { lat: 26.8, lon: 30.8, region: 'Africa' },
  MG: { lat: -18.8, lon: 46.9, region: 'Africa' },

  // Amériques
  US: { lat: 38.0, lon: -97.0, region: 'Americas' },
  CA: { lat: 56.1, lon: -106.3, region: 'Americas' },
  MX: { lat: 23.6, lon: -102.5, region: 'Americas' },
  BR: { lat: -14.2, lon: -51.9, region: 'Americas' },
  AR: { lat: -38.4, lon: -63.6, region: 'Americas' },
  CL: { lat: -35.7, lon: -71.5, region: 'Americas' },
  CO: { lat: 4.6, lon: -74.3, region: 'Americas' },
  PE: { lat: -9.2, lon: -75.0, region: 'Americas' },

  // Asie & Océanie
  AE: { lat: 23.4, lon: 53.8, region: 'Asia' },
  SA: { lat: 23.9, lon: 45.1, region: 'Asia' },
  IN: { lat: 20.6, lon: 79.0, region: 'Asia' },
  SG: { lat: 1.35, lon: 103.8, region: 'Asia' },
  JP: { lat: 36.2, lon: 138.2, region: 'Asia' },
  KR: { lat: 35.9, lon: 127.8, region: 'Asia' },
  CN: { lat: 35.9, lon: 104.2, region: 'Asia' },
  HK: { lat: 22.3, lon: 114.2, region: 'Asia' },
  TH: { lat: 15.9, lon: 100.9, region: 'Asia' },
  VN: { lat: 14.1, lon: 108.3, region: 'Asia' },
  ID: { lat: -0.8, lon: 113.9, region: 'Asia' },
  PH: { lat: 12.9, lon: 121.8, region: 'Asia' },
  MY: { lat: 4.2, lon: 101.9, region: 'Asia' },
  AU: { lat: -25.3, lon: 133.8, region: 'Oceania' },
  NZ: { lat: -40.9, lon: 174.9, region: 'Oceania' },
}

/**
 * Détecte le code pays ISO à 2 lettres du visiteur sans requête externe ni cookie
 */
export function detectVisitorCountryCode() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz]
    }

    // Fallback via la langue du navigateur (ex: "fr-CM" -> "CM", "fr-FR" -> "FR", "en-US" -> "US")
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language || '']
    for (const lang of langs) {
      const parts = String(lang).split(/[-_]/)
      if (parts.length >= 2 && parts[1].length === 2) {
        return parts[1].toUpperCase()
      }
    }
  } catch {
    // Ignore
  }
  return 'XX'
}

/**
 * Convertit un code ISO 2 lettres ('FR', 'CM', 'US') en emoji drapeau (🇫🇷, 🇨🇲, 🇺🇸)
 */
export function getCountryFlag(countryCode) {
  if (!countryCode || countryCode === 'XX' || countryCode.length !== 2) return '🌍'
  const code = countryCode.toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return '🌍'
  return String.fromCodePoint(...code.split('').map((c) => 127397 + c.charCodeAt(0)))
}

let regionNamesInstance = null

/**
 * Retourne le nom complet du pays à partir de son code ISO 2 lettres
 */
export function getCountryName(countryCode) {
  if (!countryCode || countryCode === 'XX') return 'Unknown'
  try {
    if (!regionNamesInstance && typeof Intl !== 'undefined' && Intl.DisplayNames) {
      regionNamesInstance = new Intl.DisplayNames(['en'], { type: 'region' })
    }
    return regionNamesInstance ? regionNamesInstance.of(countryCode.toUpperCase()) || countryCode : countryCode
  } catch {
    return countryCode
  }
}

/**
 * Convertit (lat, lon) en coordonnées (x, y) sur un canevas SVG Robinson/Equirectangular (800 x 380)
 */
export function latLonToSvg(lat, lon, width = 800, height = 380) {
  const x = ((lon + 180) / 360) * width
  // Ajustement vertical centré pour la projection monde
  const y = ((82 - lat) / 145) * height
  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(Math.max(16, Math.min(height - 16, y)) * 10) / 10,
  }
}

