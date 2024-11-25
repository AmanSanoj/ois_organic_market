import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { isAdmin } from '../services/supabase'

const CartContext = createContext()

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const { user } = useAuth()

  // Clear cart if user is admin
  useEffect(() => {
    if (isAdmin(user)) {
      setCart([])
    }
  }, [user])

  const addToCart = (product, quantity = 1) => {
    if (isAdmin(user)) {
      console.warn('Admins cannot add items to cart')
      return
    }

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id)
      
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      
      return [...currentCart, { ...product, quantity }]
    })
  }

  const removeFromCart = (productId) => {
    if (isAdmin(user)) {
      console.warn('Admins cannot modify cart')
      return
    }

    setCart(currentCart => currentCart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (isAdmin(user)) {
      console.warn('Admins cannot modify cart')
      return
    }

    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(currentCart =>
      currentCart.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const total = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
