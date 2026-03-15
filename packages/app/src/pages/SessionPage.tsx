import { useParams } from 'react-router'

export function SessionPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Session</h1>
      <p className="text-muted-foreground">Session ID: {id}</p>
      <p className="text-muted-foreground mt-2">Chat interface coming soon...</p>
    </div>
  )
}
