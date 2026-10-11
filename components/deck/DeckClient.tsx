'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { slides } from './slides'
import { ArrowLeft, ArrowRight, Home, Maximize2 } from 'lucide-react'

const W = 1600
const H = 900

export function DeckClient({ receiptId }: { receiptId?: string | null }) {
  const [i, setI] = useState(0)
  const [scale, setScale] = useState(1)
  const touch = useRef<number | null>(null)

  const go = useCallback(
    (d: number) => setI(v => Math.min(slides.length - 1, Math.max(0, v + d))),
    []
  )

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H))
    fit()
    window.addEventListener('resize', fit)
    const key = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        go(1)
      }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        go(-1)
      }
      if (e.key === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.()
        } else {
          document.exitFullscreen?.()
        }
      }
    }
    window.addEventListener('keydown', key)
    const hash = Number(window.location.hash.replace('#', ''))
    if (hash > 0 && hash <= slides.length) setI(hash - 1)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('keydown', key)
    }
  }, [go])

  useEffect(() => {
    window.history.replaceState(null, '', `#${i + 1}`)
  }, [i])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-ink select-none"
      onTouchStart={e => {
        touch.current = e.touches[0].clientX
      }}
      onTouchEnd={e => {
        if (touch.current === null) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
        className="relative shrink-0 shadow-2xl"
      >
        {slides.map((s, idx) => (
          <div
            key={idx}
            className="absolute inset-0"
            style={{
              visibility: idx === i ? 'visible' : 'hidden',
              pointerEvents: idx === i ? 'auto' : 'none',
            }}
          >
            {s({ receiptId })}
          </div>
        ))}
      </div>

      {/* Floating Controller */}
      <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border-[3px] border-ink bg-cream px-4 py-2 shadow-[4px_4px_0_0_#17140f] z-50">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-ink hover:bg-cream border border-ink transition"
          title="Back to Landing Page"
        >
          <Home className="h-4 w-4" />
        </Link>
        <button
          onClick={() => go(-1)}
          disabled={i === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-bold text-cream hover:bg-black transition disabled:opacity-40"
          aria-label="Previous slide"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="min-w-[80px] text-center font-mono text-base font-bold text-ink">
          {i + 1} / {slides.length}
        </span>
        <button
          onClick={() => go(1)}
          disabled={i === slides.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-sun font-bold text-ink hover:bg-sun-deep transition disabled:opacity-40"
          aria-label="Next slide"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.()
            } else {
              document.exitFullscreen?.()
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-ink hover:bg-cream border border-ink transition ml-1"
          title="Toggle Fullscreen (F)"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
