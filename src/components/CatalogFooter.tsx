import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { VinylItem } from '../data/vinylCatalog'
import { Button3D } from './Buttons'

export interface CatalogFooterProps {
  currentVinyl: VinylItem
  currentSlotPosition: number
  totalFilteredCount: number
  feedbackMessage: string | null
  onBuyNow: () => void
  onAddToCart: () => void
}

/**
 * Pie del catálogo minimalista y centrado debajo de la portada 3D activa.
 */
export default function CatalogFooter({
  currentVinyl,
  currentSlotPosition,
  totalFilteredCount,
  feedbackMessage,
  onBuyNow,
  onAddToCart,
}: CatalogFooterProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const metaRef = useRef<HTMLParagraphElement | null>(null)
  const priceRef = useRef<HTMLDivElement | null>(null)

  // Animación GSAP suave cuando cambia el álbum activo
  useEffect(() => {
    const elements = [
      titleRef.current,
      metaRef.current,
      priceRef.current,
    ].filter((el) => el !== null)

    if (elements.length === 0) return

    gsap.killTweensOf(elements)
    gsap.fromTo(
      elements,
      {
        yPercent: 55,
        opacity: 0,
      },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.42,
        stagger: 0.045,
        ease: 'power3.out',
        overwrite: 'auto',
      }
    )
  }, [currentVinyl.id])

  return (
    <footer className="relative z-20 shrink-0 w-full px-4 pt-1 pb-4 sm:px-8 sm:pb-6 md:px-14 bg-[#F5F2EB]">
      <div className="mx-auto max-w-2xl flex flex-col items-center text-center">
        {/* Nombre del álbum, artista y precio centrados debajo del vinilo */}
        <div className="w-full overflow-hidden px-2">
          <h2
            ref={titleRef}
            className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-[#1C1B18] truncate will-change-transform"
          >
            {currentVinyl.title}
          </h2>

          <p
            ref={metaRef}
            className="mt-0.5 text-xs sm:text-sm text-[#5C5850] truncate will-change-transform"
          >
            {currentVinyl.artist} <span className="mx-1.5 opacity-50">•</span>{' '}
            {currentVinyl.year} <span className="mx-1.5 opacity-50">•</span>{' '}
            <span className="font-mono uppercase text-[11px] tracking-wider text-[#800033]">
              {currentVinyl.category}
            </span>
          </p>

          <div
            ref={priceRef}
            className="mt-1.5 inline-flex items-baseline justify-center gap-1.5 will-change-transform"
          >
            <span className="font-chillax text-2xl sm:text-3xl font-bold tracking-tight text-[#9d3656]">
              ${currentVinyl.price.toFixed(2)}
            </span>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#5C5850]">
              USD
            </span>
          </div>
        </div>

        {/* Botones de acción centrados y limpios */}
        <div className="mt-3 flex items-center justify-center gap-3 w-full sm:w-auto">
          <Button3D onClick={onBuyNow} className="flex-1 sm:flex-initial">
            Comprar ahora
          </Button3D>
          <Button3D onClick={onAddToCart} className="flex-1 sm:flex-initial">
            Agregar al carrito
          </Button3D>
        </div>
      </div>

      {/* Contador minimalista en la esquina sin saturar la barra */}
      <div className="mt-2 sm:mt-0 sm:absolute sm:right-8 md:right-14 sm:bottom-6 flex items-center justify-center sm:justify-end gap-3">
        {feedbackMessage && (
          <span className="rounded-lg text-[11px] sm:text-xs font-medium text-[#800033] bg-[#cd3f64]/10 border border-[#9d3656]/30 px-3 py-1">
            ✓ {feedbackMessage}
          </span>
        )}

        <span className="text-xs font-mono font-medium tracking-widest text-[#5C5850]">
          {String(currentSlotPosition).padStart(2, '0')} /{' '}
          {String(totalFilteredCount).padStart(2, '0')}
        </span>
      </div>
    </footer>
  )
}

