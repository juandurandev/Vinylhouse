import { useEffect, useRef, useState } from 'react'
import { ALL_CATEGORIES, type VinylCategory } from '../data/vinylCatalog'
import { Button3D } from './Buttons'

export interface CategoryMultiselectProps {
  selectedCategories: VinylCategory[]
  onToggleCategory: (category: VinylCategory) => void
  onResetCategories: () => void
}

/**
 * Multiselect de categorías modular con la paleta y acabado 3D de Buttons.tsx
 * (#cd3f64 -> #9d3656 y borde/sombra #800033).
 */
export default function CategoryMultiselect({
  selectedCategories,
  onToggleCategory,
  onResetCategories,
}: CategoryMultiselectProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isAllSelected = selectedCategories.length === 0

  return (
    <div ref={dropdownRef} className="relative">
      <Button3D compact onClick={() => setIsOpen((prev) => !prev)}>
        <span className="hidden sm:inline">
          {isAllSelected
            ? 'Categorías: Todas'
            : `Categorías (${selectedCategories.length})`}
        </span>
        <span className="inline sm:hidden">
          {isAllSelected
            ? 'Géneros'
            : `Géneros (${selectedCategories.length})`}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </Button3D>

      {/* Menú desplegable con efecto Fade y colores sincronizados con Buttons.tsx */}
      <div
        aria-hidden={!isOpen}
        className={`absolute right-0 mt-2 w-48 rounded-xl border border-[#9d3656]/35 bg-[#FAF6F0] p-2 shadow-[0_10px_24px_rgba(128,0,51,0.18),0_3px_0_#800033] z-50 transition-all duration-250 ease-out origin-top-right ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 -translate-y-1.5 scale-95 pointer-events-none'
        }`}
      >
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onResetCategories}
            className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
              isAllSelected
                ? 'bg-[radial-gradient(#cd3f64,#9d3656)] text-white shadow-[0_2px_0_#800033,inset_0_0_0_1px_rgba(255,255,255,0.22)]'
                : 'text-[#4A1C2D] hover:bg-[#cd3f64]/12 hover:text-[#800033]'
            }`}
          >
            <span>Ver todos</span>
            <span className="text-[11px] font-bold">
              {isAllSelected ? '✓' : ''}
            </span>
          </button>

          {ALL_CATEGORIES.map((category) => {
            const isChecked = selectedCategories.includes(category)
            return (
              <button
                key={category}
                type="button"
                onClick={() => onToggleCategory(category)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isChecked
                    ? 'bg-[radial-gradient(#cd3f64,#9d3656)] text-white shadow-[0_2px_0_#800033,inset_0_0_0_1px_rgba(255,255,255,0.22)]'
                    : 'text-[#4A1C2D] hover:bg-[#cd3f64]/12 hover:text-[#800033]'
                }`}
              >
                <span>{category}</span>
                <span className="text-[11px] font-bold">
                  {isChecked ? '✓' : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

