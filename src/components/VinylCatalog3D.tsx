import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Swup from 'swup'
import {
  SCENE_CONFIG,
  VINYL_CATALOG,
  type CartEntry,
  type PageView,
  type PaymentMethod,
  type VinylCategory,
  type VinylItem,
} from '../data/vinylCatalog'
import { LinkButton3D } from './Buttons'
import CartView from './CartView'
import CatalogFooter from './CatalogFooter'
import CategoryMultiselect from './CategoryMultiselect'
import CheckoutView from './CheckoutView'
import { loadOptimizedTexture } from '../utils/textureLoader'

gsap.registerPlugin(ScrollTrigger)

export default function VinylCatalog3D() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const titleCharsRef = useRef<(HTMLSpanElement | null)[]>([])
  const titleHoverTlRef = useRef<gsap.core.Timeline | null>(null)
  const isTitleIntroDoneRef = useRef<boolean>(false)

  const applyCategoryFilterRef = useRef<
    ((categories: VinylCategory[]) => void) | null
  >(null)
  const focusFirstVinylRef = useRef<(() => void) | null>(null)
  const swupRef = useRef<Swup | null>(null)
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)
  const lenisRef = useRef<Lenis | null>(null)

  const [hoveredVinyl, setHoveredVinyl] = useState<VinylItem | null>(null)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0)

  // Multiselect de categorías (vacío por defecto = se muestran todos)
  const [selectedCategories, setSelectedCategories] = useState<VinylCategory[]>(
    []
  )

  // Estado del carrito y vista controlada por Swup ('catalog' | 'cart' | 'checkout')
  const [cartItems, setCartItems] = useState<CartEntry[]>([])
  const [currentView, setCurrentView] = useState<PageView>(() => {
    const path = window.location.pathname
    if (path.includes('/checkout')) return 'checkout'
    if (path.includes('/carrito')) return 'cart'
    return 'catalog'
  })
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  // Estado del formulario de confirmación de compra (/checkout) y tasa EUR BCV
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('pago_movil')
  const [eurBcvRate, setEurBcvRate] = useState<number>(54.85)
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false)

  // Lista filtrada según el multiselect (si está vacío se ven todos por defecto)
  const filteredCatalog =
    selectedCategories.length === 0
      ? VINYL_CATALOG
      : VINYL_CATALOG.filter((item) =>
          selectedCategories.includes(item.category)
        )

  const safeSlotIndex = Math.min(
    selectedIndex ?? activeIndex,
    Math.max(filteredCatalog.length - 1, 0)
  )
  const currentVinyl =
    hoveredVinyl ?? filteredCatalog[safeSlotIndex] ?? VINYL_CATALOG[0]

  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg)
    window.setTimeout(() => {
      setFeedbackMessage((prev) => (prev === msg ? null : prev))
    }, 2500)
  }

  // Consultar tasa oficial EUR BCV actualizada (con respaldo automático si no hay red)
  useEffect(() => {
    let isMounted = true
    setIsLoadingRate(true)

    fetch('https://ve.dolarapi.com/v1/cotizaciones/eur')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          isMounted &&
          data &&
          typeof data.promedio === 'number' &&
          data.promedio > 0
        ) {
          setEurBcvRate(Number(data.promedio.toFixed(2)))
        }
      })
      .catch(() => {
        // Conserva la tasa EUR BCV de respaldo si falla la conexión
      })
      .finally(() => {
        if (isMounted) setIsLoadingRate(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // ===========================================================================
  // INICIALIZACIÓN DE SWUP PARA TRANSICIONES (/, /carrito, /checkout)
  // ===========================================================================
  useEffect(() => {
    const swup = new Swup({
      containers: ['#swup'],
      animationSelector: '[class*="transition-"]',
      animateHistoryBrowsing: true,
      cache: false,
    })

    swup.hooks.replace('page:load', async (visit) => {
      return {
        url: visit.to.url,
        html: '',
      }
    })

    swup.hooks.replace('content:replace', async (visit) => {
      const targetUrl = visit.to.url
      if (targetUrl.includes('/checkout')) {
        setCurrentView('checkout')
      } else if (targetUrl.includes('/carrito')) {
        setCurrentView('cart')
      } else {
        setCurrentView('catalog')
      }
    })

    swupRef.current = swup

    return () => {
      swup.destroy()
      swupRef.current = null
    }
  }, [])

  // Desactivar el pin spacer de ScrollTrigger cuando se está en /carrito o /checkout
  useEffect(() => {
    const st = scrollTriggerRef.current
    const lenis = lenisRef.current

    if (currentView !== 'catalog') {
      st?.disable(false)
      lenis?.stop()
      window.scrollTo(0, 0)
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      st?.enable(false)
      lenis?.start()
      ScrollTrigger.refresh()
    }
  }, [currentView])

  // Sincronizar cambios del multiselect de categorías con la escena 3D
  useEffect(() => {
    applyCategoryFilterRef.current?.(selectedCategories)
  }, [selectedCategories])

  // Animación GSAP de Fade-In general al recargar la página + título "vinilhouse"
  useEffect(() => {
    const validChars = titleCharsRef.current.filter(
      (el): el is HTMLSpanElement => el !== null
    )

    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        gsap.fromTo(
          sectionRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.15,
            ease: 'power2.out',
          }
        )
      }

      if (validChars.length > 0) {
        gsap.fromTo(
          validChars,
          {
            yPercent: 115,
            rotateZ: 6,
            opacity: 0,
          },
          {
            yPercent: 0,
            rotateZ: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.032,
            ease: 'power4.out',
            delay: 0.18,
            onComplete: () => {
              isTitleIntroDoneRef.current = true
            },
          }
        )

        const hoverTl = gsap.timeline({ paused: true })
        hoverTl
          .fromTo(
            validChars,
            { yPercent: 0, rotateZ: 0 },
            {
              yPercent: -16,
              duration: 0.22,
              stagger: 0.018,
              ease: 'power2.out',
            }
          )
          .to(
            validChars,
            {
              yPercent: 0,
              duration: 0.32,
              stagger: 0.018,
              ease: 'power3.out',
            },
            0.12
          )

        titleHoverTlRef.current = hoverTl
      }
    })

    return () => {
      isTitleIntroDoneRef.current = false
      titleHoverTlRef.current = null
      ctx.revert()
    }
  }, [])

  const handleTitleMouseEnter = () => {
    if (!isTitleIntroDoneRef.current || !titleHoverTlRef.current) return
    if (titleHoverTlRef.current.isActive()) return
    titleHoverTlRef.current.restart()
  }

  useEffect(() => {
    const section = sectionRef.current
    const container = canvasContainerRef.current
    if (!section || !container) return

    // =========================================================================
    // 1. LENIS + GSAP SCROLLTRIGGER (Sincronización de Scroll Suave)
    // =========================================================================
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(updateLenis)
    gsap.ticker.lagSmoothing(0)

    // =========================================================================
    // 2. ESCENA THREE.JS, CÁMARA RESPONSIVA Y RENDERER (Fondo Crema #F5F2EB)
    // =========================================================================
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(SCENE_CONFIG.bgColor)

    const getResponsiveCameraZ = (width: number, height: number) => {
      const aspect = width / Math.max(height, 1)
      if (aspect < 1) {
        return THREE.MathUtils.clamp(8.5 / Math.pow(aspect, 0.52), 8.7, 13.4)
      }
      return 8.5
    }

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    )
    camera.position.set(
      0,
      0.0,
      getResponsiveCameraZ(container.clientWidth, container.clientHeight)
    )

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = false
    container.appendChild(renderer.domElement)

    // =========================================================================
    // 3. ILUMINACIÓN CÁLIDA DE ESTUDIO
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0xfffcf5, 1.85)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xfff8eb, 1.6)
    mainLight.position.set(6, 9, 8)
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0xf3ede2, 0.9)
    fillLight.position.set(-6, -2, 5)
    scene.add(fillLight)

    // =========================================================================
    // 4. CONSTRUCCIÓN DE LAS CUBIERTAS 3D + MATERIALES COMPARTIDOS OPTIMIZADOS
    // =========================================================================
    const carouselGroup = new THREE.Group()
    scene.add(carouselGroup)

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

    const sleeveGeometry = new THREE.BoxGeometry(
      SCENE_CONFIG.coverSize,
      SCENE_CONFIG.coverSize,
      SCENE_CONFIG.coverDepth
    )

    // Materiales compartidos opacos para evitar recompilación de shaders
    const sharedSpineMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2dcd0,
      roughness: 0.75,
      metalness: 0.04,
    })

    const sharedBackCoverMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d1c5,
      roughness: 0.65,
      metalness: 0.05,
    })

    interface IntroOffset {
      offsetX: number
      offsetY: number
      offsetZ: number
      rotX: number
      rotY: number
      rotZ: number
    }

    interface CoverRecord {
      group: THREE.Group
      mesh: THREE.Mesh
      frontMaterial: THREE.MeshStandardMaterial
      basePosition: THREE.Vector3
      baseRotation: THREE.Euler
      dampedPos: THREE.Vector3
      dampedRot: THREE.Vector3
      introState: IntroOffset
      item: VinylItem
      index: number
      visibleSlot: number
      isVisible: boolean
    }

    const coverRecords: CoverRecord[] = []
    let activeInteractiveMeshes: THREE.Object3D[] = []
    let isDisposed = false

    VINYL_CATALOG.forEach((item, index) => {
      const itemGroup = new THREE.Group()

      const basePos = new THREE.Vector3(
        index * SCENE_CONFIG.spacingX,
        0.1,
        index * SCENE_CONFIG.spacingZ
      )
      const baseRot = new THREE.Euler(
        SCENE_CONFIG.baseRotationX,
        SCENE_CONFIG.baseRotationY,
        0
      )

      const introState: IntroOffset = {
        offsetX: 9.2 + index * 1.15,
        offsetY: 5.4 + index * 0.55,
        offsetZ: -4.2 - index * 0.65,
        rotX: 0.32,
        rotY: -0.38,
        rotZ: -0.24,
      }

      const initialFocusY = index === 0 ? SCENE_CONFIG.selectedLiftY : 0
      const initialFocusZ = index === 0 ? SCENE_CONFIG.selectedPullZ : 0
      const initialRotY =
        index === 0 ? SCENE_CONFIG.selectedRotationY : baseRot.y

      const dampedPos = new THREE.Vector3(
        basePos.x,
        basePos.y + initialFocusY,
        basePos.z + initialFocusZ
      )
      const dampedRot = new THREE.Vector3(baseRot.x, initialRotY, 0)

      itemGroup.position.set(
        dampedPos.x + introState.offsetX,
        dampedPos.y + introState.offsetY,
        dampedPos.z + introState.offsetZ
      )
      itemGroup.rotation.set(
        dampedRot.x + introState.rotX,
        dampedRot.y + introState.rotY,
        dampedRot.z + introState.rotZ
      )
      itemGroup.scale.setScalar(0.001)

      const frontMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.32,
        metalness: 0.04,
      })

      const materials = [
        sharedSpineMaterial,
        sharedSpineMaterial,
        sharedSpineMaterial,
        sharedSpineMaterial,
        frontMaterial,
        sharedBackCoverMaterial,
      ]

      const coverMesh = new THREE.Mesh(sleeveGeometry, materials)
      coverMesh.userData = { visibleSlot: index }

      itemGroup.add(coverMesh)
      carouselGroup.add(itemGroup)
      activeInteractiveMeshes.push(coverMesh)

      coverRecords.push({
        group: itemGroup,
        mesh: coverMesh,
        frontMaterial,
        basePosition: basePos,
        baseRotation: baseRot,
        dampedPos,
        dampedRot,
        introState,
        item,
        index,
        visibleSlot: index,
        isVisible: true,
      })
    })

    // Pre-compilar shaders de la escena antes de iniciar el bucle de animación
    renderer.compile(scene, camera)

    // =========================================================================
    // 5. CARGA ASÍNCRONA DE TEXTURAS EN GPU + ANIMACIÓN DE ENTRADA FLUIDA
    // =========================================================================
    let hasTriggeredIntro = false

    const startIntroAnimation = () => {
      if (hasTriggeredIntro || isDisposed) return
      hasTriggeredIntro = true

      coverRecords.forEach((record, idx) => {
        const staggerDelay = 0.02 + idx * 0.042

        gsap.to(record.introState, {
          offsetX: 0,
          offsetY: 0,
          offsetZ: 0,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          duration: 1.25,
          delay: staggerDelay,
          ease: 'expo.out',
        })

        gsap.fromTo(
          record.group.scale,
          { x: 0.82, y: 0.82, z: 0.82 },
          {
            x: 1,
            y: 1,
            z: 1,
            duration: 1.15,
            delay: staggerDelay,
            ease: 'expo.out',
          }
        )
      })
    }

    // Priorizar los primeros 5 vinilos visibles en pantalla y cargar el resto en paralelo
    const priorityRecords = coverRecords.slice(0, 5)
    const remainingRecords = coverRecords.slice(5)

    const loadRecordTexture = async (record: CoverRecord) => {
      const texture = await loadOptimizedTexture(
        record.item.image,
        renderer,
        maxAnisotropy
      )
      if (isDisposed) return
      record.frontMaterial.map = texture
      record.frontMaterial.needsUpdate = true
    }

    // Fallback de seguridad por si la red tarda más de 90ms
    const introFallbackTimer = window.setTimeout(startIntroAnimation, 90)

    Promise.all(priorityRecords.map(loadRecordTexture)).then(() => {
      window.clearTimeout(introFallbackTimer)
      startIntroAnimation()
      // Cargar el resto de portadas en segundo plano sin bloquear el hilo principal
      remainingRecords.forEach((record) => {
        void loadRecordTexture(record)
      })
    })

    // =========================================================================
    // 6. ESTADO COMPARTIDO: SCROLL + DRAG + FILTRO POR CATEGORÍAS
    // =========================================================================
    const trackState = {
      visibleCount: VINYL_CATALOG.length,
      targetProgress: 0,
      currentProgress: 0,
      smoothVelocity: 0,
      selectedIdx: 0 as number | null,
      isDragging: false,
      hasMovedDuringDrag: false,
      dragStartX: 0,
      dragStartY: 0,
      dragStartProgress: 0,
      isPointerInside: false,
    }

    const setClampedProgress = (value: number) => {
      trackState.targetProgress = THREE.MathUtils.clamp(value, 0, 1)
    }

    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${window.innerHeight * 4.2}`,
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => {
        if (!trackState.isDragging) {
          setClampedProgress(self.progress)
        }
      },
    })
    scrollTriggerRef.current = scrollTriggerInstance

    const syncScrollToProgress = (progress: number, immediate = true) => {
      const start = scrollTriggerInstance.start
      const end = scrollTriggerInstance.end
      if (end <= start) return
      const targetScrollY = start + progress * (end - start)
      if (immediate) {
        lenis.scrollTo(targetScrollY, { immediate: true })
      } else {
        lenis.scrollTo(targetScrollY, { duration: 1.0 })
      }
    }

    const focusAndSelectVinyl = (targetSlotIndex: number) => {
      trackState.selectedIdx = targetSlotIndex
      setSelectedIndex(targetSlotIndex)
      setActiveIndex(targetSlotIndex)

      const targetProgress =
        trackState.visibleCount > 1
          ? targetSlotIndex / (trackState.visibleCount - 1)
          : 0
      setClampedProgress(targetProgress)
      syncScrollToProgress(targetProgress, false)
    }

    focusFirstVinylRef.current = () => {
      focusAndSelectVinyl(0)
    }

    applyCategoryFilterRef.current = (categories: VinylCategory[]) => {
      const nextInteractive: THREE.Object3D[] = []
      let slot = 0

      coverRecords.forEach((record) => {
        const matches =
          categories.length === 0 || categories.includes(record.item.category)
        record.isVisible = matches
        record.group.visible = matches

        if (matches) {
          record.visibleSlot = slot
          record.mesh.userData.visibleSlot = slot
          record.basePosition.set(
            slot * SCENE_CONFIG.spacingX,
            0.1,
            slot * SCENE_CONFIG.spacingZ
          )
          nextInteractive.push(record.mesh)
          slot++
        }
      })

      activeInteractiveMeshes = nextInteractive
      trackState.visibleCount = Math.max(slot, 1)
      trackState.selectedIdx = 0
      trackState.targetProgress = 0
      setHoveredVinyl(null)
      setSelectedIndex(0)
      setActiveIndex(0)
      syncScrollToProgress(0, false)
    }

    // =========================================================================
    // 7. EVENTOS DE INTERACCIÓN (MOUSE + TOUCH RESPONSIVE)
    // =========================================================================
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(-999, -999)
    let hoveredSlotIndex: number | null = null

    const updateNormalizedPointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      trackState.isDragging = true
      trackState.hasMovedDuringDrag = false
      trackState.dragStartX = e.clientX
      trackState.dragStartY = e.clientY
      trackState.dragStartProgress = trackState.targetProgress
      updateNormalizedPointer(e.clientX, e.clientY)
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const isInsideCanvas =
        rect.width > 0 &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      trackState.isPointerInside = isInsideCanvas
      if (isInsideCanvas) {
        updateNormalizedPointer(e.clientX, e.clientY)
      }

      if (trackState.isDragging) {
        const deltaX = e.clientX - trackState.dragStartX
        const deltaY = e.clientY - trackState.dragStartY

        if (Math.hypot(deltaX, deltaY) > 5) {
          trackState.hasMovedDuringDrag = true
          container.style.cursor = 'grabbing'

          const sensitivity =
            window.innerWidth < 768
              ? SCENE_CONFIG.dragSensitivity * 1.65
              : SCENE_CONFIG.dragSensitivity

          const nextProgress =
            trackState.dragStartProgress - deltaX * sensitivity
          setClampedProgress(nextProgress)
          syncScrollToProgress(trackState.targetProgress, true)

          trackState.selectedIdx = null
        }
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!trackState.isDragging) return

      const wasClick = !trackState.hasMovedDuringDrag
      trackState.isDragging = false

      if (wasClick) {
        updateNormalizedPointer(e.clientX, e.clientY)
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(
          activeInteractiveMeshes,
          false
        )
        if (intersects.length > 0) {
          const clickedSlot = intersects[0].object.userData
            .visibleSlot as number
          focusAndSelectVinyl(clickedSlot)
        }
      } else {
        const nearestIdx = Math.round(
          trackState.targetProgress * Math.max(trackState.visibleCount - 1, 0)
        )
        trackState.selectedIdx = nearestIdx
        setSelectedIndex(nearestIdx)
      }

      container.style.cursor = hoveredSlotIndex !== null ? 'pointer' : 'grab'
    }

    const onPointerLeave = () => {
      trackState.isPointerInside = false
      pointer.set(-999, -999)
      hoveredSlotIndex = null
      setHoveredVinyl(null)
      if (!trackState.isDragging) {
        container.style.cursor = 'grab'
      }
    }

    const onWheel = (e: WheelEvent) => {
      if (!trackState.isPointerInside) return
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const nextProgress =
        trackState.targetProgress + delta * SCENE_CONFIG.wheelSensitivity
      setClampedProgress(nextProgress)

      const nearestIdx = Math.round(
        trackState.targetProgress * Math.max(trackState.visibleCount - 1, 0)
      )
      trackState.selectedIdx = nearestIdx
      setSelectedIndex(nearestIdx)
    }

    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    container.addEventListener('pointerleave', onPointerLeave)
    container.addEventListener('wheel', onWheel, { passive: true })

    // =========================================================================
    // 8. BUCLE DE ANIMACIÓN CON INTERPOLACIÓN CONTINUA + MOVIMIENTO CONSTANTE
    // =========================================================================
    let animationFrameId: number
    let lastActiveIdx = -1
    const tempLocalPoint = new THREE.Vector3()
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.getElapsedTime()

      const maxSlot = Math.max(trackState.visibleCount - 1, 0)
      const totalTravelX = maxSlot * SCENE_CONFIG.spacingX
      const totalTravelZ = maxSlot * SCENE_CONFIG.spacingZ

      const previousProgress = trackState.currentProgress
      trackState.currentProgress +=
        (trackState.targetProgress - trackState.currentProgress) *
        SCENE_CONFIG.lerpFactor

      const rawVelocity = trackState.currentProgress - previousProgress
      trackState.smoothVelocity +=
        (rawVelocity - trackState.smoothVelocity) * 0.12

      const currentFloatIndex = trackState.currentProgress * maxSlot
      const currentIdx = Math.round(currentFloatIndex)
      if (currentIdx !== lastActiveIdx) {
        lastActiveIdx = currentIdx
        setActiveIndex(currentIdx)
      }

      carouselGroup.position.x = -trackState.currentProgress * totalTravelX
      carouselGroup.position.z = -trackState.currentProgress * totalTravelZ

      let hoverNormX = 0
      let hoverNormY = 0

      if (!trackState.hasMovedDuringDrag && trackState.isPointerInside) {
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(
          activeInteractiveMeshes,
          false
        )

        if (intersects.length > 0) {
          const hit = intersects[0]
          const hitSlot = hit.object.userData.visibleSlot as number

          if (hoveredSlotIndex !== hitSlot) {
            hoveredSlotIndex = hitSlot
            const matchedRecord = coverRecords.find(
              (r) => r.isVisible && r.visibleSlot === hitSlot
            )
            if (matchedRecord) {
              setHoveredVinyl(matchedRecord.item)
            }
            container.style.cursor = 'pointer'
          }

          tempLocalPoint.copy(hit.point)
          hit.object.worldToLocal(tempLocalPoint)
          hoverNormX = tempLocalPoint.x / (SCENE_CONFIG.coverSize * 0.5)
          hoverNormY = tempLocalPoint.y / (SCENE_CONFIG.coverSize * 0.5)
        } else if (hoveredSlotIndex !== null) {
          hoveredSlotIndex = null
          setHoveredVinyl(null)
          container.style.cursor = 'grab'
        }
      } else if (hoveredSlotIndex !== null) {
        hoveredSlotIndex = null
        setHoveredVinyl(null)
      }

      const dynamicSwing = THREE.MathUtils.clamp(
        trackState.smoothVelocity * 11,
        -0.22,
        0.22
      )

      coverRecords.forEach((record) => {
        if (!record.isVisible) return

        const focusWeight =
          trackState.selectedIdx !== null
            ? record.visibleSlot === trackState.selectedIdx
              ? 1
              : 0
            : THREE.MathUtils.smoothstep(
                1 -
                  Math.min(
                    Math.abs(record.visibleSlot - currentFloatIndex),
                    1
                  ),
                0,
                1
              )

        const isHovered = record.visibleSlot === hoveredSlotIndex

        // Movimiento sutil constante para el disco seleccionado
        const idleFloatY = Math.sin(elapsed * 2.1) * 0.075 * focusWeight
        const idleFloatZ = Math.cos(elapsed * 1.6) * 0.04 * focusWeight
        const idleSwayX = Math.cos(elapsed * 1.8) * 0.026 * focusWeight
        const idleSwayY = Math.sin(elapsed * 1.4) * 0.042 * focusWeight
        const idleSwayZ = Math.sin(elapsed * 1.1) * 0.016 * focusWeight

        let targetY =
          record.basePosition.y +
          focusWeight * SCENE_CONFIG.selectedLiftY +
          idleFloatY
        let targetZ =
          record.basePosition.z +
          focusWeight * SCENE_CONFIG.selectedPullZ +
          idleFloatZ

        if (isHovered) {
          targetY += SCENE_CONFIG.hoverLiftY
          targetZ += SCENE_CONFIG.hoverPullZ * (1 - focusWeight * 0.5)
        }

        let targetRotX =
          THREE.MathUtils.lerp(
            record.baseRotation.x,
            SCENE_CONFIG.selectedRotationX,
            focusWeight
          ) + idleSwayX
        let targetRotY =
          THREE.MathUtils.lerp(
            record.baseRotation.y,
            SCENE_CONFIG.selectedRotationY,
            focusWeight
          ) +
          idleSwayY +
          dynamicSwing * (1 - focusWeight * 0.35)
        let targetRotZ = -dynamicSwing * 0.14 + idleSwayZ

        if (isHovered) {
          targetRotX -= hoverNormY * SCENE_CONFIG.hoverTiltStrength
          targetRotY +=
            0.06 * (1 - focusWeight) +
            hoverNormX * SCENE_CONFIG.hoverTiltStrength
          targetRotZ -= hoverNormX * 0.025
        }

        record.dampedPos.x = THREE.MathUtils.damp(
          record.dampedPos.x,
          record.basePosition.x,
          SCENE_CONFIG.rotationDamping,
          delta
        )
        record.dampedPos.y = THREE.MathUtils.damp(
          record.dampedPos.y,
          targetY,
          SCENE_CONFIG.rotationDamping,
          delta
        )
        record.dampedPos.z = THREE.MathUtils.damp(
          record.dampedPos.z,
          targetZ,
          SCENE_CONFIG.rotationDamping,
          delta
        )

        record.dampedRot.x = THREE.MathUtils.damp(
          record.dampedRot.x,
          targetRotX,
          SCENE_CONFIG.rotationDamping,
          delta
        )
        record.dampedRot.y = THREE.MathUtils.damp(
          record.dampedRot.y,
          targetRotY,
          SCENE_CONFIG.rotationDamping,
          delta
        )
        record.dampedRot.z = THREE.MathUtils.damp(
          record.dampedRot.z,
          targetRotZ,
          SCENE_CONFIG.rotationDamping,
          delta
        )

        record.group.position.set(
          record.dampedPos.x + record.introState.offsetX,
          record.dampedPos.y + record.introState.offsetY,
          record.dampedPos.z + record.introState.offsetZ
        )

        record.group.rotation.set(
          record.dampedRot.x + record.introState.rotX,
          record.dampedRot.y + record.introState.rotY,
          record.dampedRot.z + record.introState.rotZ
        )
      })

      renderer.render(scene, camera)
    }

    animate()

    // =========================================================================
    // 9. RESPONSIVE RESIZE
    // =========================================================================
    const onResize = () => {
      if (
        !container ||
        container.clientWidth === 0 ||
        container.clientHeight === 0
      ) {
        return
      }
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.position.z = getResponsiveCameraZ(w, h)
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', onResize)

    return () => {
      isDisposed = true
      window.clearTimeout(introFallbackTimer)
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', onResize)
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      container.removeEventListener('pointerleave', onPointerLeave)
      container.removeEventListener('wheel', onWheel)
      scrollTriggerInstance.kill()
      scrollTriggerRef.current = null
      gsap.ticker.remove(updateLenis)
      lenis.destroy()
      lenisRef.current = null
      sleeveGeometry.dispose()
      sharedSpineMaterial.dispose()
      sharedBackCoverMaterial.dispose()
      coverRecords.forEach((record) => record.frontMaterial.dispose())
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Alternar categoría en el multiselect
  const toggleCategory = (cat: VinylCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat)
      }
      return [...prev, cat]
    })
  }

  // Funciones de gestión del carrito
  const addVinylToCart = (vinyl: VinylItem) => {
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.vinyl.id === vinyl.id)
      if (existing) {
        return prev.map((entry) =>
          entry.vinyl.id === vinyl.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        )
      }
      return [...prev, { vinyl, quantity: 1 }]
    })
  }

  const updateCartQuantity = (vinylId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((entry) =>
          entry.vinyl.id === vinylId
            ? { ...entry, quantity: entry.quantity + delta }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    )
  }

  const handleAddToCart = () => {
    addVinylToCart(currentVinyl)
    triggerFeedback(`"${currentVinyl.title}" agregado al carrito`)
  }

  const handleBuyNow = () => {
    addVinylToCart(currentVinyl)
    if (swupRef.current) {
      swupRef.current.navigate('/carrito')
    } else {
      setCurrentView('cart')
    }
  }

  const handleProceedToCheckout = () => {
    if (swupRef.current) {
      swupRef.current.navigate('/checkout')
    } else {
      setCurrentView('checkout')
    }
  }

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim() || !customerPhone.trim()) return

    setCartItems([])
    setCustomerName('')
    setCustomerPhone('')
    triggerFeedback(`¡Compra confirmada a nombre de ${customerName.trim()}!`)
    if (swupRef.current) {
      swupRef.current.navigate('/')
    } else {
      setCurrentView('catalog')
    }
  }

  const totalCartItems = cartItems.reduce(
    (sum, entry) => sum + entry.quantity,
    0
  )
  const totalCartPrice = cartItems.reduce(
    (sum, entry) => sum + entry.vinyl.price * entry.quantity,
    0
  )
  const totalInBolivares = totalCartPrice * eurBcvRate

  const handleTitleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (currentView === 'catalog') {
      e.preventDefault()
      focusFirstVinylRef.current?.()
    }
  }

  const titleText = 'vinilhouse'
  const currentSlotPosition =
    filteredCatalog.findIndex((item) => item.id === currentVinyl.id) + 1 || 1

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col w-full h-dvh overflow-hidden bg-[#F5F2EB] text-[#1C1B18]"
    >
      {/* Contenedor principal gestionado por Swup (#swup + .transition-swup) */}
      <div
        id="swup"
        className="transition-swup relative flex flex-col w-full h-full overflow-hidden"
      >
        {/* Encabezado responsive con nombre "vinilhouse" en fuente Chillax clickeable hacia el inicio */}
        <header className="relative z-30 shrink-0 flex items-center justify-between gap-2 sm:gap-4 px-4 pt-4 pb-1 sm:px-8 sm:pt-5 sm:pb-2 md:px-14 bg-[#F5F2EB]">
          <a
            href="/"
            onClick={handleTitleClick}
            onMouseEnter={handleTitleMouseEnter}
            aria-label="Ir al inicio de vinilhouse"
            className="cursor-pointer select-none min-w-0 no-underline focus:outline-none"
          >
            <h1
              className="font-chillax flex flex-wrap text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1B18] overflow-hidden py-0.5"
              aria-label={titleText}
            >
              {titleText.split('').map((char, idx) => (
                <span
                  key={idx}
                  ref={(el) => {
                    titleCharsRef.current[idx] = el
                  }}
                  className="inline-block will-change-transform"
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h1>
          </a>

          <div className="shrink-0 flex items-center gap-2 sm:gap-3">
            {/* Multiselect modular con la paleta de Buttons.tsx */}
            {currentView === 'catalog' && (
              <CategoryMultiselect
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                onResetCategories={() => setSelectedCategories([])}
              />
            )}

            {/* Navegación contextual con Swup usando LinkButton3D */}
            {currentView !== 'catalog' ? (
              <LinkButton3D href="/" compact>
                <span>← Catálogo</span>
              </LinkButton3D>
            ) : (
              <LinkButton3D href="/carrito" compact aria-label="Ver Carrito">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-white"
                  aria-hidden="true"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span className="text-xs font-mono font-semibold text-white">
                  {totalCartItems}
                </span>
              </LinkButton3D>
            )}
          </div>
        </header>

        {/* VISTA 1: CATÁLOGO 3D */}
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            currentView === 'catalog' ? 'flex' : 'hidden'
          }`}
        >
          {/* Área exclusiva de Drag & 3D */}
          <div
            ref={canvasContainerRef}
            className="relative flex-1 w-full min-h-0 cursor-grab active:cursor-grabbing select-none touch-none"
            aria-label="Catálogo 3D interactivo de portadas de vinilos"
          />

          {/* Footer modular centrado directamente debajo del álbum 3D */}
          <CatalogFooter
            currentVinyl={currentVinyl}
            currentSlotPosition={currentSlotPosition}
            totalFilteredCount={filteredCatalog.length}
            feedbackMessage={feedbackMessage}
            onBuyNow={handleBuyNow}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* VISTA 2: CARRITO (/carrito) */}
        {currentView === 'cart' && (
          <CartView
            cartItems={cartItems}
            totalCartItems={totalCartItems}
            totalCartPrice={totalCartPrice}
            onUpdateQuantity={updateCartQuantity}
            onProceedToCheckout={handleProceedToCheckout}
          />
        )}

        {/* VISTA 3: CONFIRMACIÓN DE COMPRA (/checkout) */}
        {currentView === 'checkout' && (
          <CheckoutView
            customerName={customerName}
            customerPhone={customerPhone}
            paymentMethod={paymentMethod}
            eurBcvRate={eurBcvRate}
            isLoadingRate={isLoadingRate}
            totalCartItems={totalCartItems}
            totalCartPrice={totalCartPrice}
            totalInBolivares={totalInBolivares}
            onNameChange={setCustomerName}
            onPhoneChange={setCustomerPhone}
            onPaymentMethodChange={setPaymentMethod}
            onSubmit={handleConfirmPurchase}
          />
        )}
      </div>
    </section>
  )
}
