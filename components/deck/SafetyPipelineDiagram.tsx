'use client'

import React from 'react'
import { ShieldAlert, CheckCircle2, ShieldCheck, Lock } from 'lucide-react'
import styles from './safety-pipeline.module.css'

export function SafetyPipelineDiagram() {
  // SVG Coordinates for the 5-layer pipeline
  // Query Input (X: 120, Y: 240)
  // L0 Exact (X: 300, Y: 150)
  // L1 Leet (X: 470, Y: 150)
  // L2 Levenshtein (X: 640, Y: 150)
  // L3 Soundex (X: 810, Y: 150)
  // Schedule H Intercept (X: 970, Y: 150)
  // OTC Path (bypasses to Y: 330) -> OTC Dispense (X: 970, Y: 330)

  const restrictedPath = "M 120 240 C 200 240, 220 150, 300 150 L 810 150 C 890 150, 910 150, 970 150"
  const otcPath = "M 120 240 C 200 240, 220 330, 300 330 L 810 330 C 890 330, 910 330, 970 330"

  return (
    <div className="relative h-[530px] min-w-0 flex-1">
      {/* Top Status Ticker */}
      <div className="absolute left-4 top-2 flex items-center gap-3 font-mono text-sm font-bold uppercase tracking-widest text-ink/70">
        <Lock className="h-4 w-4 text-ink" />
        <span>Fail-Closed Deterministic Engine</span>
        <span className="text-ink/30">/</span>
        <span className="text-destructive font-black">100% Interception Rate</span>
      </div>

      <svg
        viewBox="0 0 1080 500"
        className="h-full w-full text-ink"
        role="img"
        aria-label="Deterministic 5-Layer Prescription Safety Pipeline"
      >
        <defs>
          <pattern id="diag-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#17140f" opacity="0.1" />
          </pattern>
          <marker id="diag-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 1 1 L 8 5 L 1 9" fill="none" stroke="#17140f" strokeWidth="1.5" />
          </marker>
        </defs>

        {/* Background Dot Grid */}
        <rect x="20" y="40" width="1040" height="430" rx="28" fill="url(#diag-grid)" stroke="#17140f" strokeWidth="2" strokeOpacity="0.15" />

        {/* Path Tracks */}
        <path d={restrictedPath} fill="none" stroke="#f5f0e1" strokeWidth="16" />
        <path d={restrictedPath} fill="none" stroke="#17140f" strokeWidth="3" strokeDasharray="6 6" markerEnd="url(#diag-arrow)" />

        <path d={otcPath} fill="none" stroke="#f5f0e1" strokeWidth="16" />
        <path d={otcPath} fill="none" stroke="#9bab5a" strokeWidth="3" strokeDasharray="6 6" markerEnd="url(#diag-arrow)" />

        {/* Animated Query Packets */}
        <circle r="8" fill="#f3d35b" stroke="#17140f" strokeWidth="2.5" className={styles.packet}>
          <animateMotion dur="3.5s" repeatCount="indefinite" path={restrictedPath} />
        </circle>
        <circle r="8" fill="#f2b5d9" stroke="#17140f" strokeWidth="2.5" className={styles.packetBlocked}>
          <animateMotion dur="3.5s" begin="1.8s" repeatCount="indefinite" path={restrictedPath} />
        </circle>
        <circle r="7" fill="#9bab5a" stroke="#17140f" strokeWidth="2" className={styles.packet}>
          <animateMotion dur="4s" begin="0.8s" repeatCount="indefinite" path={otcPath} />
        </circle>

        {/* SOURCE NODE: Inbound User Query */}
        <g transform="translate(120, 240)">
          <rect x="-85" y="-55" width="170" height="110" rx="20" fill="#17140f" />
          <rect x="-82" y="-52" width="164" height="104" rx="18" fill="#f5f0e1" stroke="#17140f" strokeWidth="2" />
          <text y="-24" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="monospace" letterSpacing="1.2" fill="#7a7365">INBOUND QUERY</text>
          <text y="0" textAnchor="middle" fontSize="13" fontWeight="800" fill="#17140f">&ldquo;augmentin 625&rdquo;</text>
          <text y="20" textAnchor="middle" fontSize="11" fontWeight="600" fill="#7a7365">or &ldquo;paracetamol&rdquo;</text>
        </g>

        {/* LAYER 0: Exact Hash */}
        <g transform="translate(300, 150)">
          <rect x="-60" y="-42" width="120" height="84" rx="16" fill="#17140f" />
          <rect x="-58" y="-40" width="116" height="80" rx="14" fill="#f3d35b" stroke="#17140f" strokeWidth="2" />
          <text y="-18" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="monospace" fill="#17140f">L0: EXACT</text>
          <text y="2" textAnchor="middle" fontSize="12" fontWeight="700" fill="#17140f">Catalog Hash</text>
          <text y="20" textAnchor="middle" fontSize="9" fontWeight="600" fill="#17140f" opacity="0.8">Direct Salt Match</text>
        </g>

        {/* LAYER 1: Leet Sanitizer */}
        <g transform="translate(470, 150)">
          <rect x="-60" y="-42" width="120" height="84" rx="16" fill="#17140f" />
          <rect x="-58" y="-40" width="116" height="80" rx="14" fill="#f2b5d9" stroke="#17140f" strokeWidth="2" />
          <text y="-18" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="monospace" fill="#17140f">L1: LEET</text>
          <text y="2" textAnchor="middle" fontSize="12" fontWeight="700" fill="#17140f">Space & Obfus</text>
          <text y="20" textAnchor="middle" fontSize="9" fontWeight="600" fill="#17140f" opacity="0.8">a-u-g-m-e-n-t-i-n</text>
        </g>

        {/* LAYER 2: Levenshtein */}
        <g transform="translate(640, 150)">
          <rect x="-60" y="-42" width="120" height="84" rx="16" fill="#17140f" />
          <rect x="-58" y="-40" width="116" height="80" rx="14" fill="#b4c3ec" stroke="#17140f" strokeWidth="2" />
          <text y="-18" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="monospace" fill="#17140f">L2: FUZZY</text>
          <text y="2" textAnchor="middle" fontSize="12" fontWeight="700" fill="#17140f">Levenshtein</text>
          <text y="20" textAnchor="middle" fontSize="9" fontWeight="600" fill="#17140f" opacity="0.8">Edit Distance &le; 2</text>
        </g>

        {/* LAYER 3: Soundex */}
        <g transform="translate(810, 150)">
          <rect x="-60" y="-42" width="120" height="84" rx="16" fill="#17140f" />
          <rect x="-58" y="-40" width="116" height="80" rx="14" fill="#9bab5a" stroke="#17140f" strokeWidth="2" />
          <text y="-18" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="monospace" fill="#17140f">L3: ACOUSTIC</text>
          <text y="2" textAnchor="middle" fontSize="12" fontWeight="700" fill="#17140f">Soundex Code</text>
          <text y="20" textAnchor="middle" fontSize="9" fontWeight="600" fill="#17140f" opacity="0.8">Phonetic Slang</text>
        </g>

        {/* DESTINATION 1: CDSCO INTERCEPTION SHIELD */}
        <g transform="translate(975, 150)">
          <rect x="-75" y="-55" width="150" height="110" rx="20" fill="#17140f" />
          <rect x="-72" y="-52" width="144" height="104" rx="18" fill="#f2b5d9" stroke="#17140f" strokeWidth="2.5" />
          <circle cx="0" cy="-14" r="16" fill="#c2362d" />
          <text y="-9" textAnchor="middle" fontSize="14" fontWeight="800" fill="#ffffff">!</text>
          <text y="14" textAnchor="middle" fontSize="11" fontWeight="800" fill="#17140f">SCHEDULE H</text>
          <text y="30" textAnchor="middle" fontSize="9" fontWeight="700" fill="#c2362d">BLOCKED (100%)</text>
        </g>

        {/* DESTINATION 2: OTC CLEAR DISPENSARY */}
        <g transform="translate(975, 330)">
          <rect x="-75" y="-50" width="150" height="100" rx="20" fill="#17140f" />
          <rect x="-72" y="-47" width="144" height="94" rx="18" fill="#f5f0e1" stroke="#9bab5a" strokeWidth="2.5" />
          <circle cx="0" cy="-12" r="15" fill="#9bab5a" />
          <text y="-6" textAnchor="middle" fontSize="13" fontWeight="800" fill="#ffffff">&check;</text>
          <text y="14" textAnchor="middle" fontSize="11" fontWeight="800" fill="#17140f">OTC DISPENSE</text>
          <text y="28" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7f9145">Arbitrage &ge;25%</text>
        </g>

        {/* Rule 0 Banner */}
        <g transform="translate(540, 420)">
          <rect x="-320" y="-22" width="640" height="44" rx="14" fill="#17140f" />
          <rect x="-318" y="-20" width="636" height="40" rx="12" fill="#f5f0e1" stroke="#17140f" strokeWidth="1.5" />
          <text y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#17140f">
            RULE 0: &ldquo;This medication requires a valid prescription. Please consult your doctor.&rdquo;
          </text>
        </g>
      </svg>
    </div>
  )
}
