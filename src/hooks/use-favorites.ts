"use client"

import { useCallback, useSyncExternalStore } from "react"

// Favoritos são só do visitante (sem login/conta pública — ver decisão
// anterior sobre não travar formulários atrás de cadastro), guardados no
// localStorage. Um Set em módulo + pub/sub simples mantém todos os
// componentes montados em sincronia na mesma aba, sem precisar de um
// Context Provider.
const STORAGE_KEY = "bebiano:favoritos"

function readStorage(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

let favorites = readStorage()
const listeners = new Set<() => void>()
// O servidor nunca conhece o localStorage do visitante — getServerSnapshot
// precisa retornar sempre este Set vazio e estável (não `favorites`, que no
// cliente já vem populado antes da hidratação), senão o HTML da primeira
// renderização no cliente diverge do HTML do servidor e o React acusa
// hydration mismatch.
const EMPTY_SNAPSHOT = new Set<string>()

function notify() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
  } catch {
    // localStorage indisponível (modo privado etc.) — favoritos seguem
    // funcionando só em memória pelo resto da sessão.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return favorites
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT
}

export function useFavorites() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isFavorite = useCallback(
    (propertyId: string) => snapshot.has(propertyId),
    [snapshot]
  )

  const toggleFavorite = useCallback((propertyId: string) => {
    const next = new Set(favorites)
    if (next.has(propertyId)) next.delete(propertyId)
    else next.add(propertyId)
    favorites = next
    notify()
  }, [])

  return {
    favoriteIds: [...snapshot],
    isFavorite,
    toggleFavorite,
  }
}
