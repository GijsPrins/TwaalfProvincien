<template>
  <canvas ref="canvas" class="fixed inset-0 w-full h-full pointer-events-none" style="z-index: 9999" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  medal: { type: String, required: true },
  duration: { type: Number, default: 4000 },
})

const emit = defineEmits(['done'])

const PALETTES = {
  '10k':      ['#CD7F32', '#B8860B', '#A0522D', '#D2691E', '#C8860A', '#8B4513'],
  half:       ['#C0C0C0', '#A8A9AD', '#909090', '#D0D0D0', '#E0E0E0', '#B8B8C8'],
  marathon:   ['#FFD700', '#FFC200', '#DAA520', '#FFA500', '#FFEC6E', '#FFB700'],
}

const canvas = ref(null)
let animId = null

function rand(min, max) { return Math.random() * (max - min) + min }

onMounted(() => {
  const el = canvas.value
  const w = window.innerWidth
  const h = window.innerHeight
  el.width = w
  el.height = h
  const ctx = el.getContext('2d')
  const colors = PALETTES[props.medal] ?? PALETTES.marathon

  const particles = Array.from({ length: 160 }, () => ({
    x: rand(0, w),
    y: rand(-h * 0.6, 0),
    pw: rand(6, 14),
    ph: rand(3, 7),
    rot: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.06, 0.06),
    vx: rand(-1.5, 1.5),
    vy: rand(2.5, 6),
    color: colors[Math.floor(Math.random() * colors.length)],
  }))

  let startTime = null

  function tick(ts) {
    if (!startTime) startTime = ts
    const elapsed = ts - startTime
    const fadeStart = props.duration - 800
    const alpha = elapsed < fadeStart ? 1 : Math.max(0, 1 - (elapsed - fadeStart) / 800)

    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.rot += p.rotSpeed
      if (p.y > h + 20) { p.y = rand(-40, 0); p.x = rand(0, w) }
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.pw / 2, -p.ph / 2, p.pw, p.ph)
      ctx.restore()
    }

    if (elapsed < props.duration) {
      animId = requestAnimationFrame(tick)
    } else {
      ctx.clearRect(0, 0, w, h)
      emit('done')
    }
  }

  animId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>
