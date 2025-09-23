"use client"

import { createContext, useContext, useReducer, useEffect } from 'react'

interface CartItem {
  id: string
  title: string
  price: number
  discountedPrice?: number
  imageUrl?: string
  instructor: {
    name: string
  }
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        return state // Item already in cart
      }
      
      const newItems = [...state.items, action.payload]
      const total = newItems.reduce((sum, item) => sum + (item.discountedPrice || item.price), 0)
      
      return {
        items: newItems,
        total,
        itemCount: newItems.length
      }
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      const total = newItems.reduce((sum, item) => sum + (item.discountedPrice || item.price), 0)
      
      return {
        items: newItems,
        total,
        itemCount: newItems.length
      }
    }
    
    case 'CLEAR_CART':
      return initialState
      
    case 'LOAD_CART':
      const total = action.payload.reduce((sum, item) => sum + (item.discountedPrice || item.price), 0)
      return {
        items: action.payload,
        total,
        itemCount: action.payload.length
      }
      
    default:
      return state
  }
}

interface CartContextType {
  state: CartState
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('chef-cart')
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chef-cart', JSON.stringify(state.items))
  }, [state.items])

  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
