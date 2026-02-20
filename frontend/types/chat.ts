// Chat types for the AI chatbot UI (010-chatbot-ui)

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
  isError?: boolean
}

export interface ConversationState {
  conversationId: string | null
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

export interface ChatApiRequest {
  message: string
  conversation_id?: string
}

export interface ChatApiResponse {
  conversation_id: string
  message: string
  actions_taken?: string[]
  created_at: string
}

export interface ServerMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ConversationDetail {
  id: string
  created_at: string
  updated_at: string
  messages: ServerMessage[]
}
