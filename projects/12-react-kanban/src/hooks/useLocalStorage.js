import { useEffect, useState } from 'react'

/**
 * A drop-in replacement for useState that saves the value to localStorage.
 *
 * On first render, tries to read the stored value from localStorage.
 * If nothing is stored (or parsing fails), falls back to initialValue.
 * On every change, writes the new value back to localStorage.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }, [key, value])

  return [value, setValue]
}
