'use client'

import React, { useState } from 'react'
import { MessageItem, ChatMessage } from '@/components/chat/MessageItem'
import { Composer } from '@/components/chat/Composer'

export const dynamic = 'force-dynamic'

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'demo-1',
    role: 'user',
    content: 'Can I get a cheaper alternative to Augmentin 625 Duo?',
  },
  {
    id: 'demo-2',
    role: 'assistant',
    content: `I identified **Augmentin 625 Duo** containing **Amoxicillin 500mg + Potassium Clavulanate 125mg**.

This is a **Schedule H Prescription Medication** regulated under the Drugs & Cosmetics Act 1945. Self-medication is prohibited, and a valid licensed doctor's prescription is required before dispensing.

Below are verified 100% identical generic formulations offering up to **63.3% in cost savings**:`,
    cards: [
      {
        type: 'restricted_alert',
        data: {
          schedule: 'Schedule H',
          message: 'This medication requires a valid prescription. Please consult your doctor.',
          ruleEnforced: 'CDSCO Compliance §3.1',
        },
      },
      {
        type: 'alternatives',
        data: {
          sourceMedicine: {
            name: 'Augmentin 625 Duo',
            mrp: 204.40,
            schedule: 'Schedule H',
          },
          alternatives: [
            {
              id: 'alt-1',
              name: 'Moxikind-CV 625',
              manufacturer: 'Mankind Pharma Ltd',
              mrp: 138.35,
              packSize: 'Strip of 10 Tablets',
              form: 'Tablet',
              compositionHash: 'amox500_clav125',
              savingsPct: 32.3,
              isGenericJanAushadhi: false,
            },
            {
              id: 'alt-2',
              name: 'Jan Aushadhi Amoxy-Clav 625',
              manufacturer: 'Govt PMBJP Kendra',
              mrp: 75.00,
              packSize: 'Strip of 10 Tablets',
              form: 'Tablet',
              compositionHash: 'amox500_clav125',
              savingsPct: 63.3,
              isGenericJanAushadhi: true,
            },
          ],
        },
      },
      {
        type: 'price_table',
        data: {
          medicineName: 'Moxikind-CV 625',
          mrp: 151.20,
          pincode: '110001',
          prices: [
            {
              pharmacyName: 'Jan Aushadhi PMBJP',
              baseUrl: 'https://janaushadhi.gov.in',
              certified: true,
              price: 75.00,
              mrp: 151.20,
              savingsPct: 50.4,
              inStock: true,
              etaHours: 1,
              etaText: 'Walk-in Kendra',
              source: 'PMBJP Central Registry',
            },
            {
              pharmacyName: 'Tata 1mg',
              baseUrl: 'https://1mg.com',
              certified: true,
              price: 136.08,
              mrp: 151.20,
              savingsPct: 10.0,
              inStock: true,
              etaHours: 24,
              etaText: 'Tomorrow by 2 PM',
              source: 'Tata 1mg Live Feed',
            },
            {
              pharmacyName: 'PharmEasy',
              baseUrl: 'https://pharmeasy.in',
              certified: true,
              price: 139.50,
              mrp: 151.20,
              savingsPct: 7.7,
              inStock: true,
              etaHours: 36,
              etaText: '24-48 hrs',
              source: 'PharmEasy Catalog',
            },
            {
              pharmacyName: 'Apollo 24|7',
              baseUrl: 'https://apollopharmacy.in',
              certified: true,
              price: 142.00,
              mrp: 151.20,
              savingsPct: 6.1,
              inStock: true,
              etaHours: 2,
              etaText: '2 Hours (Express)',
              source: 'Apollo Express API',
            },
          ],
        },
      },
    ],
  },
]

export default function DeckChatPreview() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: data.reply || 'Checked against pharmacy databases.',
            cards: data.cards || [],
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: 'This medication requires a valid prescription. Please consult your doctor.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-[#fbf8ef] px-6 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-ink bg-sun flex items-center justify-center font-black text-xs text-ink shadow-[2px_2px_0_0_#17140f]">
            +
          </div>
          <div>
            <p className="font-heading font-black text-base leading-tight text-ink">
              MediBot Live Conversational Interface
            </p>
            <p className="font-mono text-[11px] font-bold text-ink/60">
              5-Tier Prescription Guard Active · 100% Intercept
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-ink bg-olive/30 px-3 py-1 font-mono text-xs font-bold text-ink">
            PIN: 110001 (New Delhi)
          </span>
          <span className="rounded-full border border-ink bg-sun px-3 py-1 font-mono text-xs font-bold text-ink">
            Live Stream
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 font-mono text-xs text-ink/60 animate-pulse">
              <span>Checking pharmacy database & 5-tier guard...</span>
            </div>
          )}
        </div>
      </div>

      {/* Docked Composer */}
      <div className="border-t-2 border-ink bg-[#fbf8ef]/95 backdrop-blur-md p-2 shrink-0">
        <Composer
          onSend={handleSend}
          isLoading={isLoading}
          pincode="110001"
        />
      </div>
    </div>
  )
}
