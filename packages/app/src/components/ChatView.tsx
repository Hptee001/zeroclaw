import { useState } from 'react'
import { useParams } from 'react-router'
import { useMessages, useStream } from '../hooks'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

export function ChatView() {
  const { id: sessionId } = useParams<{ id: string }>()
  const { messages, sendMessage, isSending } = useMessages(sessionId || null)
  const { isStreaming } = useStream()
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return
    
    await sendMessage({ session_id: sessionId, content: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages || []} />
      </div>
      
      <div className="border-t p-4">
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          disabled={isSending || isStreaming}
          placeholder="Type a message..."
        />
        
        {(isSending || isStreaming) && (
          <div className="mt-2 text-sm text-muted-foreground">
            AI is thinking...
          </div>
        )}
      </div>
    </div>
  )
}
