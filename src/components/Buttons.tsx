import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
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

/**
 * Botón 3D táctil reutilizable con estructura de tres capas:
 * .button-top, .button-bottom y .button-base
 */
export function Button3D({
  children,
  compact = false,
  fullWidth = false,
  className = '',
  type = 'button',
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

  return (
    <button type={type} className={sizeClass} {...props}>
      <div className="button-top">{children}</div>
      <div className="button-bottom" />
      <div className="button-base" />
    </button>
  )
}

/**
 * Enlace `<a>` con apariencia de Botón 3D táctil, compatible con navegación Swup.
 */
export function LinkButton3D({
  children,
  compact = false,
  fullWidth = false,
  className = '',
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

  return (
    <a className={sizeClass} {...props}>
      <div className="button-top">{children}</div>
      <div className="button-bottom" />
      <div className="button-base" />
    </a>
  )
}

export default Button3D
