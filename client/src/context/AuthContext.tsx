import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { AuthContext } from '@/context/auth-context'
import type { User } from '@/lib/types'

const TOKEN_KEY = 'taskflow_token'
const USER_KEY = 'taskflow_user'

function storedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(storedUser)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  const saveSession = useCallback((nextToken: string, nextUser: User) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password)
    saveSession(result.token, result.user)
  }, [saveSession])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authApi.register(name, email, password)
    saveSession(result.token, result.user)
  }, [saveSession])

  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener('taskflow:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('taskflow:unauthorized', handleUnauthorized)
  }, [logout])

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  }), [user, token, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

