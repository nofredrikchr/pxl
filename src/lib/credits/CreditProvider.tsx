'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface CreditContextValue {
  balance: number | null
  refreshBalance: () => Promise<void>
}

const CreditContext = createContext<CreditContextValue>({
  balance: null,
  refreshBalance: async () => {},
})

export function useCredits() {
  return useContext(CreditContext)
}

export function CreditProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null)

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/credits')
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
      }
    } catch {
      // silently fail — balance will show as loading
    }
  }, [])

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  return (
    <CreditContext.Provider value={{ balance, refreshBalance }}>
      {children}
    </CreditContext.Provider>
  )
}
