import type { FormEvent } from 'react'
import type { PaymentMethod } from '../data/vinylCatalog'
import { Button3D, LinkButton3D, playKeypressSound } from './Buttons'

export interface CheckoutViewProps {
  customerName: string
  customerPhone: string
  paymentMethod: PaymentMethod
  eurBcvRate: number
  isLoadingRate: boolean
  totalCartItems: number
  totalCartPrice: number
  totalInBolivares: number
  onNameChange: (name: string) => void
  onPhoneChange: (phone: string) => void
  onPaymentMethodChange: (method: PaymentMethod) => void
  onSubmit: (e: FormEvent) => void
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string }[] = [
  { id: 'pago_movil', label: 'Pago Móvil' },
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'binance', label: 'Binance' },
]

export default function CheckoutView({
  customerName,
  customerPhone,
  paymentMethod,
  eurBcvRate,
  isLoadingRate,
  totalCartItems,
  totalCartPrice,
  totalInBolivares,
  onNameChange,
  onPhoneChange,
  onPaymentMethodChange,
  onSubmit,
}: CheckoutViewProps) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4 pt-1 sm:px-8 sm:pb-8 md:px-14 bg-[#F5F2EB] overflow-hidden">
      <div className="w-full max-w-4xl h-full max-h-[85dvh] sm:max-h-[80dvh] flex flex-col rounded-2xl sm:rounded-3xl border border-black/8 bg-white p-4 sm:p-6 md:p-9 shadow-sm overflow-y-auto">
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-black/8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#1C1B18]">
              Confirmación de Compra
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#78736A]">
              Completa tus datos y selecciona tu método de pago preferido.
            </p>
          </div>

          <LinkButton3D
            href="/carrito"
            compact
            className="self-start sm:self-auto"
          >
            ← Volver al Carrito
          </LinkButton3D>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8"
        >
          {/* Datos del comprador y Método de Pago */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-5">
            <div>
              <label
                htmlFor="customer-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C5850] mb-1.5"
              >
                Nombre y Apellido
              </label>
              <input
                id="customer-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full rounded-2xl border border-black/12 bg-white px-4 py-3 text-sm text-[#1C1B18] placeholder:text-[#78736A]/60 focus:border-[#1C1B18] focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label
                htmlFor="customer-phone"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C5850] mb-1.5"
              >
                Teléfono de Contacto
              </label>
              <input
                id="customer-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="Ej. 0412-1234567"
                className="w-full rounded-2xl border border-black/12 bg-white px-4 py-3 text-sm text-[#1C1B18] placeholder:text-[#78736A]/60 focus:border-[#1C1B18] focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#5C5850] mb-2">
                Tipo de Pago
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PAYMENT_OPTIONS.map((option) => {
                  const isSelected = paymentMethod === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onPointerDown={playKeypressSound}
                      onClick={() => onPaymentMethodChange(option.id)}
                      className={`rounded-2xl border px-4 py-3 text-xs sm:text-sm font-medium transition cursor-pointer ${
                        isSelected
                          ? 'border-[#9d3656] bg-[#9d3656]/10 text-[#800033] font-semibold shadow-2xs'
                          : 'border-black/12 bg-white text-[#1C1B18] hover:bg-neutral-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Si se selecciona Pago Móvil: Mostrar monto en Bs a la tasa EUR BCV */}
            {paymentMethod === 'pago_movil' && (
              <div className="rounded-2xl border border-black/10 bg-[#F5F2EB]/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#5C5850]">
                  <span>Tasa de referencia (EUR BCV):</span>
                  <span className="font-mono font-semibold text-[#1C1B18]">
                    {isLoadingRate
                      ? 'Actualizando...'
                      : `Bs. ${eurBcvRate.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} / EUR`}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-black/8">
                  <span className="text-xs sm:text-sm font-semibold text-[#1C1B18]">
                    Total a transferir en Bolívares:
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#1C1B18]">
                    Bs.{' '}
                    {totalInBolivares.toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Resumen final y botón 3D de confirmar */}
          <div className="lg:col-span-2 rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between h-fit">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-[#1C1B18] pb-3 border-b border-black/8">
                Resumen de Compra
              </h3>

              <div className="mt-3 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-[#5C5850]">
                  <span>Vinilos seleccionados</span>
                  <span className="font-medium text-[#1C1B18]">
                    {totalCartItems}
                  </span>
                </div>
                <div className="flex justify-between text-[#5C5850]">
                  <span>Método elegido</span>
                  <span className="font-medium text-[#1C1B18]">
                    {paymentMethod === 'pago_movil'
                      ? 'Pago Móvil (Bs BCV)'
                      : paymentMethod === 'efectivo'
                        ? 'Efectivo'
                        : 'Binance'}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-bold text-[#1C1B18] pt-3 border-t border-black/8">
                  <span>Total en Divisas</span>
                  <span>${totalCartPrice.toFixed(2)} USD</span>
                </div>
                {paymentMethod === 'pago_movil' && (
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-[#1C1B18] pt-1">
                    <span>Total en Bolívares</span>
                    <span>
                      Bs.{' '}
                      {totalInBolivares.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Button3D type="submit" fullWidth>
                Confirmar Compra
              </Button3D>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

