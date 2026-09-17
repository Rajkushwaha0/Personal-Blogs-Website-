import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Debounce a value by delayMs milliseconds.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return debouncedValue
}

/**
 * Throttle a callback function using requestAnimationFrame for smooth 60/120fps UI events.
 */
export function useRafThrottle<T extends (...args: never[]) => void>(fn: T): (...args: Parameters<T>) => void {
  const rafId = useRef<number | null>(null)
  const latestArgs = useRef<Parameters<T> | null>(null)

  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      latestArgs.current = args
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          if (latestArgs.current) {
            fn(...latestArgs.current)
          }
          rafId.current = null
        })
      }
    },
    [fn]
  )

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return throttledFn
}
