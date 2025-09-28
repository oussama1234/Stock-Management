import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'

// SearchInput: centered input with global keyboard shortcuts and focus control
// Props:
// - value, onChange, onSubmit
// - onFocusRequest (called when '/' pressed)
// - onEscape (Esc key)
// - onKeyNav (ArrowUp/Down/Enter keys)
// - placeholder
const SearchInput = memo(forwardRef(function SearchInput({
  value,
  onChange,
  onSubmit,
  onEscape,
  onKeyNav,
  placeholder = 'Search products, sales, purchases, customers...'
}, ref) {
  const inputRef = useRef(null)

  // Expose focus() to parent
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }), [])

  // Global '/' shortcut to focus the input (ignores when typing in inputs/textareas)
  useEffect(() => {
    const onGlobalKey = (e) => {
      const target = e.target
      const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (isEditable) return
      if (e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onGlobalKey)
    return () => window.removeEventListener('keydown', onGlobalKey)
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onEscape?.()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
      onKeyNav?.(e)
    }
  }, [onEscape, onKeyNav])

  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="hidden md:block w-full pl-12 pr-12 py-3 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-blue-500/20 focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 shadow-sm"
        />
      </div>
    </form>
  )
}))

export default SearchInput
