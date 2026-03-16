import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type LSToolCredentialsContextValue = {
  login: string
  password: string
  setLogin: (value: string) => void
  setPassword: (value: string) => void
  persistCredentials: (loginVal: string, passwordVal: string) => Promise<void>
}

const LSToolCredentialsContext = createContext<LSToolCredentialsContextValue | null>(null)

export function LSToolCredentialsProvider({ children }: { children: React.ReactNode }) {
  const [login, setLogin] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const config = await window.api.getConfig()
      if (cancelled) return
      setLogin(config.ddoClientId ?? '')
      setPassword(config.ddoClientSecret ?? '')
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const persistCredentials = useCallback(async (loginVal: string, passwordVal: string) => {
    await window.api.setConfigValue('ddoClientId', loginVal)
    await window.api.setConfigValue('ddoClientSecret', passwordVal)
  }, [])

  const value: LSToolCredentialsContextValue = {
    login,
    password,
    setLogin,
    setPassword,
    persistCredentials,
  }

  return (
    <LSToolCredentialsContext.Provider value={value}>
      {children}
    </LSToolCredentialsContext.Provider>
  )
}

export function useLSToolCredentials(): LSToolCredentialsContextValue {
  const ctx = useContext(LSToolCredentialsContext)
  if (!ctx) {
    throw new Error('useLSToolCredentials must be used within LSToolCredentialsProvider')
  }
  return ctx
}
