'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot } from 'lucide-react'

/**
 * "Call with AI agent" — only rendered when the VioX Voice integration is
 * configured (decided server-side by the contact page).
 */
export default function VoiceCallButton({
  contactId,
  hasPhone,
}: {
  contactId: string
  hasPhone: boolean
}) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'calling' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function startCall() {
    setState('calling')
    setMessage('')
    try {
      const res = await fetch('/api/v1/voice/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState('error')
        setMessage(data?.error || `Call failed (${res.status})`)
        return
      }
      setState('ok')
      setMessage('AI call started')
      router.refresh()
    } catch {
      setState('error')
      setMessage('Could not reach the server')
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="btn btn-sm btn-secondary"
        style={{ gap: '0.375rem' }}
        onClick={startCall}
        disabled={!hasPhone || state === 'calling'}
        title={hasPhone ? 'Have the AI voice agent call this contact' : 'Add a phone number to call with the AI agent'}
      >
        <Bot className="w-3.5 h-3.5" style={{ color: '#fd79a8' }} />
        {state === 'calling' ? 'Calling…' : 'Call with AI agent'}
      </button>
      {message && (
        <span
          className="text-xs"
          role="status"
          style={{ color: state === 'error' ? 'var(--danger, #e17055)' : 'var(--success)' }}
        >
          {message}
        </span>
      )}
    </span>
  )
}
