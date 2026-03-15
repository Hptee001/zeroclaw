/**
 * Event listener utilities for Tauri events
 */
import { listen } from '@tauri-apps/api/event'
import type { Config, Session, Message, StreamChunk } from '../types'

export type EventCallback<T> = (event: T) => void

/**
 * Listen to a Tauri event
 */
export async function createEventSubscriber<T>(
  eventName: string,
  callback: EventCallback<T>
): Promise<() => void> {
  const unlisten = await listen<T>(eventName, (event) => {
    callback(event.payload)
  })
  return unlisten
}

/**
 * Event types from backend
 */
export interface Events {
  config_updated: Config
  session_created: Session
  message_new: Message
  stream_chunk: StreamChunk
  tool_called: { name: string; arguments: unknown }
  error: string
  status_change: 'initializing' | 'ready' | 'error'
}

/**
 * Subscribe to multiple events at once
 */
export async function subscribeToEvents(
  handlers: Partial<{
    [K in keyof Events]: EventCallback<Events[K]>
  }>
): Promise<Array<() => void>> {
  const unlistenFns: Array<() => void> = []

  for (const [eventName, handler] of Object.entries(handlers)) {
    if (handler) {
      const unlisten = await listen(eventName, (event) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler(event.payload as any)
      })
      unlistenFns.push(unlisten)
    }
  }

  return unlistenFns
}

/**
 * Unsubscribe from all events
 */
export function unsubscribeFromAll(unlistenFns: Array<() => void>) {
  unlistenFns.forEach((fn) => fn())
}
