import type { ReactNode } from 'react'
import { Block, Browser, Kicker, Slide, Split, Title } from './primitives'

export type DeckCtx = { receiptId?: string | null }
export type SlideFn = (c: DeckCtx) => ReactNode

export const Node = ({ n, label, tone }: { n: string; label: string; tone: 'sun' | 'blush' | 'olive' | 'sky' | 'cream' }) => (
  <Block tone={tone} className="flex h-44 w-52 shrink-0 flex-col items-center justify-center gap-2 text-center !p-4 transition-transform hover:scale-105 duration-200 cursor-default">
    <span className="font-mono text-xl font-bold text-ink/60">{n}</span>
    <span className="font-heading text-2xl font-semibold leading-tight">{label}</span>
  </Block>
)

export const Arrow = () => <span className="font-heading text-5xl text-ink inline-block transition-transform hover:translate-x-1.5 duration-200">→</span>

export const Feature = ({
  bg,
  kicker,
  title,
  chips,
  src,
  url,
  leftW = 'w-[440px]',
}: {
  bg?: string
  kicker: string
  title: string
  chips: ReactNode
  src: string
  url: string
  leftW?: string
}) => (
  <Slide bg={bg}>
    <Split
      leftW={leftW}
      left={
        <>
          <Kicker>{kicker}</Kicker>
          <Title className="!text-[68px]">{title}</Title>
          <div className="flex flex-wrap gap-3">{chips}</div>
        </>
      }
      right={<Browser src={src} url={url} className="h-full" />}
    />
  </Slide>
)
