import { createContext, useContext, useEffect, useState } from 'react'
import type { UserProfile } from '@/types'
import * as authApi from '@/lib/auth'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  registerEmail: (email: string, password: string, name: string) => Promise<void>
  loginEmail: (email: string, password: string) => Promise<void>
  loginGuest: (name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const registerEmail = async (email: string, password: string, name: string) => {
    const res = await authApi.registerEmail(email, password, name)
    setUser(res.user)
  }

  const loginEmail = async (email: string, password: string) => {
    const res = await authApi.signInEmail(email, password)
    setUser(res.user)
  }

  const loginGuest = async (name: string) => {
    const res = await authApi.signInGuest(name)
    setUser(res.user)
  }

  const logout = async () => {
    await authApi.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, registerEmail, loginEmail, loginGuest, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
