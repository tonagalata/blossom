'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onIdTokenChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, sendPasswordResetEmail, signOut as firebaseSignOut, type User,
} from 'firebase/auth'
import { auth } from './firebaseClient'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function exchangeSession(idToken: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'You do not have access to the admin dashboard.')
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onIdTokenChanged(auth, async u => {
    setUser(u)
    setLoading(false)
    // Keeps the server-side cookie in sync whenever Firebase silently
    // refreshes the token (roughly hourly) — not just on explicit login.
    if (u) {
      const idToken = await u.getIdToken()
      await exchangeSession(idToken).catch(() => {})
    }
  }), [])

  async function login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    await exchangeSession(await credential.user.getIdToken())
  }

  async function loginWithGoogle() {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider())
    await exchangeSession(await credential.user.getIdToken())
  }

  async function signup(email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await exchangeSession(await credential.user.getIdToken())
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, signup, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
