import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Swup from 'swup'

gsap.registerPlugin(ScrollTrigger)

export type VinylCategory = 'Rock' | 'Hip-Hop' | 'R&B' | 'Pop' | 'Urbano'

export const ALL_CATEGORIES: VinylCategory[] = [
  'Rock',
  'Hip-Hop',
  'R&B',
  'Pop',
  'Urbano',
]

export interface VinylItem {
  id: number
  title: string
  artist: string
  year: string
  price: number
  category: VinylCategory
  image: string
}

export interface CartEntry {
  vinyl: VinylItem
  quantity: number
}

export type PaymentMethod = 'pago_movil' | 'efectivo' | 'binance'
export type PageView = 'catalog' | 'cart' | 'checkout'

// Catálogo usando las portadas reales en /public/images
export const VINYL_CATALOG: VinylItem[] = [
  {
    id: 1,
    title: 'Appetite For Destruction',
    artist: "Guns N' Roses",
    year: '1987',
    price: 36.0,
    category: 'Rock',
    image: "/images/Appetite For Destruction Guns N' Roses.jpg",
  },
  {
    id: 2,
    title: 'ASTROWORLD',
    artist: 'Travis Scott',
    year: '2018',
    price: 39.5,
    category: 'Hip-Hop',
    image: '/images/ASTROWORLD Travis Scott.jpg',
  },
  {
    id: 3,
    title: 'Blonde',
    artist: 'Frank Ocean',
    year: '2016',
    price: 45.0,
    category: 'R&B',
    image: '/images/Blonde by Frank Ocean.jpg',
  },
  {
    id: 4,
    title: 'Dangerous',
    artist: 'Michael Jackson',
    year: '1991',
    price: 38.0,
    category: 'Pop',
    image: '/images/Dangerous Michael Jackson.jpg',
  },
  {
    id: 5,
    title: 'Starboy',
    artist: 'The Weeknd',
    year: '2016',
    price: 37.5,
    category: 'R&B',
    image: '/images/Starboy The Weeknd.jpg',
  },
  {
    id: 6,
    title: 'Thriller',
    artist: 'Michael Jackson',
    year: '1982',
    price: 35.0,
    category: 'Pop',
    image: '/images/Thriller Michael Jackson.jpg',
  },
  {
    id: 7,
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    year: '2022',
    price: 42.0,
    category: 'Urbano',
    image: '/images/Un Verano Sin Ti Bad Bunny.jpg',
  },
  {
    id: 8,
    title: 'Views',
    artist: 'Drake',
    year: '2016',
    price: 38.5,
    category: 'Hip-Hop',
    image: '/images/Views Drake.jpg',
  },
]

// ============================================================================
// CONFIGURACIÓN CENTRAL DEL CARRUSEL 3D
// ============================================================================
const CONFIG = {
  bgColor: 0xf5f2eb,        // Color crema cálido (#F5F2EB)
  coverSize: 3.75,          // Portadas grandes con fuerte protagonismo visual
  coverDepth: 0.13,         // Grosor 3D de la cubierta
  spacingX: 3.0,            // Separación horizontal entre portadas
  spacingZ: -0.68,          // Profundidad escalonada de derecha a izquierda
  baseRotationY: -0.46,     // Inclinación base en eje Y
  baseRotationX: 0.04,      // Inclinación base en eje X
  selectedRotationY: -0.1,  // Giro suave hacia el frente cuando está seleccionado
  selectedRotationX: 0.0,   // Nivelación frontal al estar seleccionado
  selectedLiftY: 0.14,      // Ligera elevación al estar en foco
  selectedPullZ: 0.45,      // Ligero acercamiento al estar en foco
  hoverLiftY: 0.15,         // Elevación sutil al pasar el mouse
  hoverPullZ: 0.25,         // Acercamiento sutil al pasar el mouse
  hoverTiltStrength: 0.12,  // Inclinación sutil hacia el cursor en hover
  dragSensitivity: 0.0022,  // Sensibilidad al arrastrar con clic o touch
  wheelSensitivity: 0.0007, // Sensibilidad de la rueda del ratón
  lerpFactor: 0.08,         // Suavizado del desplazamiento del carrusel
  rotationDamping: 7.5,     // Amortiguación ultra suave para el giro de los discos
}

export default function VinylCatalog3D() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const titleCharsRef = useRef<(HTMLSpanElement | null)[]>([])
  const titleHoverTlRef = useRef<gsap.core.Timeline | null>(null)
  const isTitleIntroDoneRef = useRef<boolean>(false)
  const infoMetaRef = useRef<HTMLDivElement | null>(null)
  const infoTitleRef = useRef<HTMLHeadingElement | null>(null)
  const infoArtistRef = useRef<HTMLParagraphElement | null>(null)
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null)

  const goToVinylRef = useRef<((slotIndex: number) => void) | null>(null)
  const applyCategoryFilterRef = useRef<
    ((categories: VinylCategory[]) => void) | null
  >(null)
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
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState<boolean>(false)

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
        if (isMounted && data && typeof data.promedio === 'number' && data.promedio > 0) {
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

  // Cerrar el multiselect al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  // Animación GSAP de Fade-In general al recargar la página + título superior izquierdo
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
            stagger: 0.025,
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
              stagger: 0.014,
              ease: 'power2.out',
            }
          )
          .to(
            validChars,
            {
              yPercent: 0,
              duration: 0.32,
              stagger: 0.014,
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

  // Animación GSAP cada vez que cambia el vinilo abajo a la izquierda
  useEffect(() => {
    const elements = [
      infoMetaRef.current,
      infoTitleRef.current,
      infoArtistRef.current,
    ].filter((el) => el !== null)

    if (elements.length === 0) return

    gsap.killTweensOf(elements)
    gsap.fromTo(
      elements,
      {
        yPercent: 75,
        opacity: 0,
        skewY: 2.5,
      },
      {
        yPercent: 0,
        opacity: 1,
        skewY: 0,
        duration: 0.48,
        stagger: 0.055,
        ease: 'power3.out',
        overwrite: 'auto',
      }
    )
  }, [currentVinyl.id])

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
    scene.background = new THREE.Color(CONFIG.bgColor)

    const getResponsiveCameraZ = (width: number, height: number) => {
      const aspect = width / Math.max(height, 1)
      if (aspect < 1) {
        return THREE.MathUtils.clamp(8.35 / Math.pow(aspect, 0.52), 8.6, 13.2)
      }
      return 8.35
    }

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    )
    camera.position.set(
      0,
      0.05,
      getResponsiveCameraZ(container.clientWidth, container.clientHeight)
    )

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // =========================================================================
    // 3. ILUMINACIÓN CÁLIDA DE ESTUDIO
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0xfffcf5, 1.85)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xfff8eb, 1.6)
    mainLight.position.set(6, 9, 8)
    mainLight.castShadow = true
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0xf3ede2, 0.9)
    fillLight.position.set(-6, -2, 5)
    scene.add(fillLight)

    // =========================================================================
    // 4. CONSTRUCCIÓN DE LAS CUBIERTAS 3D + POSICIÓN INICIAL ARRIBA A LA DERECHA
    // =========================================================================
    const carouselGroup = new THREE.Group()
    scene.add(carouselGroup)

    const textureLoader = new THREE.TextureLoader()
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

    const sleeveGeometry = new THREE.BoxGeometry(
      CONFIG.coverSize,
      CONFIG.coverSize,
      CONFIG.coverDepth
    )

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
      materials: THREE.MeshStandardMaterial[]
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

    VINYL_CATALOG.forEach((item, index) => {
      const itemGroup = new THREE.Group()

      const basePos = new THREE.Vector3(
        index * CONFIG.spacingX,
        0,
        index * CONFIG.spacingZ
      )
      const baseRot = new THREE.Euler(
        CONFIG.baseRotationX,
        CONFIG.baseRotationY,
        0
      )

      const introState: IntroOffset = {
        offsetX: 8.5 + index * 1.15,
        offsetY: 4.8 + index * 0.55,
        offsetZ: -3.8 - index * 0.65,
        rotX: 0.32,
        rotY: -0.38,
        rotZ: -0.24,
      }

      const initialFocusY = index === 0 ? CONFIG.selectedLiftY : 0
      const initialFocusZ = index === 0 ? CONFIG.selectedPullZ : 0
      const initialRotY =
        index === 0 ? CONFIG.selectedRotationY : baseRot.y

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
      itemGroup.scale.setScalar(0.84)

      const coverTexture = textureLoader.load(encodeURI(item.image))
      coverTexture.colorSpace = THREE.SRGBColorSpace
      coverTexture.anisotropy = maxAnisotropy

      const spineMaterial = new THREE.MeshStandardMaterial({
        color: 0xe2dcd0,
        roughness: 0.75,
        metalness: 0.04,
        transparent: true,
        opacity: 0,
        depthWrite: true,
      })

      const backCoverMaterial = new THREE.MeshStandardMaterial({
        color: 0xd8d1c5,
        roughness: 0.65,
        metalness: 0.05,
        transparent: true,
        opacity: 0,
        depthWrite: true,
      })

      const frontMaterial = new THREE.MeshStandardMaterial({
        map: coverTexture,
        roughness: 0.32,
        metalness: 0.04,
        transparent: true,
        opacity: 0,
        depthWrite: true,
      })

      const materials = [
        spineMaterial,
        spineMaterial,
        spineMaterial,
        spineMaterial,
        frontMaterial,
        backCoverMaterial,
      ]

      const coverMesh = new THREE.Mesh(sleeveGeometry, materials)
      coverMesh.castShadow = true
      coverMesh.receiveShadow = true
      coverMesh.userData = { visibleSlot: index }

      itemGroup.add(coverMesh)
      carouselGroup.add(itemGroup)
      activeInteractiveMeshes.push(coverMesh)

      const uniqueMaterials = [spineMaterial, backCoverMaterial, frontMaterial]

      coverRecords.push({
        group: itemGroup,
        mesh: coverMesh,
        materials: uniqueMaterials,
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

    // =========================================================================
    // 5. ANIMACIÓN DE ENTRADA DESDE LA PARTE SUPERIOR DERECHA CON GSAP
    // =========================================================================
    coverRecords.forEach((record, idx) => {
      const fadeProxy = { opacity: 0 }
      const staggerDelay = 0.08 + idx * 0.085

      gsap.to(fadeProxy, {
        opacity: 1,
        duration: 0.95,
        delay: staggerDelay,
        ease: 'power2.out',
        onUpdate: () => {
          record.materials.forEach((mat) => {
            mat.opacity = fadeProxy.opacity
          })
        },
        onComplete: () => {
          record.materials.forEach((mat) => {
            mat.opacity = 1
            mat.transparent = false
            mat.depthWrite = true
            mat.needsUpdate = true
          })
        },
      })

      gsap.to(record.introState, {
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        duration: 1.45,
        delay: staggerDelay,
        ease: 'expo.out',
      })

      gsap.to(record.group.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.35,
        delay: staggerDelay,
        ease: 'expo.out',
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
      end: () => `+=${window.innerHeight * 2.8}`,
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

    goToVinylRef.current = focusAndSelectVinyl

    // Actualizar en tiempo real qué discos 3D se muestran según el multiselect de categorías
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
            slot * CONFIG.spacingX,
            0,
            slot * CONFIG.spacingZ
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
              ? CONFIG.dragSensitivity * 1.65
              : CONFIG.dragSensitivity

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
        trackState.targetProgress + delta * CONFIG.wheelSensitivity
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
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.getElapsedTime()

      const maxSlot = Math.max(trackState.visibleCount - 1, 0)
      const totalTravelX = maxSlot * CONFIG.spacingX
      const totalTravelZ = maxSlot * CONFIG.spacingZ

      const previousProgress = trackState.currentProgress
      trackState.currentProgress +=
        (trackState.targetProgress - trackState.currentProgress) *
        CONFIG.lerpFactor

      const rawVelocity = trackState.currentProgress - previousProgress
      trackState.smoothVelocity +=
        (rawVelocity - trackState.smoothVelocity) * 0.12

      const currentFloatIndex = trackState.currentProgress * maxSlot
      const currentIdx = Math.round(currentFloatIndex)
      setActiveIndex(currentIdx)

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

          const localPoint = hit.object.worldToLocal(hit.point.clone())
          hoverNormX = localPoint.x / (CONFIG.coverSize * 0.5)
          hoverNormY = localPoint.y / (CONFIG.coverSize * 0.5)
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
          focusWeight * CONFIG.selectedLiftY +
          idleFloatY
        let targetZ =
          record.basePosition.z +
          focusWeight * CONFIG.selectedPullZ +
          idleFloatZ

        if (isHovered) {
          targetY += CONFIG.hoverLiftY
          targetZ += CONFIG.hoverPullZ * (1 - focusWeight * 0.5)
        }

        let targetRotX =
          THREE.MathUtils.lerp(
            record.baseRotation.x,
            CONFIG.selectedRotationX,
            focusWeight
          ) + idleSwayX
        let targetRotY =
          THREE.MathUtils.lerp(
            record.baseRotation.y,
            CONFIG.selectedRotationY,
            focusWeight
          ) +
          idleSwayY +
          dynamicSwing * (1 - focusWeight * 0.35)
        let targetRotZ = -dynamicSwing * 0.14 + idleSwayZ

        if (isHovered) {
          targetRotX -= hoverNormY * CONFIG.hoverTiltStrength
          targetRotY +=
            0.06 * (1 - focusWeight) + hoverNormX * CONFIG.hoverTiltStrength
          targetRotZ -= hoverNormX * 0.025
        }

        record.dampedPos.x = THREE.MathUtils.damp(
          record.dampedPos.x,
          record.basePosition.x,
          CONFIG.rotationDamping,
          delta
        )
        record.dampedPos.y = THREE.MathUtils.damp(
          record.dampedPos.y,
          targetY,
          CONFIG.rotationDamping,
          delta
        )
        record.dampedPos.z = THREE.MathUtils.damp(
          record.dampedPos.z,
          targetZ,
          CONFIG.rotationDamping,
          delta
        )

        record.dampedRot.x = THREE.MathUtils.damp(
          record.dampedRot.x,
          targetRotX,
          CONFIG.rotationDamping,
          delta
        )
        record.dampedRot.y = THREE.MathUtils.damp(
          record.dampedRot.y,
          targetRotY,
          CONFIG.rotationDamping,
          delta
        )
        record.dampedRot.z = THREE.MathUtils.damp(
          record.dampedRot.z,
          targetRotZ,
          CONFIG.rotationDamping,
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

  const titleText = 'Vinyl Covers Archive'
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
        {/* Encabezado responsive con fuente Chillax, Multiselect de Categorías e Icono de Carrito */}
        <header className="relative z-30 shrink-0 flex items-center justify-between gap-2 sm:gap-4 px-4 pt-4 pb-2 sm:px-8 sm:pt-6 sm:pb-3 md:px-14 bg-[#F5F2EB]">
          <div
            onMouseEnter={handleTitleMouseEnter}
            className="cursor-default select-none min-w-0"
          >
            <h1
              className="font-chillax flex flex-wrap text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1B18] overflow-hidden py-0.5"
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
          </div>

          <div className="shrink-0 flex items-center gap-2 sm:gap-3">
            {/* Pequeño Multiselect de Categorías (Por defecto muestra Todos) */}
            {currentView === 'catalog' && (
              <div ref={categoryDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-medium text-[#1C1B18] shadow-xs transition hover:shadow-md hover:bg-neutral-50 cursor-pointer"
                >
                  <span>
                    {selectedCategories.length === 0
                      ? 'Categorías: Todas'
                      : `Categorías (${selectedCategories.length})`}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isCategoryMenuOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {isCategoryMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-black/10 bg-white p-2.5 shadow-lg z-50">
                    <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-black/8">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78736A]">
                        Filtrar Géneros
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="text-[11px] font-medium text-[#1C1B18] underline hover:opacity-70 cursor-pointer"
                      >
                        Ver todos
                      </button>
                    </div>

                    <div className="space-y-1">
                      {ALL_CATEGORIES.map((category) => {
                        const isChecked = selectedCategories.includes(category)
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => toggleCategory(category)}
                            className={`w-full flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                              isChecked
                                ? 'bg-[#1C1B18] text-white'
                                : 'text-[#1C1B18] hover:bg-neutral-100'
                            }`}
                          >
                            <span>{category}</span>
                            <span className="text-[11px]">
                              {isChecked ? '✓' : ''}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navegación contextual con Swup */}
            {currentView !== 'catalog' ? (
              <a
                href="/"
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-medium tracking-wide text-[#1C1B18] shadow-xs transition hover:shadow-md hover:bg-neutral-50 no-underline"
              >
                <span>← Catálogo</span>
              </a>
            ) : (
              <a
                href="/carrito"
                aria-label="Ver Carrito"
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 text-[#1C1B18] shadow-xs transition hover:shadow-md hover:bg-neutral-50 no-underline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-[#1C1B18]"
                  aria-hidden="true"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1C1B18] px-1.5 text-[11px] font-semibold text-white">
                  {totalCartItems}
                </span>
              </a>
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

          {/* Footer inferior responsive */}
          <footer className="relative z-20 shrink-0 flex flex-col md:flex-row items-stretch md:items-end justify-between gap-3 sm:gap-4 px-4 pt-1 pb-4 sm:px-8 sm:pb-6 md:px-14 bg-[#F5F2EB]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-start gap-3 sm:gap-6">
              <div className="min-w-0 sm:min-w-[240px] overflow-hidden">
                <div
                  ref={infoMetaRef}
                  className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#78736A] will-change-transform"
                >
                  <span>{currentVinyl.year}</span>
                  <span>•</span>
                  <span>{currentVinyl.category}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#1C1B18]">
                    ${currentVinyl.price.toFixed(2)} USD
                  </span>
                </div>
                <h2
                  ref={infoTitleRef}
                  className="mt-0.5 text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#1C1B18] truncate will-change-transform"
                >
                  {currentVinyl.title}
                </h2>
                <p
                  ref={infoArtistRef}
                  className="text-xs sm:text-sm text-[#5C5850] truncate will-change-transform"
                >
                  {currentVinyl.artist}
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 sm:flex-initial text-center rounded-full border border-black/10 bg-white px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-medium text-[#1C1B18] shadow-xs transition hover:shadow-md hover:bg-neutral-50 active:scale-[0.98] cursor-pointer"
                >
                  Comprar ahora
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 sm:flex-initial text-center rounded-full border border-black/10 bg-white/80 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-[#1C1B18] shadow-2xs transition hover:bg-white hover:shadow-md active:scale-[0.98] cursor-pointer"
                >
                  Agregar al carrito
                </button>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-2 pt-1 md:pt-0">
              {feedbackMessage && (
                <span className="rounded-full text-[11px] sm:text-xs font-medium text-[#1C1B18] bg-white border border-black/10 px-3.5 py-1 shadow-xs">
                  ✓ {feedbackMessage}
                </span>
              )}

              <div className="flex items-center gap-3 ml-auto md:ml-0">
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-mono font-medium tracking-widest text-[#1C1B18] shadow-2xs">
                  {String(currentSlotPosition).padStart(2, '0')} /{' '}
                  {String(filteredCatalog.length).padStart(2, '0')}
                </span>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {filteredCatalog.map((item, slotIdx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToVinylRef.current?.(slotIdx)}
                      aria-label={`Ir a ${item.title}`}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentVinyl.id === item.id
                          ? 'w-6 sm:w-8 bg-[#1C1B18]'
                          : 'w-2 bg-[#1C1B18]/25 hover:bg-[#1C1B18]/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </footer>
        </div>

        {/* VISTA 2: CARRITO (/carrito) */}
        {currentView === 'cart' && (
          <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4 pt-1 sm:px-8 sm:pb-8 md:px-14 bg-[#F5F2EB] overflow-hidden">
            <div className="w-full max-w-5xl h-full max-h-[85dvh] sm:max-h-[80dvh] flex flex-col rounded-2xl sm:rounded-3xl border border-black/8 bg-white p-4 sm:p-6 md:p-9 shadow-sm overflow-hidden">
              <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-black/8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#1C1B18]">
                  Tu Carrito de Vinilos ({totalCartItems})
                </h2>

                <a
                  href="/"
                  className="self-start sm:self-auto rounded-full border border-black/12 bg-white px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-medium text-[#1C1B18] shadow-2xs hover:bg-neutral-50 hover:shadow-sm transition no-underline"
                >
                  + Seguir explorando
                </a>
              </div>

              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
                  <p className="text-sm sm:text-base font-medium text-[#5C5850]">
                    Tu carrito está vacío actualmente.
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#78736A]">
                    Regresa al catálogo 3D para seleccionar tus ediciones en vinilo.
                  </p>
                  <a
                    href="/"
                    className="mt-5 sm:mt-6 inline-block rounded-full border border-black/12 bg-white px-6 sm:px-7 py-2.5 sm:py-3 text-xs font-semibold text-[#1C1B18] shadow-sm hover:bg-neutral-50 hover:shadow-md transition no-underline"
                  >
                    Ir al Catálogo 3D
                  </a>
                </div>
              ) : (
                <div className="flex-1 min-h-0 mt-4 sm:mt-6 flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-7 overflow-y-auto lg:overflow-hidden">
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
                          <div className="flex items-center rounded-full border border-black/12 bg-white px-1 py-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(vinyl.id, -1)}
                              className="h-7 w-7 rounded-full text-xs font-medium text-[#1C1B18] hover:bg-neutral-100 transition cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 text-xs font-semibold text-[#1C1B18]">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(vinyl.id, 1)}
                              className="h-7 w-7 rounded-full text-xs font-medium text-[#1C1B18] hover:bg-neutral-100 transition cursor-pointer"
                            >
                              +
                            </button>
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
                          <span className="font-medium text-emerald-700">
                            Gratis
                          </span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base font-bold text-[#1C1B18] pt-3 border-t border-black/8">
                          <span>Total</span>
                          <span>${totalCartPrice.toFixed(2)} USD</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      className="mt-4 sm:mt-6 w-full rounded-full border border-black/15 bg-white py-3 sm:py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1C1B18] shadow-sm transition hover:bg-neutral-50 hover:shadow-md active:scale-[0.99] cursor-pointer"
                    >
                      Finalizar Compra
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA 3: CONFIRMACIÓN DE COMPRA (/checkout) CON SWUP */}
        {currentView === 'checkout' && (
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

                <a
                  href="/carrito"
                  className="self-start sm:self-auto rounded-full border border-black/12 bg-white px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-medium text-[#1C1B18] shadow-2xs hover:bg-neutral-50 hover:shadow-sm transition no-underline"
                >
                  ← Volver al Carrito
                </a>
              </div>

              <form
                onSubmit={handleConfirmPurchase}
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
                      onChange={(e) => setCustomerName(e.target.value)}
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
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej. 0412-1234567"
                      className="w-full rounded-2xl border border-black/12 bg-white px-4 py-3 text-sm text-[#1C1B18] placeholder:text-[#78736A]/60 focus:border-[#1C1B18] focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-[#5C5850] mb-2">
                      Tipo de Pago
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(
                        [
                          { id: 'pago_movil', label: 'Pago Móvil' },
                          { id: 'efectivo', label: 'Efectivo' },
                          { id: 'binance', label: 'Binance' },
                        ] as { id: PaymentMethod; label: string }[]
                      ).map((option) => {
                        const isSelected = paymentMethod === option.id
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setPaymentMethod(option.id)}
                            className={`rounded-2xl border px-4 py-3 text-xs sm:text-sm font-medium transition cursor-pointer ${
                              isSelected
                                ? 'border-[#1C1B18] bg-[#1C1B18] text-white shadow-sm'
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

                {/* Resumen final y botón de confirmar */}
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

                  <button
                    type="submit"
                    className="mt-6 w-full rounded-full border border-black/15 bg-white py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1C1B18] shadow-sm transition hover:bg-neutral-50 hover:shadow-md active:scale-[0.99] cursor-pointer"
                  >
                    Confirmar Compra
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
