import type { ButtonHTMLAttributes, PointerEvent, ReactNode } from 'react'
import { playKeypressSound } from './Buttons'

export type AlternativeButtonVariant = 'light' | 'orange' | 'dark'

export interface AlternativeButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AlternativeButtonVariant
  children: ReactNode
}

/**
 * Componente alternativo de botones estilo Teenage Engineering [EP-133 K.O. II]
 */
export function AlternativeButton({
  variant = 'light',
  children,
  className = '',
  type = 'button',
  disabled,
  onPointerDown,
  ...props
}: AlternativeButtonProps) {
  const variantClass =
    variant === 'orange'
      ? 'bg-[#d42a02] text-white shadow-[10px_10px_8px_rgba(0,0,0,0.377),inset_2px_2px_10px_0px_#fb702c,inset_-4px_-4px_1px_0px_#d42a02] active:shadow-[inset_0.5px_0.5px_4px_#000000,inset_-3.2px_-3.2px_8px_0px_#d42a02]'
      : variant === 'dark'
        ? 'bg-[#545251] text-white shadow-[10px_10px_8px_rgba(0,0,0,0.377),inset_1.5px_1.5px_1px_0px_#a8a6a4,inset_-3.2px_-3.2px_8px_0px_#545251] active:shadow-[inset_0.5px_0.5px_4px_#000000,inset_-3.2px_-3.2px_8px_0px_#545251]'
        : 'bg-[#c7c3c0] text-[#5f5f5f] shadow-[10px_10px_8px_rgba(0,0,0,0.377),inset_1.5px_1.5px_2px_0px_#ffffff,inset_-3.2px_-3.2px_8px_0px_#c7c3c0] active:shadow-[inset_0.5px_0.5px_4px_#000000,inset_-3.2px_-3.2px_8px_0px_#c7c3c0]'

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playKeypressSound()
    }
    onPointerDown?.(e)
  }

  return (
    <div className="inline-flex items-center justify-center rounded-[5px] bg-[#171717] p-1">
      <button
        type={type}
        disabled={disabled}
        onPointerDown={handlePointerDown}
        className={`flex items-center justify-center rounded-[10px] px-4 py-2.5 text-xs font-semibold tracking-wider transition duration-100 cursor-pointer ${variantClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    </div>
  )
}

export default AlternativeButton
