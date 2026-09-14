export type Plan = 'basic' | 'premium' | 'premium_plus'

export interface Profile {
  id: string
  isPremium: boolean
  plan: Plan
}

export interface Session {
  id: number
  slug: string | null
  createdAt: string
  created_at?: string
  name: string
  isActive: boolean
  is_active?: boolean
  accessCode: string | null
  access_code?: string | null
  expiresAt: string | null
  expires_at?: string | null
  userId: string
  user_id?: string
  logoUrl?: string | null
  logo_url?: string | null
  questionCount?: number
}

export interface Question {
  id: number
  createdAt: string
  created_at?: string
  content: string
  authorName: string | null
  author_name?: string | null
  isAnswered: boolean
  is_answered?: boolean
  upvotes: number
  sessionId: number
  session_id?: number
}

export interface DashboardStats {
  totalSessions: number
  totalQuestions: number
  activeSessions: number
}
