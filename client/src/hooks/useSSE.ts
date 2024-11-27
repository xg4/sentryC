import { EventStreamContentType, fetchEventSource, type FetchEventSourceInit } from '@microsoft/fetch-event-source'
import { useEffect, useRef, useState } from 'react'

type UseSSEOptions = {
  onError?: (error: Error) => void
  enabled?: boolean
} & Pick<FetchEventSourceInit, 'headers' | 'openWhenHidden'>

class RetriableError extends Error {}
class FatalError extends Error {}

export function useSSE<T>(url: RequestInfo, options: UseSSEOptions = {}) {
  const { onError, openWhenHidden, headers, enabled = true } = options

  const [messages, setMessages] = useState<T[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cb = useRef(onError)

  useEffect(() => {
    cb.current = onError
  }, [onError])

  const eventSourceRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    eventSourceRef.current = controller

    const fetchOptions: FetchEventSourceInit = {
      signal: controller.signal,
      onopen: async response => {
        if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
          setIsConnected(true)
          return
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new FatalError()
        } else {
          throw new RetriableError()
        }
      },
      onclose: () => {
        setIsConnected(false)
      },
      onerror: err => {
        setIsConnected(false)
        setError(err)
        cb.current?.(err)
      },
      onmessage: event => {
        const data: T = JSON.parse(event.data)
        setMessages(prev => [...prev, data])
      },
      openWhenHidden,
      headers,
    }

    fetchEventSource(url, fetchOptions).catch(err => {
      setError(err)
      cb.current?.(err)
    })

    return () => {
      controller.abort()
    }
  }, [url, openWhenHidden, headers, enabled])

  return { messages, error, isConnected }
}
