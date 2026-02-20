'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useConversation } from '@/hooks/useConversation'
import type { ChatApiRequest, ChatApiResponse } from '@/types/chat'

declare global {
  class SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    onstart: (() => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    start(): void
    stop(): void
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean
    readonly length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string
    readonly message: string
  }

  interface Window {
    SpeechRecognition?: typeof SpeechRecognition
    webkitSpeechRecognition?: typeof SpeechRecognition
  }
}

interface ChatPanelProps {
  onTasksChanged?: () => void
}

export default function ChatPanel({ onTasksChanged }: ChatPanelProps) {
  const {
    conversationId,
    setConversationId,
    messages,
    addMessage,
    replaceLoadingMessage,
    isRestoring,
  } = useConversation()

  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const voiceTranscriptRef = useRef<string>('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendMessageRef = useRef<(forceContent?: string) => Promise<void>>(async () => {})

  const speechSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => { recognitionRef.current?.stop() }
  }, [])

  const toggleVoice = useCallback(() => {
    if (!speechSupported) return

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition!

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // Capture any text already typed so we can prepend it
    const inputAtStart = input.trim()
    voiceTranscriptRef.current = ''

    recognition.onstart = () => {
      setIsListening(true)
      setVoiceError(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      // Keep track of the latest transcript for auto-send
      voiceTranscriptRef.current = transcript
      // Show interim text in the textarea for visual feedback
      setInput(inputAtStart ? `${inputAtStart} ${transcript}` : transcript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Please allow access in browser settings.')
      } else if (event.error !== 'aborted') {
        setVoiceError('Voice recognition error. Please try again.')
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
      const transcript = voiceTranscriptRef.current.trim()
      voiceTranscriptRef.current = ''
      if (transcript) {
        const fullMessage = inputAtStart ? `${inputAtStart} ${transcript}` : transcript
        // Auto-send via ref to avoid stale closure over sendMessage
        sendMessageRef.current(fullMessage)
      } else {
        inputRef.current?.focus()
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isListening, speechSupported, input])

  const sendMessage = useCallback(async (forceContent?: string) => {
    if (isListening && !forceContent) {
      recognitionRef.current?.stop()
    }
    const trimmed = (forceContent ?? input).trim()
    if (!trimmed || isSending) return

    setInput('')
    setIsSending(true)

    const userMsgId = `user-${Date.now()}`
    addMessage({ id: userMsgId, role: 'user', content: trimmed, timestamp: new Date() })

    const loadingMsgId = `loading-${Date.now()}`
    addMessage({ id: loadingMsgId, role: 'assistant', content: '', timestamp: new Date(), isLoading: true })

    try {
      const payload: ChatApiRequest = {
        message: trimmed,
        conversation_id: conversationId ?? undefined,
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        replaceLoadingMessage(loadingMsgId, {
          content: 'Your session has expired — please log in again',
          isError: true,
        })
        setTimeout(() => { window.location.href = '/signin' }, 2000)
        return
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        replaceLoadingMessage(loadingMsgId, {
          content: errData.error || 'Something went wrong. Please try again.',
          isError: true,
        })
        return
      }

      const data: ChatApiResponse = await response.json()
      replaceLoadingMessage(loadingMsgId, {
        content: data.message,
        timestamp: new Date(data.created_at),
      })

      if (data.conversation_id && data.conversation_id !== conversationId) {
        setConversationId(data.conversation_id)
      }

      onTasksChanged?.()
    } catch {
      replaceLoadingMessage(loadingMsgId, {
        content: 'Cannot reach the server. Please check your connection and try again.',
        isError: true,
      })
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }, [input, isSending, isListening, conversationId, addMessage, replaceLoadingMessage, setConversationId, onTasksChanged])

  // Keep ref current so recognition.onend can call the latest sendMessage without stale closure
  useEffect(() => { sendMessageRef.current = sendMessage }, [sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  const canSend = input.trim().length > 0 && !isSending

  return (
    <div className="flex flex-col h-full bg-surface-900 rounded-2xl border border-white/[0.06] overflow-hidden relative">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
        <h2 className="text-base font-semibold text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          AI Assistant
        </h2>
        <p className="text-xs text-white/30 mt-1 ml-11">Manage tasks with natural language</p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
        {isRestoring ? (
          <div className="flex justify-center items-center h-20">
            <div className="flex items-center gap-2 text-white/30 text-sm">
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              Restoring conversation...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-3 border-t border-white/[0.06] flex-shrink-0">
        <div className={`flex items-end gap-2 rounded-xl border transition-all duration-200 ${
          isSending
            ? 'border-white/[0.06] bg-white/[0.03]'
            : 'border-white/[0.08] bg-white/[0.04] focus-within:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/10'
        }`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to manage your tasks..."
            disabled={isSending}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-white placeholder-white/25 outline-none min-h-[44px] max-h-[120px] disabled:opacity-50"
            style={{ overflowY: 'auto' }}
          />
          {speechSupported && (
            <button
              onClick={toggleVoice}
              className={`flex-shrink-0 mb-2 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.06]'
              }`}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M10 3a2 2 0 114 0v5a2 2 0 11-4 0V3z" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => sendMessage()}
            disabled={!canSend}
            className={`flex-shrink-0 mr-2 mb-2 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
              canSend
                ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        {voiceError && (
          <p className="text-xs text-red-400/80 mt-1 text-center">{voiceError}</p>
        )}
        <p className="text-xs text-white/20 mt-2 text-center">
          {isListening
            ? 'Listening... click mic to stop'
            : 'Press Enter to send · Shift+Enter for new line'
          }
        </p>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-white/70 mb-1">Chat with your AI assistant</h3>
      <p className="text-xs text-white/30 leading-relaxed max-w-[200px]">
        Try: &ldquo;Add a task to review the PR&rdquo; or &ldquo;Show me my tasks&rdquo;
      </p>
    </div>
  )
}

interface MessageBubbleProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    isLoading?: boolean
    isError?: boolean
  }
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-br-sm'
          : message.isError
            ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-bl-sm'
            : 'bg-white/[0.06] border border-white/[0.08] text-white/80 rounded-bl-sm'
        }
      `}>
        {message.isLoading ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        )}
      </div>
    </div>
  )
}
