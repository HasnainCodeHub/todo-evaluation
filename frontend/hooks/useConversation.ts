// Conversation hook for AI chat panel
// Manages conversation state, localStorage persistence, and history restoration
//
// Architecture:
//   - Reads conversation ID from localStorage on mount
//   - Calls GET /api/conversations/{id} to restore history
//   - Provides state and helpers to ChatPanel component

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChatMessage, ConversationDetail, ServerMessage } from '../types/chat'

const STORAGE_KEY = 'chatConversationId'

// Map a server message to our local ChatMessage format
function mapServerMessage(msg: ServerMessage): ChatMessage {
  return {
    id: String(msg.id),
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.created_at),
  }
}

export function useConversation() {
  const [conversationId, setConversationIdState] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isRestoring, setIsRestoring] = useState(false)
  const didRestore = useRef(false)

  // Persist conversation ID to localStorage
  const setConversationId = useCallback((id: string | null) => {
    setConversationIdState(id)
    if (id) {
      try { localStorage.setItem(STORAGE_KEY, id) } catch { /* ignore */ }
    } else {
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    }
  }, [])

  // Restore conversation history on mount (FR-007)
  useEffect(() => {
    if (didRestore.current) return
    didRestore.current = true

    let storedId: string | null = null
    try { storedId = localStorage.getItem(STORAGE_KEY) } catch { /* ignore */ }

    if (!storedId) return

    setConversationIdState(storedId)
    setIsRestoring(true)

    // Fetch conversation history from backend via JWT bridge
    const restore = async () => {
      try {
        // Get JWT from bridge (client-side)
        const jwtRes = await fetch('/api/auth/jwt', { credentials: 'include' })
        if (!jwtRes.ok) {
          // Any error (including 401) — clear conversation and start fresh silently.
          // Do NOT redirect here: the dashboard auth guard handles true session expiry.
          // Redirecting here causes an infinite loop (middleware bounces back to /dashboard).
          try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
          setConversationIdState(null)
          return
        }

        const { token } = await jwtRes.json()
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const convRes = await fetch(`${apiUrl}/api/conversations/${storedId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (convRes.status === 404) {
          // Conversation deleted — start fresh silently (FR edge case)
          try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
          setConversationIdState(null)
          return
        }

        if (convRes.status === 401) {
          // Clear conversation and start fresh — do NOT redirect.
          // The dashboard auth guard handles true session expiry.
          try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
          setConversationIdState(null)
          return
        }

        if (!convRes.ok) {
          // Any other error — start fresh silently
          try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
          setConversationIdState(null)
          return
        }

        const data: ConversationDetail = await convRes.json()
        setMessages(data.messages.map(mapServerMessage))
      } catch {
        // Network error — start fresh silently
        try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
        setConversationIdState(null)
      } finally {
        setIsRestoring(false)
      }
    }

    restore()
  }, [])

  // Add a new message to the conversation
  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg])
  }, [])

  // Replace a placeholder message (isLoading) with the real response
  const replaceLoadingMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates, isLoading: false } : m))
  }, [])

  // Remove all messages (clear conversation)
  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
  }, [setConversationId])

  return {
    conversationId,
    setConversationId,
    messages,
    addMessage,
    replaceLoadingMessage,
    clearMessages,
    isRestoring,
  }
}
