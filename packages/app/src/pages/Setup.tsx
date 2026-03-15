import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Check, ChevronRight, Loader2, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const steps = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with ZeroClaw' },
  { id: 'provider', title: 'Provider', description: 'Choose your AI provider' },
  { id: 'api-key', title: 'API Key', description: 'Enter your API key' },
  { id: 'complete', title: 'Complete', description: 'You\'re all set!' },
]

const providers = [
  { id: 'openrouter', name: 'OpenRouter', description: 'Multi-model gateway', icon: '🌐' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude models', icon: '🤖' },
  { id: 'openai', name: 'OpenAI', description: 'GPT models', icon: '💬' },
  { id: 'gemini', name: 'Gemini', description: 'Google AI', icon: '✨' },
  { id: 'ollama', name: 'Ollama', description: 'Local models', icon: '🦙' },
]

export function Setup() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedProvider, setSelectedProvider] = useState('openrouter')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    // Simulate setup
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
    toast.success('Setup complete!')
    navigate('/')
  }

  const canProceed = () => {
    if (currentStep === 1) return selectedProvider !== ''
    if (currentStep === 2 && selectedProvider !== 'ollama') return apiKey.length > 0
    return true
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/50 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🦀</span>
            <span className="text-xl font-bold">ZeroClaw</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your AI assistant
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                index === currentStep && 'bg-background shadow-sm',
                index < currentStep && 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium',
                  index < currentStep && 'bg-primary text-primary-foreground',
                  index === currentStep && 'bg-primary text-primary-foreground',
                  index > currentStep && 'bg-muted text-muted-foreground'
                )}
              >
                {index < currentStep ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              <div>
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-xl w-full">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">Welcome to ZeroClaw</CardTitle>
                  <CardDescription>
                    Let's set up your AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      ZeroClaw is your personal AI assistant that can help you with various tasks.
                      To get started, we'll need to configure your AI provider.
                    </p>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        You'll need an API key from your chosen provider. Don't worry, you can change this later.
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleNext}>
                      Get Started
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">Choose Provider</CardTitle>
                  <CardDescription>
                    Select your preferred AI provider
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3">
                    {providers.map((provider) => (
                      <div
                        key={provider.id}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
                          selectedProvider === provider.id && 'border-primary bg-primary/5'
                        )}
                        onClick={() => setSelectedProvider(provider.id)}
                      >
                        <div className="text-3xl">{provider.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-muted-foreground">{provider.description}</div>
                        </div>
                        {selectedProvider === provider.id && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                    <Button onClick={handleNext} disabled={!canProceed()}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && selectedProvider !== 'ollama' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">Enter API Key</CardTitle>
                  <CardDescription>
                    Your API key for {providers.find((p) => p.id === selectedProvider)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="relative mt-1">
                      <Input
                        id="api-key"
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Your API key is stored locally and never sent to our servers.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                    <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Where to get your API key?</div>
                      <div className="text-muted-foreground">
                        {selectedProvider === 'openrouter' && 'Get your API key from https://openrouter.ai/keys'}
                        {selectedProvider === 'anthropic' && 'Get your API key from https://console.anthropic.com/'}
                        {selectedProvider === 'openai' && 'Get your API key from https://platform.openai.com/api-keys'}
                        {selectedProvider === 'gemini' && 'Get your API key from https://makersuite.google.com/app/apikey'}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                    <Button onClick={handleNext} disabled={!canProceed()}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && selectedProvider === 'ollama' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">Local Setup</CardTitle>
                  <CardDescription>
                    Ollama runs locally on your machine
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Ollama doesn't require an API key. Make sure you have Ollama installed and running on your machine.
                    </p>
                    <div className="p-4 rounded-lg bg-muted font-mono text-sm">
                      # Install Ollama<br />
                      curl -fsSL https://ollama.ai/install.sh | sh<br />
                      <br />
                      # Pull a model<br />
                      ollama pull llama2
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                    <Button onClick={handleNext}>
                      Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-3xl text-center">Setup Complete!</CardTitle>
                  <CardDescription className="text-center">
                    You're ready to start using ZeroClaw
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <Badge>✓</Badge>
                      <span>Provider configured</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <Badge>✓</Badge>
                      <span>API key saved</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <Badge>✓</Badge>
                      <span>Ready to chat</span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={handleComplete} disabled={loading} size="lg">
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Start Using ZeroClaw
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
