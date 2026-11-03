import type { CartEntry } from '../data/vinylCatalog'
import { Button3D, LinkButton3D } from './Buttons'

export interface CartViewProps {
  cartItems: CartEntry[]
  totalCartItems: number
  totalCartPrice: number
  onUpdateQuantity: (vinylId: number, delta: number) => void
  onProceedToCheckout: () => void
}

export default function CartView({
  cartItems,
  totalCartItems,
  totalCartPrice,
  onUpdateQuantity,
  onProceedToCheckout,
}: CartViewProps) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4 pt-1 sm:px-8 sm:pb-8 md:px-14 bg-[#F5F2EB] overflow-hidden">
      <div className="w-full max-w-5xl h-full max-h-[85dvh] sm:max-h-[80dvh] flex flex-col rounded-2xl sm:rounded-3xl border border-black/8 bg-white p-4 sm:p-6 md:p-9 shadow-sm overflow-hidden">
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-black/8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#1C1B18]">
            Tu Carrito de Vinilos ({totalCartItems})
          </h2>

          <LinkButton3D href="/" compact className="self-start sm:self-auto">
            + Seguir explorando
          </LinkButton3D>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
            <p className="text-sm sm:text-base font-medium text-[#5C5850]">
              Tu carrito está vacío actualmente.
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-[#78736A] mb-5">
              Regresa al catálogo 3D para seleccionar tus ediciones en vinilo.
            </p>
            <LinkButton3D href="/">Ir al Catálogo 3D</LinkButton3D>
          </div>
        ) : (
          <div className="flex-1 min-h-0 mt-4 sm:mt-6 flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-7 overflow-y-auto lg:overflow-hidden">
            {/* Lista de discos */}
            <div className="lg:col-span-2 lg:overflow-y-auto pr-0.5 space-y-3">
              {cartItems.map(({ vinyl, quantity }) => (
                <div
                  key={vinyl.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-black/8 bg-white p-3 sm:p-4 shadow-2xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={vinyl.image}
                      alt={vinyl.title}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-black/8 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#78736A]">
                        {vinyl.category} • {vinyl.year}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold truncate text-[#1C1B18]">
                        {vinyl.title}
                      </h3>
                      <p className="text-xs text-[#5C5850] truncate">
                        {vinyl.artist}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-[#1C1B18]">
                        ${vinyl.price.toFixed(2)} USD c/u
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/6">
                    <div className="flex items-center gap-1.5">
                      <Button3D
                        compact
                        onClick={() => onUpdateQuantity(vinyl.id, -1)}
                        aria-label={`Disminuir cantidad de ${vinyl.title}`}
                      >
                        -
                      </Button3D>
                      <span className="min-w-6 text-center text-xs font-semibold text-[#1C1B18]">
                        {quantity}
                      </span>
                      <Button3D
                        compact
                        onClick={() => onUpdateQuantity(vinyl.id, 1)}
                        aria-label={`Aumentar cantidad de ${vinyl.title}`}
                      >
                        +
                      </Button3D>
                    </div>
                    <span className="text-xs font-semibold text-[#1C1B18]">
                      Subtotal: ${(vinyl.price * quantity).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tarjeta blanca redondeada de Resumen del Pedido */}
            <div className="shrink-0 rounded-2xl border border-black/10 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between h-fit">
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-[#1C1B18] pb-3 border-b border-black/8">
                  Resumen del Pedido
                </h3>
                <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between text-[#5C5850]">
                    <span>Unidades</span>
                    <span className="font-medium text-[#1C1B18]">
                      {totalCartItems} vinilos
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5C5850]">
                    <span>Envío protegido</span>
                    <span className="font-medium text-emerald-700">Gratis</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base font-bold text-[#1C1B18] pt-3 border-t border-black/8">
                    <span>Total</span>
                    <span>${totalCartPrice.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <Button3D fullWidth onClick={onProceedToCheckout}>
                  Finalizar Compra
                </Button3D>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

