import { createStore } from 'jotai'
import { atom } from 'jotai'

// Create a store that's safe from SSR state leakage
export const store = createStore()

// Example atoms - replace with your own state
export const countAtom = atom(0)
