<script setup>
import { ref, computed } from 'vue'
import { COUNTRY_LAT_LON, latLonToSvg } from '@/utils/geoHelper'

const props = defineProps({
  countries: {
    type: Array,
    default: () => [],
  },
})

const hoveredCountry = ref(null)
const selectedRegion = ref('World')

const regionViewBoxes = {
  World: '0 0 800 380',
  Europe: '345 25 180 120',
  Africa: '335 120 210 175',
  Americas: '60 30 265 320',
  Asia: '480 40 290 260',
}

const currentViewBox = computed(() => regionViewBoxes[selectedRegion.value] || regionViewBoxes.World)

const maxVisitors = computed(() => {
  if (!props.countries.length) return 1
  return Math.max(...props.countries.map((c) => c.visitors), 1)
})

const mapMarkers = computed(() => {
  return props.countries
    .filter((c) => c.code && COUNTRY_LAT_LON[c.code])
    .map((c) => {
      const coords = COUNTRY_LAT_LON[c.code]
      const { x, y } = latLonToSvg(coords.lat, coords.lon, 800, 380)
      const ratio = c.visitors / maxVisitors.value
      const radius = Math.round(6 + ratio * 12)
      return {
        ...c,
        x,
        y,
        radius,
        region: coords.region,
      }
    })
})

const activeCountryInfo = computed(() => {
  if (!hoveredCountry.value) return null
  return props.countries.find((c) => c.code === hoveredCountry.value) || null
})
</script>

<template>
  <div class="border border-[#E6E6E6] rounded-[6px] p-5 bg-white">
    <!-- En-tête de la carte : Titre + sélecteur de zoom continent -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-100">
      <div class="flex items-center space-x-2">
        <span class="material-symbols-outlined text-[#E85D4A] text-[18px]">public</span>
        <h2 class="text-sm font-medium text-primary">Locations & Countries</h2>
        <span class="text-[11px] text-gray-400">({{ countries.length }} countries)</span>
      </div>

      <!-- Zoom rapide par continent -->
      <div class="flex items-center space-x-1 bg-[#F6F5EF] p-0.5 rounded-[4px] border border-[#E6E6E6] self-start">
        <button
          v-for="reg in ['World', 'Europe', 'Africa', 'Americas', 'Asia']"
          :key="reg"
          @click="selectedRegion = reg"
          :class="[
            selectedRegion === reg
              ? 'bg-white text-primary shadow-sm font-medium'
              : 'text-gray-500 hover:text-primary',
            'px-2 py-0.5 rounded-[3px] text-[11px] transition-all',
          ]"
        >
          {{ reg }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      <!-- Carte du monde interactive (3 colonnes sur 5) -->
      <div class="lg:col-span-3 relative bg-[#F6F5EF]/60 border border-[#E6E6E6]/80 rounded-[6px] overflow-hidden p-2">
        <!-- Tooltip flottant style Plausible -->
        <div
          v-if="activeCountryInfo"
          class="absolute top-3 left-3 z-20 bg-primary text-white px-3 py-1.5 rounded-[4px] shadow-md text-xs flex items-center space-x-2 pointer-events-none"
        >
          <span class="text-sm">{{ activeCountryInfo.flag }}</span>
          <span class="font-medium">{{ activeCountryInfo.name }}</span>
          <span class="text-gray-300">·</span>
          <span class="text-[#FDFF00] font-semibold">{{ activeCountryInfo.visitors }}</span>
          <span class="text-gray-300 text-[11px]">({{ activeCountryInfo.pct }}%)</span>
        </div>

        <svg
          :viewBox="currentViewBox"
          class="w-full h-[250px] sm:h-[290px] transition-all duration-500 select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="world-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.8" fill="#d6d5ce" />
            </pattern>
          </defs>

          <!-- Fond grille de points subtile -->
          <rect width="800" height="380" fill="url(#world-grid)" />

          <!-- Lignes équateur et tropiques subtiles -->
          <line x1="0" y1="215" x2="800" y2="215" stroke="#e5e4dd" stroke-dasharray="3 3" stroke-width="0.8" />
          <line x1="400" y1="0" x2="400" y2="380" stroke="#e5e4dd" stroke-dasharray="3 3" stroke-width="0.8" />

          <!-- Silhouettes vectorielles stylisées des continents -->
          <g fill="#E5E4DC" stroke="#D2D0C5" stroke-width="1" stroke-linejoin="round">
            <!-- Amérique du Nord -->
            <path
              d="M 55 45 L 135 35 L 220 42 L 250 75 L 225 120 L 195 148 L 165 175 L 145 170 L 122 140 L 100 110 L 65 75 Z"
            />
            <!-- Groenland -->
            <path d="M 255 20 L 325 18 L 315 55 L 268 58 Z" />
            <!-- Amérique du Sud -->
            <path
              d="M 190 185 L 238 192 L 285 225 L 275 280 L 240 342 L 218 355 L 205 295 L 185 235 Z"
            />
            <!-- Europe -->
            <path
              d="M 368 52 L 420 35 L 475 40 L 495 68 L 478 105 L 442 115 L 405 118 L 372 108 L 362 82 Z"
            />
            <!-- Royaume-Uni / Irlande -->
            <path d="M 368 74 L 383 70 L 385 88 L 370 90 Z" />
            <!-- Afrique -->
            <path
              d="M 365 125 L 430 122 L 475 135 L 512 175 L 492 238 L 465 305 L 432 315 L 412 265 L 395 210 L 355 182 L 350 148 Z"
            />
            <!-- Madagascar -->
            <path d="M 498 258 L 510 255 L 506 286 L 495 284 Z" />
            <!-- Asie & Moyen-Orient -->
            <path
              d="M 480 42 L 595 35 L 725 48 L 745 92 L 705 152 L 668 195 L 625 215 L 575 198 L 535 168 L 485 152 L 475 110 Z"
            />
            <!-- Japon -->
            <path d="M 702 105 L 718 98 L 720 126 L 704 130 Z" />
            <!-- Asie du Sud-Est / Indonésie -->
            <path d="M 625 218 L 690 222 L 715 245 L 640 248 Z" />
            <!-- Australie -->
            <path
              d="M 642 265 L 725 262 L 742 305 L 715 335 L 652 328 L 635 295 Z"
            />
            <!-- Nouvelle-Zélande -->
            <path d="M 762 328 L 778 322 L 774 350 L 758 348 Z" />
          </g>

          <!-- Marqueurs interactifs des pays actifs -->
          <g v-for="marker in mapMarkers" :key="marker.code">
            <!-- Halo pulsant -->
            <circle
              :cx="marker.x"
              :cy="marker.y"
              :r="hoveredCountry === marker.code ? marker.radius + 7 : marker.radius + 3"
              fill="#E85D4A"
              :fill-opacity="hoveredCountry === marker.code ? 0.35 : 0.18"
              class="transition-all duration-300"
            />

            <!-- Point principal -->
            <circle
              :cx="marker.x"
              :cy="marker.y"
              :r="hoveredCountry === marker.code ? marker.radius + 1.5 : marker.radius"
              fill="#E85D4A"
              stroke="#FFFFFF"
              stroke-width="1.5"
              class="cursor-pointer transition-all duration-200"
              @mouseenter="hoveredCountry = marker.code"
              @mouseleave="hoveredCountry = null"
            />

            <!-- Code pays au-dessus des plus gros pays -->
            <text
              :x="marker.x"
              :y="marker.y - marker.radius - 4"
              text-anchor="middle"
              font-size="8"
              font-weight="600"
              fill="#242424"
              class="pointer-events-none"
            >
              {{ marker.code }}
            </text>
          </g>
        </svg>

        <!-- Légende en bas de carte -->
        <div class="flex items-center justify-between px-2 pt-1 text-[10px] text-gray-400">
          <span>Hover a pin or country to inspect visitors</span>
          <span class="flex items-center space-x-1">
            <span class="w-2 h-2 rounded-full bg-[#E85D4A] inline-block"></span>
            <span>Active visitors</span>
          </span>
        </div>
      </div>

      <!-- Liste des pays avec drapeaux et barres de progression (2 colonnes sur 5) -->
      <div class="lg:col-span-2 space-y-2">
        <div class="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-gray-100">
          <span>Country</span>
          <span>Visitors</span>
        </div>

        <div v-if="countries.length === 0" class="text-xs text-gray-400 py-8 text-center">
          No country data recorded for this period yet.
        </div>

        <div v-else class="space-y-1.5 max-h-[275px] overflow-y-auto pr-1">
          <div
            v-for="country in countries"
            :key="country.code"
            @mouseenter="hoveredCountry = country.code"
            @mouseleave="hoveredCountry = null"
            :class="[
              hoveredCountry === country.code ? 'ring-1 ring-[#E85D4A]' : '',
              'relative flex items-center justify-between px-2.5 py-1.5 rounded text-[13px] overflow-hidden cursor-pointer transition-all',
            ]"
          >
            <!-- Barre de proportion façon Plausible -->
            <div
              class="absolute inset-y-0 left-0 bg-[#F6F5EF] transition-all"
              :style="{ width: `${Math.max(country.pct, 4)}%` }"
            ></div>

            <div class="relative z-10 flex items-center space-x-2 truncate">
              <span class="text-base leading-none">{{ country.flag }}</span>
              <span class="text-[13px] text-primary truncate">{{ country.name }}</span>
            </div>

            <div class="relative z-10 flex items-center space-x-2 text-xs">
              <span class="font-medium text-primary">{{ country.visitors }}</span>
              <span class="text-gray-400 text-[11px] w-9 text-right">{{ country.pct }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

