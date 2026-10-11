import { Block, Chip, Kicker, Slide, Title } from './primitives'
import { Feature, type SlideFn } from './parts'
import { SafetyPipelineDiagram } from './SafetyPipelineDiagram'
import { Store } from 'lucide-react'

export const slides2: SlideFn[] = [
  // Slide 6: Deep Dive — The 5-Layer Safety Pipeline (Animated SVG Diagram)
  () => (
    <Slide bg="bg-sun">
      <Kicker>Deterministic Safety §3.1</Kicker>
      <Title className="mt-2 !text-[72px]">Safety is code, not an LLM decision.</Title>
      <p className="mt-2 text-2xl text-ink/75 max-w-[1200px]">
        Rule 0 is enforced by strict algorithms before any prompt reaches the AI. Inbound queries pass through 5 deterministic layers.
      </p>
      <div className="mt-4 flex items-center gap-8">
        <SafetyPipelineDiagram />
        <div className="w-[340px] shrink-0 border-l-2 border-ink/20 pl-8">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-ink/60">Inside Every Turn</p>
          <div className="mt-6 space-y-6">
            {[
              ['01', 'Direct Hash Match', 'Instant O(1) catalog check against 150+ Schedule H, H1 & X salts.'],
              ['02', 'Adversarial Defense', 'Strips leetspeak obfuscations and spaces before semantic parsing.'],
              ['03', 'Acoustic Soundex', 'Catches phonetic typos and colloquial verbal queries.'],
            ].map(([n, title, description]) => (
              <div key={n}>
                <p className="font-heading text-[24px] font-semibold">
                  <span className="mr-3 font-mono text-sm text-ink/50">{n}</span>{title}
                </p>
                <p className="mt-1 text-lg leading-snug text-ink/75">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between border-t-2 border-ink/20 pt-4">
        <div className="flex gap-3">
          <Chip tone="ink">100% Intercept Rate</Chip>
          <Chip tone="cream">0% False Positives on OTC</Chip>
        </div>
        <p className="font-mono text-sm text-ink/70">
          Evaluated across 100 benchmark adversarial prompts · Zero leaks
        </p>
      </div>
    </Slide>
  ),

  // Slide 7: Active Composition & 32.3% Savings
  () => (
    <Slide bg="bg-cream">
      <Kicker>Quality Criteria B1 & B3</Kicker>
      <Title className="mt-3">Identical Active Salts. 32.3% Savings.</Title>
      <div className="mt-10 grid grid-cols-3 gap-8">
        <Block tone="sand" className="flex h-[450px] flex-col justify-between !p-7">
          <div>
            <div className="flex items-center justify-between">
              <Chip tone="ink">Branded Reference</Chip>
              <span className="font-mono text-xl font-bold text-ink/60">GSK</span>
            </div>
            <p className="mt-6 font-heading text-4xl font-bold">Augmentin 625 Duo</p>
            <p className="mt-2 text-xl font-medium text-ink/70">
              Amoxicillin 500mg + Potassium Clavulanate 125mg
            </p>
            <p className="mt-2 text-lg text-ink/60">Dosage: Oral Tablet (Strip of 10)</p>
          </div>
          <div>
            <p className="font-mono text-sm uppercase text-ink/50">Market MRP</p>
            <p className="font-heading text-5xl font-bold text-ink">₹204.40</p>
          </div>
        </Block>

        <Block tone="sun" className="flex h-[450px] flex-col justify-between !p-7">
          <div>
            <div className="flex items-center justify-between">
              <Chip tone="olive">32.3% Savings</Chip>
              <span className="font-mono text-xl font-bold text-ink/60">Mankind</span>
            </div>
            <p className="mt-6 font-heading text-4xl font-bold">Moxikind-CV 625</p>
            <p className="mt-2 text-xl font-medium text-ink/70">
              Amoxicillin 500mg + Potassium Clavulanate 125mg
            </p>
            <p className="mt-2 text-lg text-ink/60">Exact ratio & dosage form match</p>
          </div>
          <div>
            <p className="font-mono text-sm uppercase text-ink/50">Verified Price</p>
            <p className="font-heading text-5xl font-bold text-ink">₹138.35</p>
          </div>
        </Block>

        <Block tone="blush" className="flex h-[450px] flex-col justify-between !p-7">
          <div>
            <div className="flex items-center justify-between">
              <Chip tone="ink">63.3% Generic</Chip>
              <span className="font-mono text-xl font-bold text-ink/60">Govt PMBJP</span>
            </div>
            <p className="mt-6 font-heading text-4xl font-bold">Jan Aushadhi Amoxy-Clav</p>
            <p className="mt-2 text-xl font-medium text-ink/70">
              Amoxicillin 500mg + Potassium Clavulanate 125mg
            </p>
            <p className="mt-2 text-lg text-ink/60">Available at PMBJP Kendras</p>
          </div>
          <div>
            <p className="font-mono text-sm uppercase text-ink/50">Govt Fixed Price</p>
            <p className="font-heading text-5xl font-bold text-ink">₹75.00</p>
          </div>
        </Block>
      </div>

      <div className="mt-8 flex items-center justify-between rounded-2xl border-2 border-ink bg-sand px-6 py-3.5">
        <span className="font-mono text-lg font-bold">STRICT COMPOSITION RULES:</span>
        <span className="text-lg font-semibold">1. Exact Active Salts</span>
        <span className="text-lg font-semibold">2. Identical Milligram Ratio</span>
        <span className="text-lg font-semibold">3. Same Dosage Form</span>
        <span className="text-lg font-semibold">4. Mandatory Doctor Consult Advisory</span>
      </div>
    </Slide>
  ),

  // Slide 8: Cross-Pharmacy Price Arbitrage
  () => (
    <Slide bg="bg-sun">
      <Kicker>Price Arbitrage Criterion B2</Kicker>
      <Title className="mt-3">Real-Time E-Pharmacy Market Quotes.</Title>
      <div className="mt-8 grid grid-cols-5 gap-5">
        {[
          { name: 'Tata 1mg', price: '₹138.35', eta: '2 Days', stock: 'In Stock', rating: '4.8 ★', tone: 'cream' as const },
          { name: 'PharmEasy', price: '₹142.00', eta: 'Tomorrow', stock: 'In Stock', rating: '4.7 ★', tone: 'blush' as const },
          { name: 'Apollo 24|7', price: '₹145.50', eta: '2 Hours', stock: 'In Stock', rating: '4.9 ★', tone: 'sky' as const },
          { name: 'Netmeds', price: '₹139.00', eta: '3 Days', stock: 'In Stock', rating: '4.6 ★', tone: 'cream' as const },
          { name: 'Jan Aushadhi', price: '₹75.00', eta: 'Walk-in', stock: 'Available', rating: 'Govt PMBJP', tone: 'olive' as const },
        ].map((p, i) => (
          <Block key={i} tone={p.tone} className="flex h-[380px] flex-col justify-between !p-6">
            <div>
              <span className="rounded-full border border-ink bg-white px-3 py-1 font-mono text-xs font-bold">{p.rating}</span>
              <p className="mt-4 font-heading text-3xl font-bold">{p.name}</p>
              <p className="mt-2 text-lg font-medium text-ink/70">ETA: {p.eta}</p>
              <p className="mt-1 font-mono text-sm font-bold text-olive">{p.stock}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-ink/50">Live Quote</p>
              <p className="font-heading text-4xl font-bold">{p.price}</p>
            </div>
          </Block>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between rounded-2xl border-[3px] border-ink bg-white px-8 py-4 shadow-[4px_4px_0_0_#17140f]">
        <div className="flex items-center gap-4">
          <Store className="h-8 w-8 text-ink" />
          <p className="text-xl font-bold">Pincode-Aware Availability: Tested across Metro & Tier-2 PINs</p>
        </div>
        <Chip tone="ink">Stock Verified</Chip>
      </div>
    </Slide>
  ),

  // Slide 9: Live Feature — Conversational Interface
  () => (
    <Feature
      kicker="Conversational Interface §1.4"
      title="Safe, empathic, structured."
      chips={
        <>
          <Chip tone="sun">Multi-Turn Context</Chip>
          <Chip tone="blush">JSON Schema Cards</Chip>
          <Chip tone="sky">Disclaimer Gate</Chip>
          <Chip tone="olive">Voice & OCR</Chip>
        </>
      }
      src="/deck/preview/chat"
      url="medibot.health/chat"
    />
  ),
]
