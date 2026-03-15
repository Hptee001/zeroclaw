import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
      onChange?.(e)
    }
    
    return (
      <input
        type="checkbox"
        className={cn(
          'peer h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full border border-input',
          'bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'checked:bg-primary checked:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }
