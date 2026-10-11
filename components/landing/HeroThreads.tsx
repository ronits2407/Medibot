'use client'

import React, { useMemo } from 'react'
import styles from './HeroThreads.module.css'

const THREADS = Array.from({ length: 36 }, (_, index) => ({
  index: index % 18,
  side: index < 18 ? 'left' : 'right',
  color: ['#7f9145', '#cf85b0', '#8c9fdb'][Math.floor(index / 6) % 3],
}))

function threadPath(index: number, side: string) {
  const gap = index * 13
  return side === 'left'
    ? `M ${-280 + gap} -80 C ${620 + gap} 90, ${-470 + gap} 290, ${60 + gap} 510 S ${640 + gap} 740, ${320 + gap} 980`
    : `M ${1520 - gap} -80 C ${780 - gap} 150, ${1930 - gap} 320, ${1330 - gap} 530 S ${850 - gap} 760, ${1270 - gap} 980`
}

export default function HeroThreads() {
  const leftThreads = useMemo(() => THREADS.filter((t) => t.side === 'left'), [])
  const rightThreads = useMemo(() => THREADS.filter((t) => t.side === 'right'), [])

  return (
    <div className={styles.threads} aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" focusable="false">
        <g className={styles.left}>
          {leftThreads.map((thread) => (
            <path
              key={`l-${thread.index}`}
              d={threadPath(thread.index, 'left')}
              stroke={thread.color}
              strokeWidth={thread.index % 6 === 0 ? 1.5 : 0.8}
              strokeOpacity={thread.index % 6 === 0 ? 0.55 : 0.32}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <g className={styles.right}>
          {rightThreads.map((thread) => (
            <path
              key={`r-${thread.index}`}
              d={threadPath(thread.index, 'right')}
              stroke={thread.color}
              strokeWidth={thread.index % 6 === 0 ? 1.5 : 0.8}
              strokeOpacity={thread.index % 6 === 0 ? 0.55 : 0.32}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
