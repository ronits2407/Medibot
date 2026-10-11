'use client'

import React, { useMemo } from 'react'
import styles from './HeroThreads.module.css'

// 8 lightweight, elegant accent curves (4 left, 4 right)
const THREADS = [
  { index: 0, side: 'left', color: '#7f9145' },
  { index: 1, side: 'left', color: '#cf85b0' },
  { index: 2, side: 'left', color: '#8c9fdb' },
  { index: 3, side: 'left', color: '#e6bd35' },
  { index: 0, side: 'right', color: '#7f9145' },
  { index: 1, side: 'right', color: '#cf85b0' },
  { index: 2, side: 'right', color: '#8c9fdb' },
  { index: 3, side: 'right', color: '#e6bd35' },
]

function threadPath(index: number, side: string) {
  const gap = index * 42
  return side === 'left'
    ? `M ${-240 + gap} -80 C ${640 + gap} 110, ${-420 + gap} 300, ${80 + gap} 520 S ${660 + gap} 730, ${340 + gap} 960`
    : `M ${1480 - gap} -80 C ${760 - gap} 160, ${1880 - gap} 330, ${1310 - gap} 540 S ${830 - gap} 750, ${1250 - gap} 960`
}

export default function HeroThreads() {
  const leftThreads = useMemo(() => THREADS.filter((t) => t.side === 'left'), [])
  const rightThreads = useMemo(() => THREADS.filter((t) => t.side === 'right'), [])

  return (
    <div className={styles.threads} aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" focusable="false">
        <g>
          {leftThreads.map((thread) => (
            <path
              key={`l-${thread.index}`}
              d={threadPath(thread.index, 'left')}
              stroke={thread.color}
              strokeWidth="1.5"
              strokeOpacity="0.35"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <g>
          {rightThreads.map((thread) => (
            <path
              key={`r-${thread.index}`}
              d={threadPath(thread.index, 'right')}
              stroke={thread.color}
              strokeWidth="1.5"
              strokeOpacity="0.35"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
