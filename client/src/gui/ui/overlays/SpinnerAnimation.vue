<template>
  <svg
    class="spinner-icon"
    viewBox="0 0 112 40"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Loading"
  >
    <defs>
      <!-- Symbols disappear at the pacman's mouth -->
      <clipPath id="currency-clip">
        <rect x="34" y="0" width="78" height="40" />
      </clipPath>
    </defs>

    <!-- Pacman: wedge removed from the FRONT (right side), chomping -->
    <path class="pacman" d="M 20 20 L 30.72 11 A 14 14 0 1 0 30.72 29 Z">
      <animate
        attributeName="d"
        dur="0.35s"
        repeatCount="indefinite"
        values="
          M 20 20 L 30.72 11 A 14 14 0 1 0 30.72 29 Z;
          M 20 20 L 34 19.5 A 14 14 0 1 0 34 20.5 Z;
          M 20 20 L 30.72 11 A 14 14 0 1 0 30.72 29 Z
        "
      />
    </path>
    <circle class="pacman-eye" cx="21.5" cy="10.5" r="1.7" />

    <g clip-path="url(#currency-clip)">
      <g class="currency-stream" @animationiteration="advance">
        <text
          v-for="(item, i) in queue"
          :key="item.id"
          :x="START_X + i * SLOT + SLOT / 2"
          y="20"
          class="currency"
          :class="`c-${item.color}`"
        >{{ item.symbol }}</text>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { ref } from "vue";

const SLOT = 26; // px between symbols (viewBox units)
const START_X = 34; // pacman's mouth
const VISIBLE_QUEUE = 5; // 3 visible + buffer on both sides

// Written as escapes so file encoding can never garble them
const SYMBOLS = [
  "$", "\u20AC", "\u00A3", "\u00A5", "\u20B9", "\u20A9", "\u20BD", "\u20BA",
  "\u20AB", "\u20AA", "\u20B1", "\u20B4", "\u20A6", "\u20BF", "\u0E3F", "\u20A1",
];
const COLOR_COUNT = 8; // matches .c-0 ... .c-7 below

let nextId = 0;
const lastSymbol = ref<string | null>(null);
const lastColor = ref<number | null>(null);

function randomItem() {
  let symbol;
  let color;
  do {
    symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  } while (symbol === lastSymbol.value);
  do {
    color = Math.floor(Math.random() * COLOR_COUNT);
  } while (color === lastColor.value);
  lastSymbol.value = symbol;
  lastColor.value = color;
  return { id: nextId++, symbol, color };
}

const queue = ref(Array.from({ length: VISIBLE_QUEUE }, randomItem));

// Stream moved exactly one slot: the first symbol was "eaten" -> recycle
function advance() {
  queue.value.shift();
  queue.value.push(randomItem());
}
</script>

<style scoped lang="scss">
.spinner-icon {
  @apply tw-inline-block;
  width: 3.5em;
  height: 1.25em;
  margin-right: 0.6em;
  overflow: hidden;
  vertical-align: middle;
}

.pacman {
  fill: theme("colors.sky.600");
}

.pacman-eye {
  fill: theme("colors.zinc.900");
}

.currency-stream {
  // moves exactly one slot (26px), then the queue shifts and it restarts seamlessly
  animation: currency-move 0.7s linear infinite;
}

.currency {
  font-size: 20px;
  font-weight: 300;
  text-anchor: middle;
  dominant-baseline: central;
}

.c-0 { fill: theme("colors.emerald.500"); }
.c-1 { fill: theme("colors.amber.400"); }
.c-2 { fill: theme("colors.violet.400"); }
.c-3 { fill: theme("colors.rose.400"); }
.c-4 { fill: theme("colors.teal.400"); }
.c-5 { fill: theme("colors.orange.400"); }
.c-6 { fill: theme("colors.fuchsia.400"); }
.c-7 { fill: theme("colors.lime.400"); }

@keyframes currency-move {
  from { transform: translateX(0); }
  to   { transform: translateX(-26px); }
}

@media (prefers-reduced-motion: reduce) {
  .currency-stream {
    animation: none;
  }
}
</style>