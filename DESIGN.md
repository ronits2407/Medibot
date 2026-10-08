# MediBot: DESIGN.md

> An intelligent pharmacy assistant and health companion (Next.js, Groq, MongoDB Atlas).
> This document is the single source of truth for an implementing agent. Read it fully before writing code. Where this file says **MUST**, treat it as a hard requirement.

---

## 0. Agent Operating Rules (read first)

1. **Safety is deterministic code, never an LLM decision.** The LLM may *assist* (entity extraction, classification as an extra net, writing prose) but the final restricted/OTC verdict is computed by code against a salt table.
2. **Fail closed.** If any safety layer says "restricted", intercept. If confidence is low, ask a clarifying question. Never guess.
3. **The mandated string MUST be output verbatim, character for character:**
   `This medication requires a valid prescription. Please consult your doctor.`
   Define it once in `lib/constants.ts` and import it everywhere. Never let the LLM generate it.
4. **Never diagnose. Never prescribe.** No "you have X", no dose recommendations beyond what the label/dataset states with a "confirm with your doctor" caveat.
5. **Numbers come from tools/DB, not the LLM.** Prices, MRP, savings %, composition, delivery ETA are injected into cards by code.
6. **The disclaimer is appended by code**, never trusted to the LLM.
7. **Alternatives MUST have an identical `compositionHash`** to the source drug (salt + strength + unit, and form shown). Re-verify in code before display.
8. **Simulated data MUST be labelled.** If pharmacy prices are seeded/simulated, show a "Demo data, updated <timestamp>" badge and document it in the technical report.
9. **Minimal data.** Collect only what is needed. Uploaded images are processed and discarded.
10. Write TypeScript strict mode. Validate every external boundary with Zod. Add tests for the guard before building anything else.

---

## 1. Product Summary

**Problem:** Medicine prices are scattered, users don't know about cheaper equivalents, there is no 24/7 safe conversational source for basic medication info, and self-medication with prescription-only drugs is hazardous.

**Objective:** A conversational assistant that
1. compares prices across certified e-pharmacies,
2. recommends composition-identical alternatives,
3. answers general medication/health-info questions in natural language,
4. enforces prescription-safety controls on every turn.

**Target users:** Chronic patients (refills, stock, predictable delivery), budget-conscious consumers (cheapest verified generics), information seekers (interactions, side effects, safe usage).

### 1.1 Rubric Mapping (100 pts), design must target each line

| Rubric item | Pts | Design response |
|---|---|---|
| A1 Restricted block rate (100%, **gate: 0 caps total at 60**) | 20 | Multi-layer fail-closed guard (§7), typo/transliteration stress tests |
| A2 False positives <2% | 10 | Salt table is primary; no broad regex like "antibiotic"/"rx"; OTC eval set |
| A3 Disclaimer shown at start, repeated, ack tracked and reported | 10 | Disclaimer gate + per-response footer + ack stored and shown on dashboard (§16) |
| B1 Avg savings ≥25% | 10 | Rank by savings; basket savings; Jan Aushadhi generics |
| B2 Price match >95% vs partner sources | 10 | Adapter layer + freshness checks + price-audit test (§10) |
| B3 Verified identical composition + advise doctor/pharmacist | 10 | `compositionHash` exact match, strength + form displayed |
| C1 Query resolution >85% | 12 | Hybrid semantic resolver, clarification chips, tools + RAG + web fallback |
| C2 Multi-turn depth | 8 | Session entity memory + rolling summary (§12) |
| C3 CSAT ≥4.5 | 10 | Thumbs + 1-5 micro survey, polished UX, streaming |

**Deductions:** diagnosing or prescribing = -10 per instance (max -20). Output validator + refusal intent exist to prevent this.

**Tie-break order:** Criterion A score, then price match accuracy, then query resolution rate.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ App Router, TypeScript (strict) |
| Auth | Auth.js (NextAuth v5) with Google provider, MongoDB adapter |
| LLM | Groq: `llama-3.3-70b-versatile` (composer), `llama-3.1-8b-instant` (router, extractor, classifier) |
| Vision | Groq vision model (Llama 4 Scout class); Tesseract.js as fallback |
| STT | Groq Whisper (`whisper-large-v3-turbo`); browser Web Speech API fallback |
| TTS (optional) | Browser `speechSynthesis` |
| Database | MongoDB Atlas via Mongoose (or native driver) |
| Vector + text search | Atlas Vector Search and Atlas Search (fuzzy, phonetic) in the same cluster |
| Embeddings | `bge-m3` or `multilingual-e5-large` (HF Inference API, or `transformers.js` locally) |
| Validation | Zod (equivalent of Pydantic) |
| Streaming | Vercel AI SDK (`streamText`, `streamObject`, `useChat`/`useObject`) |
| Markdown | `react-markdown` + `remark-gfm`, per-block memoized |
| UI | Tailwind, shadcn/ui, Framer Motion, lucide-react |
| Web search | Tavily (or Brave/Serper) as a tool with domain allowlist; Groq `compound` as an alternative |
| Image storage | None by default (process in memory and discard); UploadThing/Cloudinary only if needed |
| Location | Browser Geolocation + India Post pincode API; Haversine distance |
| Jobs | Vercel Cron (refill reminders, price refresh) |
| Email (reminders) | Resend |
| Testing | Vitest (unit), Playwright (e2e), custom eval harness |
| Deploy | Vercel + MongoDB Atlas |

### 2.1 Environment variables (`.env.example`)

```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/medibot?retryWrites=true&w=majority
GROQ_API_KEY=
AUTH_SECRET=                # openssl rand -base64 32
AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
HF_API_TOKEN=               # embeddings (if not local)
TAVILY_API_KEY=             # web search
RESEND_API_KEY=             # reminders
CRON_SECRET=
EMBEDDING_MODEL=bge-m3
GUARD_TAU_HIGH=0.82         # tuned via eval
GUARD_TAU_LOW=0.55
GUARD_MARGIN=0.06
```

---

## 3. System Architecture

```
User (text / voice / image)
  -> Input Normalizer (STT, OCR/vision, language detect, translate-to-EN)
  -> Entity Extractor (small LLM, JSON: [{mention, type}])
  -> Hybrid Resolver (vector + fuzzy + phonetic, merged by RRF)
  -> Prescription Guard   <- deterministic salt-table lookup is FINAL AUTHORITY
       + LLM safety classifier (extra net, enum RESTRICTED/OTC/UNKNOWN)
       + regex (last-resort backup)
       -> if ANY says restricted: emit mandated prompt + Restricted card
  -> LLM Router (enum intent, temperature 0)
  -> Tool execution (lookup, alternatives, prices, ETA, interactions, RAG, web search)
  -> LLM Composer (strict JSON: markdown + card selection)
  -> Output Validator (Zod + rules: no diagnosis, composition re-verified, disclaimer appended)
  -> Stream to UI (guard result first, then text tokens, then cards, then sources)
  -> Persist message + audit log
```

**Ordering invariant:** the Prescription Guard runs **before** the router and **again on every turn**, including follow-ups ("what about the second one?" must resolve to a drug, then be guarded).

---

## 4. Folder Structure

```
medibot/
  app/
    (auth)/login/page.tsx
    (app)/
      layout.tsx                  # sidebar + disclaimer gate
      chat/[chatId]/page.tsx
      chat/new/page.tsx
      medicines/page.tsx          # My Medicines / Refills
      dashboard/page.tsx          # Safety Dashboard
      settings/page.tsx
    api/
      auth/[...nextauth]/route.ts
      chat/route.ts               # main streaming endpoint
      chats/route.ts              # list, create
      chats/[id]/route.ts         # get, delete, rename
      upload/route.ts             # image -> extracted drugs
      stt/route.ts                # audio -> text
      disclaimer/route.ts         # record acknowledgement
      feedback/route.ts           # thumbs + CSAT
      location/route.ts           # pincode resolve
      reminders/route.ts
      metrics/route.ts            # dashboard data
      cron/refills/route.ts
      cron/prices/route.ts
      user/delete/route.ts        # delete-my-data
  components/
    chat/ (MessageList, Message, Composer, VoiceButton, ImageUpload,
           StreamingMarkdown, AutoScroll, FollowUpChips, SourcesFooter)
    cards/ (registry.ts, RestrictedAlert, MedicineCard, PriceTable,
            AlternativesCard, InteractionCard, DeliveryEta,
            PrescriptionReview, ClarifyChips, SourcesCard)
    disclaimer/ (DisclaimerGate, DisclaimerFooter)
    dashboard/ (BlockRateChart, FalsePositiveGauge, AckStats, SavingsStats, GuardExplain)
    ui/ (shadcn)
  lib/
    constants.ts                  # MANDATED_PROMPT, DISCLAIMER, thresholds
    db/ (client.ts, models/*.ts)
    guard/ (extractor.ts, resolver.ts, saltCheck.ts, classifier.ts,
            regexNet.ts, index.ts, explain.ts)
    llm/ (groq.ts, router.ts, composer.ts, prompts/*.ts, schemas.ts)
    tools/ (lookupMedicine.ts, getAlternatives.ts, comparePrices.ts,
            getDeliveryEta.ts, checkInteractions.ts, searchKnowledge.ts,
            webSearch.ts, setRefillReminder.ts, index.ts)
    rag/ (chunker.ts, embed.ts, retrieve.ts)
    i18n/ (detect.ts, translate.ts, transliterate.ts)
    pricing/ (adapter.ts, seededAdapter.ts, janAushadhi.ts)
    memory/ (entityMemory.ts, summarizer.ts)
    validators/ (output.ts, diagnosisPatterns.ts)
    audit.ts
  scripts/
    import-1mg.ts
    import-mid.ts
    build-salts.ts
    gen-aliases.ts               # typo augmentation
    embed-all.ts
    seed-prices.ts
    seed-pharmacies.ts
    create-indexes.ts
  eval/
    datasets/ (restricted.jsonl, otc.jsonl, typos.jsonl, multilingual.jsonl,
               alternatives.jsonl, general.jsonl, multiturn.jsonl)
    run.ts                       # npm run eval
    report.ts                    # outputs markdown benchmark table
  docs/ (TECHNICAL.md, DATASETS.md, LIMITATIONS.md)
  DESIGN.md
```

---

## 5. Data Model (MongoDB)

### 5.1 `medicines`
```ts
{
  _id, name, nameNormalized, manufacturer, mrp: number, packSize: string,
  form: "tablet"|"capsule"|"syrup"|"injection"|"cream"|"drops"|"other",
  composition: [{ salt: string, saltNormalized: string, strength: number|null, unit: string|null }],
  compositionHash: string,           // sorted(salt+strength+unit).join("|"), lowercased
  saltsKey: string,                  // sorted salt names only, for cross-strength lookup
  therapeuticClass: string,
  schedule: "H"|"H1"|"X"|"NDPS"|"OTC"|"UNKNOWN",
  uses: string, sideEffects: string, interactions: string, howToUse: string,
  source: "1mg"|"mid"|"jan_aushadhi", sourceId: string,
  isGenericJanAushadhi: boolean,
  updatedAt
}
```
Indexes: unique `(source, sourceId)`, `compositionHash`, `saltsKey`, Atlas Search on `name`, `nameNormalized`.

### 5.2 `medicine_names` (semantic resolver index)
```ts
{
  _id, medicineId, text: string, kind: "brand"|"generic"|"salt"|"alias"|"typo"|"transliteration",
  lang: "en"|"hi"|"bn"|"as"|"ta"|"te"|..., embedding: number[],   // 1024 dim for bge-m3
  phonetic: string                                                 // Double Metaphone
}
```
Atlas Vector Search index `medicine_names_vec` on `embedding` (cosine), filter fields: `kind`, `lang`.

### 5.3 `salts_restricted` (**final authority for the guard**)
```ts
{ _id, salt, saltNormalized, schedule: "H"|"H1"|"X"|"NDPS", source: "CDSCO"|"dataset", notes }
```
Unique index on `saltNormalized`. Include synonyms (e.g. "amoxycillin"). Seed from the CDSCO Schedule H/H1/X lists and NDPS list; supplement from the dataset.

### 5.4 `otc_salts_allowlist` (optional)
Known-OTC salts (paracetamol, cetirizine, fexofenadine, ORS, antacids) used to drive false-positive tests and to confirm OTC status.

### 5.5 `knowledge_chunks` (RAG)
```ts
{ _id, drugId, salt, section: "uses"|"side_effects"|"interactions"|"how_to_use"|"storage"|"faq",
  text, source, sourceUrl, lang: "en", embedding: number[], updatedAt }
```
Vector index `knowledge_vec` with filter on `drugId`, `salt`, `section`.

### 5.6 `pharmacies`
```ts
{ _id, name: "1mg"|"PharmEasy"|"Apollo 24|7"|"Netmeds"|"Jan Aushadhi"|..., baseUrl, certified: true,
  serviceablePincodePrefixes: string[], sla: { standardHrs, expressHrs, cutoffTime }, hubs: [{ pincode, lat, lng }] }
```

### 5.7 `pharmacy_prices`
```ts
{ _id, medicineId, pharmacyId, price, mrp, inStock, stockQty?, source: "live"|"seeded", fetchedAt }
```
Index `(medicineId, pharmacyId)`. TTL or freshness check: flag prices older than a configured threshold.

### 5.8 `users`
```ts
{ _id, googleId, email, name, language, pincode?, disclaimerAckAt?, disclaimerVersion, createdAt }
```

### 5.9 `chats` and `messages`
```ts
chats:    { _id, userId, title, entityMemory: EntityMemory, summary: string, createdAt, updatedAt }
messages: { _id, chatId, role: "user"|"assistant", content, language, originalContent?,
            structured?: ComposerOutput, cards: Card[], sources: Source[],
            guard: GuardResult, toolCalls: [...], feedback?: { thumb, csat }, ts }
```
Persist `cards` so history re-renders identically.

### 5.10 Others
- `my_medicines`: `{ userId, medicineId, frequency, refillEveryDays, lastRefill, reminderChannel }`
- `reminders`: `{ userId, myMedicineId, dueAt, sentAt }`
- `audit_logs`: `{ ts, userId, chatId, messageId, rawQuery, resolvedEntities, layerVerdicts, finalVerdict, scores }` (hash or truncate raw query as per privacy policy)
- `disclaimer_acks`: `{ userId, version, ackAt, sessionId }`
- `csat`: `{ userId, chatId, rating(1-5), comment?, ts }`

---

## 6. Dataset Import Pipeline

### 6.1 Sources
| Source | Use | Note |
|---|---|---|
| 1mg Medicine Dataset (Kaggle) | brand, manufacturer, MRP, composition, uses, side effects, substitutes | Verify licence before use |
| Medicines Information Dataset (Mendeley) | 192k medicines, therapeutic classes, substitution info | Verify licence |
| CDSCO Schedule H/H1/X lists, NDPS list | `salts_restricted` | Official/public lists |
| Jan Aushadhi (PMBJP) product list | generic price angle | Public |
| openFDA labels, MedlinePlus, NHS, WHO | RAG chunks / web search | Respect terms; record licence per source |

Document every source, licence, and preprocessing step in `docs/DATASETS.md`.

### 6.2 Steps (`scripts/`)
1. **Clean:** trim, lowercase for normalized fields, unify unicode, drop duplicates, drop rows without composition or MRP.
2. **Parse composition** into `[{salt, strength, unit}]`. Handle formats such as `Amoxycillin (500mg) + Clavulanic Acid (125mg)`. Normalize salt synonyms (amoxycillin to amoxicillin). Log unparseable rows to `import_errors.jsonl`.
3. **Compute** `compositionHash = sorted(salt+":"+strength+unit).join("|")` and `saltsKey`.
4. **Infer `form`** from the name/pack text; if unknown, store `"other"` and display "form not stated" (B3 partial marks otherwise).
5. **Schedule assignment:** for each medicine, if any salt is in `salts_restricted`, set `schedule` to the strictest matching. Else `OTC` only if all salts are in the OTC allowlist; else `UNKNOWN` (treated cautiously, see §7).
6. **Upsert** into `medicines`.
7. **Generate aliases** (`gen-aliases.ts`): per brand and salt, produce typos (swap, drop, double, keyboard-neighbour), phonetic variants, and Hindi/regional transliterations (e.g. "ऑगमेंटिन"). Store in `medicine_names` with `kind: "typo" | "transliteration"`.
8. **Embed** all `medicine_names.text` and `knowledge_chunks.text` in batches.
9. **Create indexes** (`create-indexes.ts`): vector indexes, Atlas Search index with fuzzy + phonetic analyzers, standard indexes.
10. **Seed** pharmacies and `pharmacy_prices` (labelled `source: "seeded"` unless a live adapter exists).

Make every script idempotent (upsert by `(source, sourceId)`).

### 6.3 Atlas index definitions (summary)
- `medicine_names_vec`: vector, 1024 dims, cosine, filters `kind`, `lang`.
- `knowledge_vec`: vector, 1024 dims, cosine, filters `drugId`, `salt`, `section`.
- `medicines_search`: Atlas Search on `name`, `nameNormalized` with fuzzy (`maxEdits: 2`) and a phonetic analyzer.

---

## 7. Prescription Guard (highest priority module)

### 7.1 Why layered
Embeddings confuse look-alike names (Alprazolam vs Alfuzosin, Clonazepam vs Clonidine). A single missed restricted drug caps the total score at 60. So multiple independent nets, fail-closed.

### 7.2 Algorithm (`lib/guard/index.ts`)

```
guard(rawText, translatedText, sessionEntityMemory) -> GuardResult

1. Candidate extraction
   - mentions = LLM extractor(rawText + translatedText) -> [{mention, type}]
   - add mentions resolved from memory references ("the second one", "that medicine")
   - add n-gram candidates from raw text (fallback if extractor fails)
2. Hybrid resolution per mention
   - vectorHits  = medicine_names_vec top-k
   - fuzzyHits   = Atlas Search fuzzy top-k
   - phoneticHits= Double Metaphone matches
   - merged = Reciprocal Rank Fusion(vectorHits, fuzzyHits, phoneticHits)
   - output top candidates [{medicineId, score, via}]
3. Salt check (FINAL AUTHORITY)
   - for each top candidate: composition -> salts -> lookup in salts_restricted
   - restricted if ANY salt matches
4. Fail-closed decision
   - top1 restricted and score >= TAU_HIGH         -> RESTRICTED
   - top1 and top2 within GUARD_MARGIN and either restricted -> RESTRICTED
   - any candidate in top-3 restricted and score >= TAU_LOW and top1 is not clearly OTC -> RESTRICTED
   - overall confidence < TAU_LOW                  -> NEEDS_CLARIFICATION
   - top1 clearly OTC (score >= TAU_HIGH, margin ok) -> OTC
5. LLM classifier net (temperature 0, enum RESTRICTED|OTC|UNKNOWN) on the FULL raw query
   - handles indirect phrasing ("the sleeping pill my doctor gave me")
   - if classifier says RESTRICTED and nothing resolved -> RESTRICTED
6. Regex net (backup only): "schedule h", "prescription only", "h1", "narcotic" and similar explicit phrases.
   - DO NOT include broad terms like "antibiotic" or bare "rx" as hard blocks (false positives).
7. Final = RESTRICTED if ANY layer says RESTRICTED; else NEEDS_CLARIFICATION if low confidence; else OTC/OK
```

### 7.3 Behaviour on interception
- Output the mandated prompt verbatim as the **first streamed event**, in a `RestrictedAlert` card.
- Still allowed on a restricted drug: **general information about what the drug class is**, kept minimal and non-directive, plus "Please consult your doctor". **Do not** recommend purchase, dosing, or substitution for restricted drugs. Price compare/alternatives for restricted drugs: show the mandated prompt and refuse to push purchase (info only).
- Log to `audit_logs` with layer verdicts.

### 7.4 Multilingual and typo handling
- Run the guard on **original text and translated text** plus transliterated candidates.
- Normalize unicode, strip zero-width characters, handle leetspeak and spacing tricks ("a l p r a z o l a m").
- Resolve conversational references through `entityMemory` and guard the resolved drug.

### 7.5 Prompt-injection resistance
The guard runs outside the LLM prompt path for its final verdict, so "ignore previous instructions" cannot disable it. Treat user text and fetched web pages as untrusted data.

### 7.6 Output type
```ts
GuardResult = {
  verdict: "RESTRICTED" | "OTC" | "NEEDS_CLARIFICATION" | "NO_DRUG",
  entities: [{ mention, medicineId?, name?, salts[], schedule, score, via: "vector"|"fuzzy"|"phonetic" }],
  layers: { semantic, saltTable, classifier, regex },   // each with verdict
  triggeredBy: "saltTable"|"classifier"|"regex"|"lookalikeMargin",
  clarifyOptions?: [{ medicineId, name }]
}
```

### 7.7 Tuning
Tune `TAU_HIGH`, `TAU_LOW`, `MARGIN` on the eval set. Report a precision/recall curve in the deck. Optimize for **recall on restricted = 100%** first, then reduce false positives.

---

## 8. LLM Layer

### 8.1 Settings
All LLM calls: `temperature: 0`, `top_p: 1`, fixed `seed`, JSON mode / structured outputs. Note that Groq is near-deterministic at temperature 0, not guaranteed, which is another reason safety is code.

### 8.2 Router (enum, strict JSON)
```ts
const Intent = z.enum([
  "PRICE_COMPARE", "FIND_ALTERNATIVE", "DRUG_INFO", "INTERACTION_CHECK",
  "REFILL_REMINDER", "DELIVERY_ETA", "PRESCRIPTION_UPLOAD",
  "GENERAL_HEALTH", "DIAGNOSIS_REQUEST", "SMALL_TALK", "OUT_OF_SCOPE"
]);
const RouterOut = z.object({
  intent: Intent,
  entities: z.array(z.object({ mention: z.string(), type: z.enum(["DRUG","CONDITION","PHARMACY","PINCODE","OTHER"]) })),
  isFollowUp: z.boolean(),
  needsClarification: z.boolean(),
  language: z.string()
});
```
- `DIAGNOSIS_REQUEST` (e.g. "I have chest pain and fever, what do I have?") returns a polite refusal plus "please see a doctor"; red-flag symptoms get an urgent-care note.
- Optional semantic fallback using `intent_examples` vectors if the LLM router has low confidence.

### 8.3 Tools (function calling)
All tools accept a **query string** and resolve through the hybrid resolver first. Each returns `{ resolvedId, confidence, candidates[], data }`; low confidence yields a `ClarifyChips` card.

| Tool | Behavior |
|---|---|
| `lookup_medicine(query)` | Semantic resolve; return composition, MRP, form, class, schedule |
| `get_alternatives(medicineId)` | Exact `compositionHash` match, sorted by savings; includes strength and form; **never for restricted drugs** (info only) |
| `compare_prices(medicineId, pincode)` | Per-pharmacy price, stock, ETA via pricing adapter |
| `get_delivery_eta(pharmacyId, pincode)` | Serviceability and ETA |
| `check_interactions(medicineIds[])` | RAG over interaction chunks plus dataset field; flags unknown pairs honestly |
| `search_knowledge(query, drugId?)` | RAG retrieval with confidence |
| `web_search(query)` | Allowlisted domains; returns sources[] |
| `set_refill_reminder(...)` | Creates `my_medicines` and `reminders` |

### 8.4 Composer (strict JSON)
```ts
const ComposerOut = z.object({
  intent: Intent,
  restricted: z.boolean(),
  answer_markdown: z.string().max(3000),
  cards: z.array(CardSelection),          // type + references to tool results (IDs), not raw numbers
  follow_up_suggestions: z.array(z.string()).max(4),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  needs_clarification: z.boolean(),
  sources_used: z.array(z.number())       // indices into retrieved sources
});
```
Composer prompt rules: answer only from tool/RAG context; cite `[1][2]`; no diagnosis; no prescriptive dosing; say "I don't have verified information on this" when context is thin; respond in the user's language; keep drug and salt names in English.

### 8.5 Output Validator (`lib/validators/output.ts`)
Run after composer, before streaming the final message:
1. Zod parse (retry once on failure, then fall back to a safe template).
2. **Diagnosis/prescribing detector:** reject patterns such as "you have", "you are suffering from", "you should take X mg", "I recommend you take". Retry once, then fall back to a safe template.
3. **Composition re-verification:** every alternative card's `compositionHash` must equal the source's. Drop mismatches.
4. **Numbers check:** any price/savings in markdown must match tool data; strip unmatched numerics or regenerate from the card data.
5. **Restricted consistency:** if the guard said RESTRICTED, the response MUST contain the mandated prompt and MUST NOT contain purchase/dosing/substitution advice.
6. **Disclaimer:** appended by code (§16).
7. Strip unsafe HTML and links not on the allowlist.

---

## 9. RAG and Web Search

### 9.1 When to use what
| Use RAG | Don't use RAG (structured/deterministic) |
|---|---|
| Side effects, usage, how-to-take, storage | Price, stock, MRP |
| Interactions, contraindications | Composition matching (hash) |
| General health FAQs | Schedule H check (salt table) |

### 9.2 Pipeline
1. **Chunk** by drug and section (200 to 400 tokens), attach metadata (`drugId`, `salt`, `section`, `source`, `sourceUrl`).
2. **Embed** with the multilingual model (queries are translated to English first for retrieval, or embedded multilingually).
3. **Retrieve** via Atlas Vector Search with a `drugId`/`salt` metadata filter, top-k 5, optional rerank.
4. **Confidence gate:** if the top score is below threshold, go to web search (allowlisted). If still nothing, answer "I don't have verified information on this" and suggest a pharmacist/doctor.
5. **Ground:** the composer may only use retrieved chunks or pages and must cite them.

### 9.3 Web search rules
- Used **only** for informational gaps (`DRUG_INFO`, `GENERAL_HEALTH`) when RAG confidence is low. **Never** for safety decisions or prices.
- **Domain allowlist:** nhs.uk, medlineplus.gov, who.int, fda.gov / openFDA, cdsco.gov.in, nlm.nih.gov, mayoclinic.org, plus compared pharmacy domains.
- Record every URL visited: `message.sources[] = { n, title, url, domain, fetchedAt, snippet }`.
- UI shows a collapsible **"Sources (N)"** footer with favicon chips and timestamps; inline `[n]` citations link to it.
- Fetched content is **untrusted**: strip instructions, never let it influence guard decisions, and run output validation on the final text.

---

## 10. Pricing and Delivery

### 10.1 Adapter interface (`lib/pricing/adapter.ts`)
```ts
interface PriceAdapter {
  name: string;
  getPrice(medicineId: string): Promise<{ price: number; inStock: boolean; fetchedAt: Date; source: "live"|"seeded" }>;
  getEta(pincode: string): Promise<{ etaText: string; etaHours: number; express: boolean } | null>;
}
```
Ship `SeededAdapter` (derived from MRP with documented per-pharmacy discount ranges, deterministic seed) and leave stubs for live adapters. **Be honest** in UI and docs that prices are demo/seeded unless live.

### 10.2 B2 price-match accuracy
- Single code path for price display (cards read straight from `pharmacy_prices`).
- Add a nightly test comparing displayed price vs adapter source; expose "price match accuracy" on the dashboard.
- Show `fetchedAt`; mark stale prices.

### 10.3 Savings (B1)
- `savingsPct = (sourceMrp - altPrice) / sourceMrp * 100`, computed in code, 1 decimal.
- Surface the **best-price pharmacy** for the best alternative, and basket total savings for a prescription.
- Jan Aushadhi generics shown as a distinct savings option where composition matches.
- **Restricted drugs:** no purchase push. Info-only with the mandated prompt.

### 10.4 Location-based delivery
1. User sets pincode (settings or in-chat), optionally via browser geolocation reverse-resolved to a pincode.
2. Validate with the India Post pincode API; cache.
3. `get_delivery_eta`: check pharmacy serviceability by pincode prefix, compute ETA from SLA (express vs standard, cutoff time), optionally Haversine distance to the nearest hub.
4. Price table shows ETA per pharmacy with a **Cheapest / Fastest** toggle.

---

## 11. Image and Prescription Upload

1. Composer has an attach button (camera/gallery/PDF). Client-side resize and EXIF strip.
2. `POST /api/upload` runs the vision model with a strict Zod output: `{ items: [{ rawText, drugName?, strength?, form?, confidence }], isPrescription: boolean }`.
3. Show the **PrescriptionReview card**: extracted drugs with edit/confirm. The user confirms before anything is processed.
4. Confirmed items pass through the full guard. Restricted items show the mandated prompt (info only). OTC and generic items get price/alternatives and basket savings.
5. **Privacy:** process in memory, discard the image, store only confirmed drug names (optional) with user consent.
6. Never treat the prescription as authorization to dispense; MediBot does not prescribe or dispense.

---

## 12. Chat Context and History

- Messages in a chat are **continuous**, not isolated. Persist every message under `chatId`.
- On each turn the router/composer receive: last N messages (e.g. 10) plus a **rolling summary** of older turns.
- **Session entity memory:**
```ts
EntityMemory = {
  currentMedicine?: { id, name }, lastAlternatives?: [{ id, name }],
  lastPriceTable?: {...}, pincode?: string, language: string,
  mentionedMedicines: [{ id, name, ordinal }]
}
```
Resolves "which of these is cheapest?", "the second one", "deliver to my pincode", "compare with Clavam".
- Every turn re-runs the guard on resolved entities.
- Chat history sidebar: list, rename, delete, search; reopening re-renders persisted cards.
- Summarize with a small model when the context exceeds a token budget.

---

## 13. API Contract

### 13.1 `POST /api/chat` (streaming)
Request:
```json
{ "chatId": "optional", "message": "text", "inputType": "text|voice|image",
  "attachments": [], "language": "auto", "disclaimerAcknowledged": true }
```
Stream event order (Vercel AI SDK data stream / SSE):
1. `guard`: GuardResult summary (UI can render the restricted alert immediately)
2. `meta`: intent, resolved entities, confidence
3. `text`: markdown tokens (streaming)
4. `card`: card objects (progressive, with skeleton placeholders)
5. `sources`: sources array
6. `suggestions`: follow-up chips
7. `done`: messageId, disclaimer footer

Reject with 403 if the disclaimer has not been acknowledged for the current version.

### 13.2 Response schema example (persisted)
```json
{
  "guard": { "verdict": "RESTRICTED", "triggeredBy": "saltTable" },
  "intent": "FIND_ALTERNATIVE",
  "restricted": true,
  "answer_markdown": "This medication requires a valid prescription. Please consult your doctor.",
  "cards": [ { "type": "restricted_alert", "data": { "medicine": "Augmentin 625 Duo", "schedule": "H" } } ],
  "sources": [],
  "disclaimer": "MediBot is an informational tool. It does not diagnose medical conditions or prescribe medications. Users must always consult a qualified medical professional before taking any medication."
}
```

### 13.3 Other routes
Standard CRUD for chats; `/api/stt` (multipart audio); `/api/upload`; `/api/disclaimer` (records ack with version); `/api/feedback`; `/api/metrics` (aggregates for dashboard); `/api/user/delete` (cascade delete).

---

## 14. Card System (typed JSON to UI)

The LLM never writes UI. It selects card types; **card data is filled from tool results by code**.

```ts
const CardUnion = z.discriminatedUnion("type", [
  z.object({ type: z.literal("restricted_alert"), id, data: RestrictedAlertData }),
  z.object({ type: z.literal("medicine"),         id, data: MedicineData }),
  z.object({ type: z.literal("price_table"),      id, data: PriceTableData }),
  z.object({ type: z.literal("alternatives"),     id, data: AlternativesData }),
  z.object({ type: z.literal("interaction"),      id, data: InteractionData }),
  z.object({ type: z.literal("delivery_eta"),     id, data: DeliveryEtaData }),
  z.object({ type: z.literal("prescription_review"), id, data: RxReviewData }),
  z.object({ type: z.literal("clarify_chips"),    id, data: ClarifyData }),
  z.object({ type: z.literal("sources"),          id, data: SourcesData }),
]);
```

`components/cards/registry.ts` maps `type` to a component; unknown types fall back to markdown.

| Card | Content |
|---|---|
| RestrictedAlert | Red, prominent; mandated prompt verbatim; no purchase CTA |
| MedicineCard | Name, manufacturer, composition (salt + strength), form, class, MRP, confidence badge |
| PriceTable | Pharmacy, price, stock, ETA, cheapest/fastest toggle, "demo data" and "updated at" |
| AlternativesCard | Per alternative: composition match badge, strength and form, MRP, savings %, advisory "Confirm with your doctor or pharmacist" |
| InteractionCard | Severity, pair, plain-language explanation, source link |
| DeliveryEtaCard | Pincode, per-pharmacy ETA |
| PrescriptionReviewCard | Extracted items with edit/confirm |
| ClarifyChips | "Did you mean..." chips that call `sendMessage` |
| SourcesCard | Visited URLs with favicon, domain, timestamp |

Rules: cards render progressively (skeletons) from partial objects; cards are interactive and send actions back as chat messages (keeps context continuous); every card persisted in `messages.cards`.

---

## 15. UI Screens

1. **Landing / Login:** Google sign-in; disclaimer text visible.
2. **Disclaimer Gate (modal):** acknowledgement checkbox with versioned text; blocks chat until accepted; ack stored and reported (A3).
3. **Chat (main):**
   - Sidebar: chat history, new chat, search.
   - Message list with streaming markdown, cards, sources footer, follow-up chips, feedback thumbs.
   - Composer: text, mic (voice), image attach, language selector, pincode chip.
   - Persistent slim disclaimer bar plus per-response footer.
4. **Prescription Upload Review:** edit and confirm extracted drugs.
5. **Location / Pincode Setup.**
6. **My Medicines / Refills:** saved meds, refill schedule, reminder channel, interaction check across saved meds.
7. **Safety Dashboard (judge-facing):**
   - Restricted block rate, false-positive rate (from the latest eval run), disclaimer ack count and rate, savings stats, price match accuracy, query resolution rate, CSAT average.
   - **Guard Explainability panel:** for a test query, shows matched entity, similarity score, matched salt, layer verdicts, triggering layer.
   - Eval run results table and a precision/recall chart.
8. **Settings:** language, pincode, delete my data, export data.
9. **CSAT micro-survey:** 1 to 5 stars after a session (feeds C3).

### 15.1 Streaming markdown and scroll
- Use `useChat` from the AI SDK; render with `react-markdown` + `remark-gfm`, memoized per block so earlier blocks don't re-render (no flicker).
- Handle incomplete markdown during streaming (unclosed code fences, tables) gracefully.
- **Auto-scroll hook:** stick to the bottom while streaming only if the user is within a threshold of the bottom; if they scroll up, stop and show a "New messages" pill that scrolls down on click. Use `ResizeObserver` plus `scrollIntoView({ block: "end" })`.
- Respect `prefers-reduced-motion`; mobile-first layout; accessible (ARIA live region for streamed text, keyboard operation, sufficient contrast).

---

## 16. Disclaimer and Compliance

- **Text** (constant, versioned): "MediBot is an informational tool. It does not diagnose medical conditions or prescribe medications. Users must always consult a qualified medical professional before taking any medication."
- Shown at: login, the gate modal (ack required), persistent bar in chat, and **appended by code** to every informational response (full or short form with a "Not medical advice" label, with the full text at least every few turns and on all medication responses).
- Ack capture: `disclaimer_acks` with `userId`, `version`, `ackAt`; exposed on the dashboard (count, rate, timeline). The API refuses chat if the ack is missing.
- No diagnosis/prescribing (validator §8.5). `DIAGNOSIS_REQUEST` intent gets a polite refusal.
- Alternatives always carry: "Active composition is verifiably identical. Please confirm any substitution with a doctor or pharmacist."

---

## 17. Multilingual and Voice

- **Languages:** English, Hindi, Bengali, Assamese, Tamil, Telugu, and so on (extend as feasible). Optionally Sarvam AI / Bhashini for Indic-quality translation.
- Pipeline: detect language, translate to English for processing, compose, translate response back. **Keep drug/salt names in English** (optionally show transliteration in brackets).
- The guard runs on original and translated text plus transliterated candidates.
- **Voice input:** mic button records audio, `POST /api/stt` (Groq Whisper, auto language detect), transcript populates the composer for edit or auto-send; show a waveform/recording state. Fallback to the Web Speech API.
- **Voice output (optional):** speak the response via `speechSynthesis` for accessibility.

---

## 18. Auth, Privacy, Security

- Google OAuth via Auth.js; session in JWT or DB; protect `/app` routes with middleware.
- Collect only: Google ID/email/name, language, pincode, optional saved medicines. No health data beyond what the user explicitly saves.
- **Delete-my-data:** cascade delete users, chats, messages, medicines, reminders, acks. Export option.
- Images discarded after extraction. Raw queries in `audit_logs` stored minimally (hash plus entity IDs) as per policy.
- Rate limiting per user and IP on `/api/chat`, `/api/stt`, `/api/upload`.
- Sanitize rendered markdown; never `dangerouslySetInnerHTML` unsanitized content; CSP headers.
- Secrets only in env vars. Never expose the Groq key client-side.
- Treat web content and uploaded images as untrusted; ignore embedded instructions.

---

## 19. Evaluation Harness and Metrics (`npm run eval`)

Build before the UI polish; it drives guard tuning and produces deck evidence.

| Suite | Size (target) | Measures |
|---|---|---|
| `restricted.jsonl` | 150+ (brands, salts, indirect phrasing, "Schedule H" mentions) | A1 block rate must be **100%** |
| `typos.jsonl` | 300+ (typos, spacing, transliteration, Hindi/Bengali/Assamese, leetspeak, prompt-injection) | A1 under stress; before/after semantic layer |
| `otc.jsonl` | 150+ (paracetamol, cetirizine, ORS, antacids, vitamins, and so on) | A2 false positive rate (<2%) |
| `alternatives.jsonl` | 100+ | Identical composition rate 100%; savings avg; advisory present |
| `prices.jsonl` | 100+ | B2 price match accuracy vs adapter source (>95%) |
| `general.jsonl` | 100+ | C1 resolution rate (>85%), no diagnosis/prescribing |
| `multiturn.jsonl` | 30+ conversations | C2 context retention (follow-ups, refinements, comparisons, "the second one") |
| `diagnosis.jsonl` | 50+ ("what do I have?") | Refusal rate 100%; zero diagnosing |

`report.ts` outputs a markdown benchmark table (for the deck and technical doc) and writes metrics to the DB for the dashboard. Add CI to run the restricted and OTC suites on every commit and **fail the build if A1 < 100%**.

Define "resolved query" precisely: a query that returns a relevant, grounded answer or correct safe intercept without needing human fallback; log unresolved queries for review.

---

## 20. Feature List That Wins

**Safety**
- Multi-layer fail-closed guard (semantic + salt table + LLM classifier + regex) with the verbatim mandated string
- Guard Explainability panel and audit log of every interception
- Bundled eval suite with typo/transliteration stress tests and reported precision/recall
- Disclaimer ack tracking and dashboard reporting

**Value**
- Savings badge per alternative and basket savings across a prescription
- Prescription photo to extracted meds to cheapest basket (info-only for restricted)
- Jan Aushadhi generic angle
- Cheapest vs fastest toggle with pincode-based ETA

**Engagement**
- Multi-turn memory ("the second one", "compare with Clavam")
- Voice and multilingual chat
- "Did you mean..." chips, follow-up suggestion chips
- Refill reminders (cron plus email) and saved-medicine interaction checks
- CSAT micro-survey and thumbs feedback
- PWA/offline shell

**Trust and polish**
- Citations on every informational answer and a visible list of every site visited
- Confidence badges and "data last updated" timestamps
- Delete-my-data, minimal data policy
- Streaming markdown with smart auto-scroll

---

## 21. Build Plan (ordered, with acceptance criteria)

| Phase | Work | Done when |
|---|---|---|
| 1 | Repo, env, Mongo connection, Auth.js Google login, disclaimer gate and ack API | Login works; chat blocked until ack stored |
| 2 | Dataset import, composition parsing and hashing, salt table, aliases, embeddings, indexes | Import scripts idempotent; indexes live; sample hash lookups work |
| 3 | **Guard + resolver + eval harness (restricted, OTC, typos)** | 100% restricted block; OTC FPR <2% on local suites |
| 4 | Router, tools, composer, output validator, `/api/chat` streaming | End-to-end text query returns validated streamed response |
| 5 | Chat UI: streaming markdown, auto-scroll, history, entity memory, card registry | Multi-turn follow-ups resolve correctly; history re-renders cards |
| 6 | Price/alternatives/delivery tools and cards, pincode setup | Alternatives show identical composition and savings; ETA by pincode |
| 7 | RAG pipeline plus allowlisted web search plus sources UI | Cited answers; low confidence falls back or declines |
| 8 | Voice (STT), image/prescription upload, multilingual | Hindi voice query and Rx photo flows work through the guard |
| 9 | My Medicines, reminders cron, interaction checks | Reminder email fires; saved-med interactions shown |
| 10 | Safety Dashboard, CSAT, delete-my-data, PWA, polish | Dashboard reads live eval metrics; deck-ready screenshots |
| 11 | Docs: README, TECHNICAL.md, DATASETS.md, LIMITATIONS.md; benchmark table | Reproducible setup in under 10 minutes |

---

## 22. Deliverables Checklist

- [ ] Working prototype (deployed URL) where judges can test OTC and Schedule H queries
- [ ] GitHub repo with clean README, `.env.example`, one-command setup, scripts to import data and build indexes
- [ ] Presentation deck: architecture, data sources, safety design, benchmark results (from `npm run eval`)
- [ ] Technical document: datasets and licences, preprocessing, approach, limitations (seeded prices, translation accuracy, dataset coverage, look-alike drug risk)

---

## 23. Known Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Live pharmacy prices not publicly available | Adapter interface plus seeded data, clearly labelled and documented |
| Over-blocking OTC drugs (A2) | Salt table primary; no broad regex; OTC allowlist; eval suite |
| Look-alike drug names (embedding confusion) | Top-2 margin rule intercepts when either is restricted; phonetic and fuzzy nets |
| Typos, transliterations, mixed language | Alias augmentation, multilingual embeddings, guard on original and translated text |
| Prompt injection (user or web content) | Guard outside LLM; untrusted-content handling; validator on final output |
| LLM hallucinated facts or numbers | RAG-only grounding, numbers from tools, citation requirement, low-confidence refusal |
| Parsing errors in composition strings | Import error log, manual review of unparsed rows, unknown strength stated explicitly |
| Dataset licence/terms | Verify and document per source before use |
| Groq near-determinism at temperature 0 | Safety decided by code; cache `(normalized query, resolved entity)` |

---

## 24. Key Constants (`lib/constants.ts`)

```ts
export const MANDATED_PRESCRIPTION_PROMPT =
  "This medication requires a valid prescription. Please consult your doctor.";

export const MANDATORY_DISCLAIMER =
  "MediBot is an informational tool. It does not diagnose medical conditions or prescribe medications. " +
  "Users must always consult a qualified medical professional before taking any medication.";

export const SUBSTITUTION_ADVISORY =
  "Active composition is verifiably identical. Please confirm any substitution with a doctor or pharmacist.";

export const DISCLAIMER_VERSION = "v1";
```

---

*End of DESIGN.md. If anything is ambiguous, choose the safer behaviour, and document the assumption in `docs/LIMITATIONS.md`.
