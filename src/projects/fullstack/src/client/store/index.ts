import {atom, createStore} from 'jotai'

// Create a store that's safe from SSR state leakage
export const store = createStore()
