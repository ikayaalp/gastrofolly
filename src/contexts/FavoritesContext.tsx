"use client"

import { createContext, useContext, useReducer, useEffect } from 'react'

interface FavoriteItem {
  id: string
  title: string
  price: number
  discountedPrice?: number
  imageUrl?: string
  instructor: {
    name: string
  }
  category: {
    name: string
  }
  level: string
  _count: {
    lessons: number
    enrollments: number
  }
}

interface FavoritesState {
  items: FavoriteItem[]
  itemCount: number
}

type FavoritesAction = 
  | { type: 'ADD_FAVORITE'; payload: FavoriteItem }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'CLEAR_FAVORITES' }
  | { type: 'LOAD_FAVORITES'; payload: FavoriteItem[] }

const initialState: FavoritesState = {
  items: [],
  itemCount: 0
}

function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case 'ADD_FAVORITE': {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        return state // Item already in favorites
      }
      
      const newItems = [...state.items, action.payload]
      
      return {
        items: newItems,
        itemCount: newItems.length
      }
    }
    
    case 'REMOVE_FAVORITE': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      
      return {
        items: newItems,
        itemCount: newItems.length
      }
    }
    
    case 'CLEAR_FAVORITES':
      return initialState
      
    case 'LOAD_FAVORITES':
      return {
        items: action.payload,
        itemCount: action.payload.length
      }
      
    default:
      return state
  }
}

interface FavoritesContextType {
  state: FavoritesState
  addFavorite: (item: FavoriteItem) => void
  removeFavorite: (id: string) => void
  clearFavorites: () => void
  isFavorite: (id: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(favoritesReducer, initialState)

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('chef-favorites')
    if (savedFavorites) {
      try {
        const favoriteItems = JSON.parse(savedFavorites)
        dispatch({ type: 'LOAD_FAVORITES', payload: favoriteItems })
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error)
      }
    }
  }, [])

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chef-favorites', JSON.stringify(state.items))
  }, [state.items])

  const addFavorite = (item: FavoriteItem) => {
    dispatch({ type: 'ADD_FAVORITE', payload: item })
  }

  const removeFavorite = (id: string) => {
    dispatch({ type: 'REMOVE_FAVORITE', payload: id })
  }

  const clearFavorites = () => {
    dispatch({ type: 'CLEAR_FAVORITES' })
  }

  const isFavorite = (id: string) => {
    return state.items.some(item => item.id === id)
  }

  return (
    <FavoritesContext.Provider value={{ state, addFavorite, removeFavorite, clearFavorites, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
