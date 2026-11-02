import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Swup from 'swup'

gsap.registerPlugin(ScrollTrigger)

export interface VinylItem {
  id: number
  title: string
  artist: string
  year: string
  price: number
  image: string
}

export interface CartEntry {
  vinyl: VinylItem
  quantity: number
}

// Catálogo usando las portadas reales en /public/images
export const VINYL_CATALOG: VinylItem[] = [
  {
    id: 1,
    title: 'Appetite For Destruction',
    artist: "Guns N' Roses",
    year: '1987',
    price: 36.0,
    image: "/images/Appetite For Destruction Guns N' Roses.jpg",
  },
  {
    id: 2,
    title: 'ASTROWORLD',
    artist: 'Travis Scott',
    year: '2018',
    price: 39.5,
    image: '/images/ASTROWORLD Travis Scott.jpg',
  },
  {
    id: 3,
    title: 'Blonde',
    artist: 'Frank Ocean',
    year: '2016',
    price: 45.0,
    image: '/images/Blonde by Frank Ocean.jpg',
  },
  {
    id: 4,
    title: 'Dangerous',
    artist: 'Michael Jackson',
    year: '1991',
    price: 38.0,
    image: '/images/Dangerous Michael Jackson.jpg',
  },
  {
    id: 5,
    title: 'Starboy',
    artist: 'The Weeknd',
    year: '2016',
    price: 37.5,
    image: '/images/Starboy The Weeknd.jpg',
  },
  {
    id: 6,
    title: 'Thriller',
    artist: 'Michael Jackson',
    year: '1982',
    price: 35.0,
    image: '/images/Thriller Michael Jackson.jpg',
  },
  {
    id: 7,
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    year: '2022',
    price: 42.0,
    image: '/images/Un Verano Sin Ti Bad Bunny.jpg',
  },
  {
    id: 8,
    title: 'Views',
    artist: 'Drake',
    year: '2016',
    price: 38.5,
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
  dragSensitivity: 0.002,   // Sensibilidad al arrastrar con clic izquierdo
  wheelSensitivity: 0.0007, // Sensibilidad de la rueda del ratón
  lerpFactor: 0.08,         // Suavizado del desplazamiento del carrusel
  rotationDamping: 7.5,     // Amortiguación ultra suave para el giro de los discos
}

export default function VinylCatalog3D() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const subtitleRef = useRef<HTMLSpanElement | null>(null)
  const titleCharsRef = useRef<(HTMLSpanElement | null)[]>([])
  const infoMetaRef = useRef<HTMLDivElement | null>(null)
  const infoTitleRef = useRef<HTMLHeadingElement | null>(null)
  const infoArtistRef = useRef<HTMLParagraphElement | null>(null)
  const goToVinylRef = useRef<((index: number) => void) | null>(null)
  const swupRef = useRef<Swup | null>(null)

  const [hoveredVinyl, setHoveredVinyl] = useState<VinylItem | null>(null)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0)

  // Estado del carrito y vista controlada por Swup (/ vs /carrito)
  const [cartItems, setCartItems] = useState<CartEntry[]>([])
  const [isCartView, setIsCartView] = useState<boolean>(() =>
    window.location.pathname.includes('/carrito')
  )
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const currentVinyl =
    hoveredVinyl ??
    (selectedIndex !== null
      ? VINYL_CATALOG[selectedIndex]
      : VINYL_CATALOG[activeIndex])

  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg)
    window.setTimeout(() => {
      setFeedbackMessage((prev) => (prev === msg ? null : prev))
    }, 2200)
  }

  // ===========================================================================
  // INICIALIZACIÓN DE SWUP PARA LA TRANSICIÓN DE PÁGINA AL CARRITO (/carrito)
  // ===========================================================================
  useEffect(() => {
    const swup = new Swup({
      containers: ['#swup'],
      animationSelector: '[class*="transition-"]',
      animateHistoryBrowsing: true,
      cache: false,
    })

    // En una SPA con React, interceptamos la carga y el reemplazo de DOM de Swup
    // para que Swup ejecute sus transiciones de salida/entrada (.is-changing, .is-animating)
    // y cambie la vista entre el Catálogo 3D (/) y la página del Carrito (/carrito).
    swup.hooks.replace('page:load', async (visit) => {
      return {
        url: visit.to.url,
        html: '',
      }
    })

    swup.hooks.replace('content:replace', async (visit) => {
      const goingToCart = visit.to.url.includes('/carrito')
      setIsCartView(goingToCart)
    })

    swupRef.current = swup

    return () => {
      swup.destroy()
      swupRef.current = null
    }
  }, [])

  // Animación GSAP para el título superior izquierdo (entrada + hover)
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          { yPercent: 120, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            delay: 0.1,
          }
        )
      }

      const validChars = titleCharsRef.current.filter(
        (el): el is HTMLSpanElement => el !== null
      )
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
            duration: 0.95,
            stagger: 0.028,
            ease: 'power4.out',
            delay: 0.18,
          }
        )
      }
    })

    return () => ctx.revert()
  }, [])

  // Animación GSAP cada vez que cambia el nombre del vinilo abajo a la izquierda
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

  const handleTitleMouseEnter = () => {
    const validChars = titleCharsRef.current.filter(
      (el): el is HTMLSpanElement => el !== null
    )
    gsap.to(validChars, {
      yPercent: -12,
      duration: 0.28,
      stagger: 0.018,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      overwrite: 'auto',
    })
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

    lenis.on('scroll', ScrollTrigger.update)

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(updateLenis)
    gsap.ticker.lagSmoothing(0)

    // =========================================================================
    // 2. ESCENA THREE.JS, CÁMARA Y RENDERER (Fondo Crema #F5F2EB)
    // =========================================================================
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(CONFIG.bgColor)

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 0.05, 8.35)

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
    }

    const coverRecords: CoverRecord[] = []
    const interactiveMeshes: THREE.Object3D[] = []

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
      coverMesh.userData = { vinylIndex: index }

      itemGroup.add(coverMesh)
      carouselGroup.add(itemGroup)
      interactiveMeshes.push(coverMesh)

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
    // 6. ESTADO COMPARTIDO: SCROLL + DRAG + SELECCIÓN CON GIRO SUAVE
    // =========================================================================
    const totalTravelX = (VINYL_CATALOG.length - 1) * CONFIG.spacingX
    const totalTravelZ = (VINYL_CATALOG.length - 1) * CONFIG.spacingZ

    const trackState = {
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

    const syncScrollToProgress = (progress: number, immediate = true) => {
      const start = scrollTriggerInstance.start
      const end = scrollTriggerInstance.end
      const targetScrollY = start + progress * (end - start)
      if (immediate) {
        lenis.scrollTo(targetScrollY, { immediate: true })
      } else {
        lenis.scrollTo(targetScrollY, { duration: 1.0 })
      }
    }

    const focusAndSelectVinyl = (targetIndex: number) => {
      trackState.selectedIdx = targetIndex
      setSelectedIndex(targetIndex)
      setActiveIndex(targetIndex)

      const targetProgress =
        VINYL_CATALOG.length > 1
          ? targetIndex / (VINYL_CATALOG.length - 1)
          : 0
      setClampedProgress(targetProgress)
      syncScrollToProgress(targetProgress, false)
    }

    goToVinylRef.current = focusAndSelectVinyl

    // =========================================================================
    // 7. EVENTOS DE INTERACCIÓN SOLO DENTRO DEL ÁREA DEL CANVAS 3D
    // =========================================================================
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(-999, -999)
    let hoveredIndex: number | null = null

    const updateNormalizedPointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
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

          const nextProgress =
            trackState.dragStartProgress - deltaX * CONFIG.dragSensitivity
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
        const intersects = raycaster.intersectObjects(interactiveMeshes, false)
        if (intersects.length > 0) {
          const clickedIndex = intersects[0].object.userData.vinylIndex as number
          focusAndSelectVinyl(clickedIndex)
        }
      } else {
        const nearestIdx = Math.round(
          trackState.targetProgress * (VINYL_CATALOG.length - 1)
        )
        trackState.selectedIdx = nearestIdx
        setSelectedIndex(nearestIdx)
      }

      container.style.cursor = hoveredIndex !== null ? 'pointer' : 'grab'
    }

    const onPointerLeave = () => {
      trackState.isPointerInside = false
      pointer.set(-999, -999)
      hoveredIndex = null
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
        trackState.targetProgress * (VINYL_CATALOG.length - 1)
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
    // 8. BUCLE DE ANIMACIÓN CON INTERPOLACIÓN CONTINUA + TRAYECTORIA INTRO 3D
    // =========================================================================
    let animationFrameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.05)

      const previousProgress = trackState.currentProgress
      trackState.currentProgress +=
        (trackState.targetProgress - trackState.currentProgress) *
        CONFIG.lerpFactor

      const rawVelocity = trackState.currentProgress - previousProgress
      trackState.smoothVelocity +=
        (rawVelocity - trackState.smoothVelocity) * 0.12

      const currentFloatIndex =
        trackState.currentProgress * (VINYL_CATALOG.length - 1)
      const currentIdx = Math.round(currentFloatIndex)
      setActiveIndex(currentIdx)

      carouselGroup.position.x = -trackState.currentProgress * totalTravelX
      carouselGroup.position.z = -trackState.currentProgress * totalTravelZ

      let hoverNormX = 0
      let hoverNormY = 0

      if (!trackState.hasMovedDuringDrag && trackState.isPointerInside) {
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(interactiveMeshes, false)

        if (intersects.length > 0) {
          const hit = intersects[0]
          const hitIndex = hit.object.userData.vinylIndex as number

          if (hoveredIndex !== hitIndex) {
            hoveredIndex = hitIndex
            setHoveredVinyl(VINYL_CATALOG[hitIndex])
            container.style.cursor = 'pointer'
          }

          const localPoint = hit.object.worldToLocal(hit.point.clone())
          hoverNormX = localPoint.x / (CONFIG.coverSize * 0.5)
          hoverNormY = localPoint.y / (CONFIG.coverSize * 0.5)
        } else if (hoveredIndex !== null) {
          hoveredIndex = null
          setHoveredVinyl(null)
          container.style.cursor = 'grab'
        }
      } else if (hoveredIndex !== null) {
        hoveredIndex = null
        setHoveredVinyl(null)
      }

      const dynamicSwing = THREE.MathUtils.clamp(
        trackState.smoothVelocity * 11,
        -0.22,
        0.22
      )

      coverRecords.forEach((record) => {
        const focusWeight =
          trackState.selectedIdx !== null
            ? record.index === trackState.selectedIdx
              ? 1
              : 0
            : THREE.MathUtils.smoothstep(
                1 - Math.min(Math.abs(record.index - currentFloatIndex), 1),
                0,
                1
              )

        const isHovered = record.index === hoveredIndex

        let targetY =
          record.basePosition.y + focusWeight * CONFIG.selectedLiftY
        let targetZ =
          record.basePosition.z + focusWeight * CONFIG.selectedPullZ

        if (isHovered) {
          targetY += CONFIG.hoverLiftY
          targetZ += CONFIG.hoverPullZ * (1 - focusWeight * 0.5)
        }

        let targetRotX = THREE.MathUtils.lerp(
          record.baseRotation.x,
          CONFIG.selectedRotationX,
          focusWeight
        )
        let targetRotY =
          THREE.MathUtils.lerp(
            record.baseRotation.y,
            CONFIG.selectedRotationY,
            focusWeight
          ) +
          dynamicSwing * (1 - focusWeight * 0.35)
        let targetRotZ = -dynamicSwing * 0.14

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
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
        return
      }
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
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
      gsap.ticker.remove(updateLenis)
      lenis.destroy()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

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

  // Navega al carrito usando Swup
  const handleBuyNow = () => {
    addVinylToCart(currentVinyl)
    if (swupRef.current) {
      swupRef.current.navigate('/carrito')
    } else {
      setIsCartView(true)
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

  const titleText = 'Vinyl Covers Archive'

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col w-full h-screen overflow-hidden bg-[#F5F2EB] text-[#1C1B18]"
    >
      {/* Contenedor principal gestionado por Swup (#swup + .transition-swup) */}
      <div
        id="swup"
        className="transition-swup relative flex flex-col w-full h-full overflow-hidden"
      >
        {/* Encabezado compartido con enlaces interceptados por Swup */}
        <header className="relative z-20 shrink-0 flex items-center justify-between px-8 pt-6 pb-3 md:px-14 bg-[#F5F2EB]">
          <div
            onMouseEnter={handleTitleMouseEnter}
            className="cursor-default select-none"
          >
            <div className="overflow-hidden">
              <span
                ref={subtitleRef}
                className="block text-xs font-mono uppercase tracking-[0.28em] text-[#78736A]"
              >
                Vinilhouse • Selección Editorial
              </span>
            </div>

            <h1
              className="mt-1 flex flex-wrap text-2xl font-semibold tracking-tight text-[#1C1B18] md:text-4xl overflow-hidden"
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

          <div className="flex items-center gap-4">
            {/* Enlace nativo <a> interceptado por Swup para alternar entre / y /carrito */}
            {isCartView ? (
              <a
                href="/"
                className="flex items-center gap-3 border border-[#1C1B18] bg-[#1C1B18] px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-[#F5F2EB] transition hover:bg-[#33312B] no-underline"
              >
                <span>← Volver al Catálogo</span>
              </a>
            ) : (
              <a
                href="/carrito"
                className="flex items-center gap-3 border border-[#1C1B18] bg-white px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-[#1C1B18] transition hover:bg-[#1C1B18] hover:text-[#F5F2EB] no-underline"
              >
                <span>Ver Carrito</span>
                <span className="flex h-5 min-w-5 items-center justify-center bg-[#1C1B18] px-1.5 text-[11px] font-bold text-[#F5F2EB]">
                  {totalCartItems}
                </span>
              </a>
            )}
          </div>
        </header>

        {/* VISTA 1: CATÁLOGO 3D (Se mantiene montado para conservar el estado WebGL) */}
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            isCartView ? 'hidden' : 'flex'
          }`}
        >
          {/* Área exclusiva de Drag & 3D */}
          <div
            ref={canvasContainerRef}
            className="relative flex-1 w-full min-h-0 cursor-grab active:cursor-grabbing select-none"
            aria-label="Catálogo 3D interactivo de portadas de vinilos"
          />

          {/* Footer inferior cuadrado con animación GSAP al cambiar el nombre del vinilo */}
          <footer className="relative z-20 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-8 pt-2 pb-6 md:px-14 bg-[#F5F2EB]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-7 w-full md:w-auto justify-between md:justify-start">
              <div className="min-w-[270px] overflow-hidden">
                <div
                  ref={infoMetaRef}
                  className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-[#78736A] will-change-transform"
                >
                  <span>
                    {String(currentVinyl.id).padStart(2, '0')} /{' '}
                    {String(VINYL_CATALOG.length).padStart(2, '0')}
                  </span>
                  <span>•</span>
                  <span>{currentVinyl.year}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#1C1B18]">
                    ${currentVinyl.price.toFixed(2)} USD
                  </span>
                </div>
                <h2
                  ref={infoTitleRef}
                  className="mt-0.5 text-xl md:text-2xl font-bold tracking-tight text-[#1C1B18] will-change-transform"
                >
                  {currentVinyl.title}
                </h2>
                <p
                  ref={infoArtistRef}
                  className="text-sm text-[#5C5850] will-change-transform"
                >
                  {currentVinyl.artist}
                </p>
              </div>

              {/* Botones cuadrados de acción */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="rounded-none bg-[#1C1B18] px-6 py-3 text-xs md:text-sm font-mono uppercase tracking-wider text-[#F5F2EB] transition hover:bg-[#33312B] active:translate-y-0.5 cursor-pointer"
                >
                  Comprar ahora
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="rounded-none border border-[#1C1B18] bg-white px-5 py-3 text-xs md:text-sm font-mono uppercase tracking-wider text-[#1C1B18] transition hover:bg-[#1C1B18] hover:text-[#F5F2EB] active:translate-y-0.5 cursor-pointer"
                >
                  Agregar al carrito
                </button>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 self-end md:self-center">
              {feedbackMessage && (
                <span className="rounded-none text-xs font-mono text-[#1C1B18] bg-white border border-[#1C1B18] px-3 py-1.5">
                  ✓ {feedbackMessage}
                </span>
              )}

              {/* Indicadores cuadrados de posición del carrusel */}
              <div className="flex items-center gap-2">
                {VINYL_CATALOG.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToVinylRef.current?.(idx)}
                    aria-label={`Ir a ${item.title}`}
                    className={`h-2 rounded-none transition-all duration-300 cursor-pointer ${
                      (
                        hoveredVinyl
                          ? hoveredVinyl.id === item.id
                          : (selectedIndex ?? activeIndex) === idx
                      )
                        ? 'w-8 bg-[#1C1B18]'
                        : 'w-2 bg-[#1C1B18]/25 hover:bg-[#1C1B18]/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </footer>
        </div>

        {/* VISTA 2: PÁGINA DEL CARRITO (/carrito) TRANSICIONADA CON SWUP */}
        {isCartView && (
          <div className="flex-1 overflow-y-auto px-8 py-6 md:px-14 bg-[#F5F2EB]">
            <div className="mx-auto max-w-5xl border border-[#1C1B18] bg-white p-6 md:p-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#1C1B18]/20">
                <div>
                  <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#78736A]">
                    Swup Page Transition • /carrito
                  </span>
                  <h2 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-[#1C1B18]">
                    Tu Carrito de Vinilos ({totalCartItems})
                  </h2>
                </div>

                <a
                  href="/"
                  className="self-start sm:self-auto border border-[#1C1B18] bg-[#F5F2EB] px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#1C1B18] hover:bg-[#1C1B18] hover:text-[#F5F2EB] transition no-underline"
                >
                  + Seguir explorando
                </a>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-base font-mono text-[#5C5850]">
                    Tu carrito está vacío actualmente.
                  </p>
                  <p className="mt-2 text-sm text-[#78736A]">
                    Regresa al catálogo 3D para seleccionar tus ediciones en vinilo.
                  </p>
                  <a
                    href="/"
                    className="mt-6 inline-block border border-[#1C1B18] bg-[#1C1B18] px-6 py-3 text-xs font-mono uppercase tracking-widest text-[#F5F2EB] hover:bg-[#33312B] transition no-underline"
                  >
                    Ir al Catálogo 3D
                  </a>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Lista de discos en el carrito */}
                  <div className="lg:col-span-2 space-y-4">
                    {cartItems.map(({ vinyl, quantity }) => (
                      <div
                        key={vinyl.id}
                        className="flex items-center justify-between gap-4 border border-[#1C1B18]/25 bg-[#F5F2EB]/45 p-4"
                      >
                        <img
                          src={vinyl.image}
                          alt={vinyl.title}
                          className="h-20 w-20 object-cover border border-[#1C1B18]/20 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-mono uppercase tracking-widest text-[#78736A]">
                            Edición {vinyl.year}
                          </span>
                          <h3 className="text-base font-bold truncate text-[#1C1B18]">
                            {vinyl.title}
                          </h3>
                          <p className="text-xs text-[#5C5850] truncate">
                            {vinyl.artist}
                          </p>
                          <p className="mt-1 text-xs font-mono font-semibold text-[#1C1B18]">
                            ${vinyl.price.toFixed(2)} USD c/u
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center border border-[#1C1B18] bg-white">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(vinyl.id, -1)}
                              className="px-3 py-1 text-xs font-mono hover:bg-[#1C1B18] hover:text-[#F5F2EB] transition cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-xs font-mono border-x border-[#1C1B18]">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(vinyl.id, 1)}
                              className="px-3 py-1 text-xs font-mono hover:bg-[#1C1B18] hover:text-[#F5F2EB] transition cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#1C1B18]">
                            Subtotal: ${(vinyl.price * quantity).toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen de compra */}
                  <div className="border border-[#1C1B18] bg-[#F5F2EB] p-6 flex flex-col justify-between h-fit">
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-[#1C1B18] pb-3 border-b border-[#1C1B18]/20">
                        Resumen del Pedido
                      </h3>
                      <div className="mt-4 space-y-2.5 text-xs font-mono">
                        <div className="flex justify-between text-[#5C5850]">
                          <span>Unidades</span>
                          <span>{totalCartItems} vinilos</span>
                        </div>
                        <div className="flex justify-between text-[#5C5850]">
                          <span>Envío protegido</span>
                          <span>GRATIS</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-[#1C1B18] pt-3 border-t border-[#1C1B18]/20">
                          <span>Total</span>
                          <span>${totalCartPrice.toFixed(2)} USD</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCartItems([])
                        triggerFeedback('¡Orden procesada con éxito!')
                        swupRef.current?.navigate('/')
                      }}
                      className="mt-6 w-full rounded-none bg-[#1C1B18] py-3.5 text-xs font-mono uppercase tracking-widest text-[#F5F2EB] transition hover:bg-[#33312B] cursor-pointer"
                    >
                      Finalizar Compra
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
