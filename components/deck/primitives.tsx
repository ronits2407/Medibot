'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Sparkles, Play } from 'lucide-react'

export function ScaledIframe({ src, width = 1440 }: { src: string; width?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setBox({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])
  const scale = box.w ? box.w / width : 1
  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden bg-cream">
      {box.w > 0 && (
        <iframe
          src={src}
          title={src}
          loading="eager"
          tabIndex={-1}
          style={{ width, height: box.h / scale, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0 }}
        />
      )}
    </div>
  )
}

type BrowserProps = { url: string; className?: string } & (
  | { src: string; children?: never }
  | { src?: never; children: ReactNode }
)

export function Browser({ src, children, url, className = '' }: BrowserProps) {
  const isIframe = src !== undefined

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[2rem] border-[3px] border-ink bg-white shadow-[10px_10px_0_0_#17140f] transition-all duration-300 hover:shadow-[14px_14px_0_0_#17140f] hover:translate-x-[-2px] hover:translate-y-[-2px] ${className}`}
    >
      <div className="flex items-center gap-3 border-b-[3px] border-ink bg-cream px-5 py-3">
        <span className="h-3.5 w-3.5 rounded-full bg-blush border border-ink" />
        <span className="h-3.5 w-3.5 rounded-full bg-sun border border-ink" />
        <span className="h-3.5 w-3.5 rounded-full bg-olive border border-ink" />
        <span className="ml-3 flex-1 truncate rounded-full border-2 border-ink/20 bg-white px-4 py-1 font-mono text-sm text-ink/70">
          {url}
        </span>

        {/* Interactive Notice on Top Bar */}
        {isIframe && (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-sun border-2 border-ink shadow-[2px_2px_0_0_#17140f] text-ink font-heading font-black text-xs shrink-0 animate-pulse">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
            </span>
            <span>LIVE INTERACTIVE PREVIEW</span>
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {isIframe ? (
          <>
            <ScaledIframe src={src} />

            {/* Floating Interactive Badge Indicator */}
            <div className="absolute bottom-5 right-5 z-20 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full bg-cream/95 text-ink border-[2.5px] border-ink shadow-[4px_4px_0_0_#17140f] text-xs font-heading font-black backdrop-blur-md animate-bounce">
              <span className="flex h-5 w-5 rounded-full bg-sun border border-ink items-center justify-center text-xs">
                🎮
              </span>
              <span>You can play around in this — it is 100% interactive! Click or type inside.</span>
            </div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export function Chip({
  children,
  tone = 'cream',
  className = '',
}: {
  children: ReactNode
  tone?: 'cream' | 'sun' | 'blush' | 'olive' | 'sky' | 'ink'
  className?: string
}) {
  const tones = {
    cream: 'bg-cream text-ink',
    sun: 'bg-sun text-ink',
    blush: 'bg-blush text-ink',
    olive: 'bg-olive text-ink',
    sky: 'bg-sky text-ink',
    ink: 'bg-ink text-cream',
  }
  return (
    <span
      className={`deck-chip inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2 text-xl font-bold shadow-[3px_3px_0_0_#17140f] transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0_0_#17140f] cursor-default ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="deck-kicker font-mono text-lg font-bold uppercase tracking-[0.25em] text-ink/60">
      {children}
    </p>
  )
}

export function Title({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`deck-title font-heading text-[80px] font-semibold leading-[0.95] tracking-tight text-ink ${className}`}
    >
      {children}
    </h2>
  )
}

export function Block({
  tone,
  children,
  className = '',
}: {
  tone: 'sun' | 'blush' | 'olive' | 'sky' | 'ink' | 'cream' | 'sand'
  children: ReactNode
  className?: string
}) {
  const tones = {
    sun: 'bg-sun text-ink',
    blush: 'bg-blush text-ink',
    olive: 'bg-olive text-ink',
    sky: 'bg-sky text-ink',
    ink: 'bg-ink text-cream',
    cream: 'bg-cream text-ink',
    sand: 'bg-sand text-ink',
  }
  return (
    <div
      className={`deck-box rounded-[2.5rem] border-[3px] border-ink p-8 shadow-[6px_6px_0_0_#17140f] transition-all duration-300 hover:-translate-y-1.5 hover:translate-x-[-1px] hover:shadow-[10px_10px_0_0_#17140f] ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  )
}

export function Slide({ bg = 'bg-cream', children }: { bg?: string; children: ReactNode }) {
  return <div className={`relative h-[900px] w-[1600px] overflow-hidden p-16 ${bg}`}>{children}</div>
}

export function Split({ left, right, leftW = 'w-[560px]' }: { left: ReactNode; right: ReactNode; leftW?: string }) {
  return (
    <div className="flex h-full items-center gap-14">
      <div className={`flex shrink-0 flex-col gap-7 ${leftW}`}>{left}</div>
      <div className="h-full min-w-0 flex-1 py-2">{right}</div>
    </div>
  )
}
