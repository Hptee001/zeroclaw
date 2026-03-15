import { useEffect, useState, useRef } from 'react'
import { Send, StopCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat'

export function Chat() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use chat store for real AI integration
  const {
    messages,
    sending,
    error,
    streamingMessage,
    currentSessionId,
    sendMessage,
    createSession,
    clearError,
    setupEventListeners,
  } = useChatStore()

  // Initialize session and event listeners on mount
  useEffect(() => {
    let mounted = true
    let unlistenFns: Array<() => void> = []

    const init = async () => {
      if (!mounted) return

      try {
        // Setup event listeners first
        const unlisten = await setupEventListeners()
        if (mounted) {
          unlistenFns = unlisten
        }
      } catch (err) {
        console.error('Failed to setup event listeners:', err)
      }

      // Create session if needed
      if (!currentSessionId && mounted) {
        try {
          await createSession('New Chat')
        } catch (err) {
          console.error('Failed to create session:', err)
        }
      }
    }

    init()

    return () => {
      mounted = false
      // Cleanup event listeners
      unlistenFns.forEach(fn => fn())
    }
    // Only run on mount when there's no session - don't recreate on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]) // Only depend on currentSessionId, not on functions

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const content = input
    setInput('')
    clearError()

    try {
      await sendMessage(content)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {sending ? 'Thinking...' : 'Ready'}
            </p>
          </div>
        </div>
        {sending && (
          <Button variant="outline" size="sm" onClick={() => {/* TODO: Implement cancel */}}>
            <StopCircle className="h-4 w-4 mr-2" />
            Stop
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">Error: {error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={clearError}
              >
                Dismiss
              </Button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground">
                Ask ZeroClaw anything. I can help you with tasks, answer questions, and more.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="text-sm font-medium mb-1">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-60 mt-2">
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {/* Show streaming message if available */}
          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted">
                <div className="text-sm font-medium mb-1">Assistant</div>
                <div className="whitespace-pre-wrap">{streamingMessage.content}</div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              disabled={sending}
              className="flex-1 resize-none rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 max-h-32"
              style={{ minHeight: '48px' }}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              size="lg"
              className="px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
