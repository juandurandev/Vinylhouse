import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  PointerEvent,
  ReactNode,
} from 'react'

export interface Button3DProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  compact?: boolean
  fullWidth?: boolean
}

export interface LinkButton3DProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  compact?: boolean
  fullWidth?: boolean
}

let sharedKeypressAudio: HTMLAudioElement | null = null

/**
 * Reproduce el sonido táctil (/sounds/keypress.mp3) al presionar los botones vintage.
 */
export function playKeypressSound() {
  if (typeof window === 'undefined') return
  try {
    if (!sharedKeypressAudio) {
      sharedKeypressAudio = new Audio('/sounds/keypress.mp3')
      sharedKeypressAudio.preload = 'auto'
      sharedKeypressAudio.volume = 0.65
    }
    const clickInstance = sharedKeypressAudio.cloneNode() as HTMLAudioElement
    clickInstance.volume = 0.65
    void clickInstance.play().catch(() => {
      // Ignorar si el navegador bloquea audio sin gesto previo
    })
  } catch {
    // Ignorar en entornos sin soporte de Audio
  }
}

/**
 * Botón 3D táctil reutilizable con estructura de tres capas:
 * .button-top, .button-bottom y .button-base + sonido mecánico keypress
 */
export function Button3D({
  children,
  compact = false,
  fullWidth = false,
  className = '',
  type = 'button',
  disabled,
  onPointerDown,
  ...props
}: Button3DProps) {
  const sizeClass = [
    'button',
    compact ? 'button--compact' : '',
    fullWidth ? 'button--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playKeypressSound()
    }
    onPointerDown?.(e)
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={sizeClass}
      onPointerDown={handlePointerDown}
      {...props}
    >
      <div className="button-top">{children}</div>
      <div className="button-bottom" />
      <div className="button-base" />
    </button>
  )
}

/**
 * Enlace `<a>` con apariencia de Botón 3D táctil, sonido keypress y soporte Swup.
 */
export function LinkButton3D({
  children,
  compact = false,
  fullWidth = false,
  className = '',
  onPointerDown,
  ...props
}: LinkButton3DProps) {
  const sizeClass = [
    'button',
    compact ? 'button--compact' : '',
    fullWidth ? 'button--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handlePointerDown = (e: PointerEvent<HTMLAnchorElement>) => {
    playKeypressSound()
    onPointerDown?.(e)
  }

  return (
    <a className={sizeClass} onPointerDown={handlePointerDown} {...props}>
      <div className="button-top">{children}</div>
      <div className="button-bottom" />
      <div className="button-base" />
    </a>
  )
}

export default Button3D
