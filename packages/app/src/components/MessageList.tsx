import type { Message } from '../types'

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No messages yet</p>
          <p className="text-sm">Start a conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageKey key={message.id} message={message} />
      ))}
    </div>
  )
}

function MessageKey({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card'
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className="text-xs opacity-60 mt-2">
          {new Date(message.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  )
}
