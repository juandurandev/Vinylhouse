import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export interface VinylItem {
  id: number
  title: string
  artist: string
  year: string
  image: string
}

// Catálogo usando las portadas reales en /public/images
export const VINYL_CATALOG: VinylItem[] = [
  {
    id: 1,
    title: 'Appetite For Destruction',
    artist: "Guns N' Roses",
    year: '1987',
    image: "/images/Appetite For Destruction Guns N' Roses.jpg",
  },
  {
    id: 2,
    title: 'ASTROWORLD',
    artist: 'Travis Scott',
    year: '2018',
    image: '/images/ASTROWORLD Travis Scott.jpg',
  },
  {
    id: 3,
    title: 'Blonde',
    artist: 'Frank Ocean',
    year: '2016',
    image: '/images/Blonde by Frank Ocean.jpg',
  },
  {
    id: 4,
    title: 'Dangerous',
    artist: 'Michael Jackson',
    year: '1991',
    image: '/images/Dangerous Michael Jackson.jpg',
  },
  {
    id: 5,
    title: 'Starboy',
    artist: 'The Weeknd',
    year: '2016',
    image: '/images/Starboy The Weeknd.jpg',
  },
  {
    id: 6,
    title: 'Thriller',
    artist: 'Michael Jackson',
    year: '1982',
    image: '/images/Thriller Michael Jackson.jpg',
  },
  {
    id: 7,
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    year: '2022',
    image: '/images/Un Verano Sin Ti Bad Bunny.jpg',
  },
  {
    id: 8,
    title: 'Views',
    artist: 'Drake',
    year: '2016',
    image: '/images/Views Drake.jpg',
  },
]

// ============================================================================
// CONFIGURACIÓN CENTRAL DEL CARRUSEL 3D (Tamaño Medio + Fade In + Click Focus)
// ============================================================================
const CONFIG = {
  bgColor: 0xf5f2eb,        // Color crema cálido (#F5F2EB)
  coverSize: 3.25,          // Tamaño medio equilibrado para las portadas
  coverDepth: 0.11,         // Grosor 3D de la cubierta (cajita con volumen)
  spacingX: 2.65,           // Separación horizontal entre portadas
  spacingZ: -0.6,           // Profundidad escalonada de derecha a izquierda
  baseRotationY: -0.45,     // Inclinación en eje Y para mostrar volumen y perspectiva
  baseRotationX: 0.05,      // Inclinación ligera en eje X
  hoverLiftY: 0.16,         // Elevación sutil al pasar el mouse
  hoverPullZ: 0.28,         // Acercamiento sutil al pasar el mouse
  hoverTiltStrength: 0.14,  // Inclinación sutil hacia el cursor en hover
  dragSensitivity: 0.0022,  // Sensibilidad al arrastrar con clic izquierdo
  wheelSensitivity: 0.0007, // Sensibilidad de la rueda del ratón sobre la sección
  lerpFactor: 0.085,        // Suavizado (inercia) del movimiento del carrusel
}

export default function VinylCatalog3D() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const goToVinylRef = useRef<((index: number) => void) | null>(null)
  const [hoveredVinyl, setHoveredVinyl] = useState<VinylItem | null>(null)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isDraggingUI, setIsDraggingUI] = useState<boolean>(false)

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
    scene.fog = new THREE.FogExp2(CONFIG.bgColor, 0.028)

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    // Distancia media para ver la portada principal y las adyacentes en proporción equilibrada
    camera.position.set(0, 0.1, 8.6)

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
    // 4. CONSTRUCCIÓN DE LAS CUBIERTAS 3D + MATERIALES CON SOPORTE FADE-IN
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

    interface CoverRecord {
      group: THREE.Group
      mesh: THREE.Mesh
      materials: THREE.MeshStandardMaterial[]
      basePosition: THREE.Vector3
      baseRotation: THREE.Euler
      introState: { opacity: number; offsetY: number }
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

      // Estado inicial para la animación de Fade-In al aparecer en pantalla
      const introState = { opacity: 0, offsetY: -0.55 }
      itemGroup.position.set(basePos.x, basePos.y + introState.offsetY, basePos.z)
      itemGroup.rotation.copy(baseRot)
      itemGroup.scale.setScalar(0.92)

      const coverTexture = textureLoader.load(encodeURI(item.image))
      coverTexture.colorSpace = THREE.SRGBColorSpace
      coverTexture.anisotropy = maxAnisotropy

      // Materiales individuales con transparent: true para permitir el efecto Fade-In
      const spineMaterial = new THREE.MeshStandardMaterial({
        color: 0xe2dcd0,
        roughness: 0.75,
        metalness: 0.04,
        transparent: true,
        opacity: 0,
      })

      const backCoverMaterial = new THREE.MeshStandardMaterial({
        color: 0xd8d1c5,
        roughness: 0.65,
        metalness: 0.05,
        transparent: true,
        opacity: 0,
      })

      const frontMaterial = new THREE.MeshStandardMaterial({
        map: coverTexture,
        roughness: 0.32,
        metalness: 0.04,
        transparent: true,
        opacity: 0,
      })

      // Caras de BoxGeometry: [derecha, izquierda, arriba, abajo, frente, atrás]
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
        introState,
        item,
        index,
      })
    })

    // =========================================================================
    // 5. ANIMACIÓN FADE-IN ESCALONADA AL APARECER EN PANTALLA
    // =========================================================================
    coverRecords.forEach((record, idx) => {
      gsap.to(record.introState, {
        opacity: 1,
        offsetY: 0,
        duration: 1.15,
        delay: 0.12 + idx * 0.09,
        ease: 'power3.out',
      })

      gsap.to(record.group.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.15,
        delay: 0.12 + idx * 0.09,
        ease: 'power3.out',
      })
    })

    // =========================================================================
    // 6. ESTADO COMPARTIDO: SCROLL + CLICK & DRAG + CLICK DIRECTO A VINILO
    // =========================================================================
    const totalTravelX = (VINYL_CATALOG.length - 1) * CONFIG.spacingX
    const totalTravelZ = (VINYL_CATALOG.length - 1) * CONFIG.spacingZ

    const trackState = {
      targetProgress: 0,
      currentProgress: 0,
      velocity: 0,
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
        lenis.scrollTo(targetScrollY, { duration: 1.05 })
      }
    }

    // Función para ir directamente a un vinilo al hacer clic sobre él
    const focusVinylByIndex = (targetIndex: number) => {
      const targetProgress =
        VINYL_CATALOG.length > 1
          ? targetIndex / (VINYL_CATALOG.length - 1)
          : 0
      setClampedProgress(targetProgress)
      syncScrollToProgress(targetProgress, false)
    }

    goToVinylRef.current = focusVinylByIndex

    // =========================================================================
    // 7. EVENTOS DE INTERACCIÓN: HOVER, DRAG, CLICK DIRECTO Y WHEEL
    // =========================================================================
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(-999, -999)
    let hoveredIndex: number | null = null

    const updateNormalizedPointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
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
      updateNormalizedPointer(e.clientX, e.clientY)
      trackState.isPointerInside = true

      if (trackState.isDragging) {
        const deltaX = e.clientX - trackState.dragStartX
        const deltaY = e.clientY - trackState.dragStartY

        // Si se desplaza más de 5px se considera arrastre (drag), no un clic simple
        if (Math.hypot(deltaX, deltaY) > 5) {
          trackState.hasMovedDuringDrag = true
          setIsDraggingUI(true)
          container.style.cursor = 'grabbing'

          const nextProgress =
            trackState.dragStartProgress - deltaX * CONFIG.dragSensitivity
          setClampedProgress(nextProgress)
          syncScrollToProgress(trackState.targetProgress, true)
        }
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!trackState.isDragging) return

      const wasClick = !trackState.hasMovedDuringDrag
      trackState.isDragging = false
      setIsDraggingUI(false)

      // Si fue un clic limpio (sin arrastrar), comprobamos si hizo clic sobre un vinilo
      if (wasClick) {
        updateNormalizedPointer(e.clientX, e.clientY)
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObjects(interactiveMeshes, false)
        if (intersects.length > 0) {
          const clickedIndex = intersects[0].object.userData.vinylIndex as number
          focusVinylByIndex(clickedIndex)
        }
      }

      container.style.cursor = hoveredIndex !== null ? 'pointer' : 'grab'
    }

    const onPointerLeave = () => {
      trackState.isPointerInside = false
      pointer.set(-999, -999)
      hoveredIndex = null
      setHoveredVinyl(null)
      if (trackState.isDragging) {
        trackState.isDragging = false
        setIsDraggingUI(false)
      }
      container.style.cursor = 'grab'
    }

    const onWheel = (e: WheelEvent) => {
      if (!trackState.isPointerInside) return
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const nextProgress =
        trackState.targetProgress + delta * CONFIG.wheelSensitivity
      setClampedProgress(nextProgress)
    }

    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    container.addEventListener('pointerleave', onPointerLeave)
    container.addEventListener('wheel', onWheel, { passive: true })

    // =========================================================================
    // 8. BUCLE DE ANIMACIÓN Y RENDERIZADO
    // =========================================================================
    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const previousProgress = trackState.currentProgress
      trackState.currentProgress +=
        (trackState.targetProgress - trackState.currentProgress) *
        CONFIG.lerpFactor

      trackState.velocity = trackState.currentProgress - previousProgress

      const currentFloatIndex =
        trackState.currentProgress * (VINYL_CATALOG.length - 1)
      const currentIdx = Math.round(currentFloatIndex)
      setActiveIndex(currentIdx)

      // Mover el grupo del carrusel de derecha a izquierda
      carouselGroup.position.x = -trackState.currentProgress * totalTravelX
      carouselGroup.position.z = -trackState.currentProgress * totalTravelZ

      // Actualizar opacidad de cada portada (Fade-In inicial + atenuación suave en los bordes lejanos)
      coverRecords.forEach((record) => {
        const distanceFromFocus = Math.abs(record.index - currentFloatIndex)
        const viewportFade = THREE.MathUtils.clamp(
          1.15 - distanceFromFocus * 0.22,
          0.18,
          1
        )
        const finalOpacity = record.introState.opacity * viewportFade
        record.materials.forEach((mat) => {
          mat.opacity = finalOpacity
        })
      })

      // Detección de Hover con Raycaster
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
          const normX = localPoint.x / (CONFIG.coverSize * 0.5)
          const normY = localPoint.y / (CONFIG.coverSize * 0.5)

          coverRecords.forEach((record) => {
            if (record.index === hoveredIndex) {
              gsap.to(record.group.position, {
                x: record.basePosition.x,
                y:
                  record.basePosition.y +
                  record.introState.offsetY +
                  CONFIG.hoverLiftY,
                z: record.basePosition.z + CONFIG.hoverPullZ,
                duration: 0.4,
                ease: 'power2.out',
                overwrite: 'auto',
              })

              gsap.to(record.group.rotation, {
                x: record.baseRotation.x - normY * CONFIG.hoverTiltStrength,
                y:
                  record.baseRotation.y +
                  0.08 +
                  normX * CONFIG.hoverTiltStrength,
                z: -normX * 0.025,
                duration: 0.4,
                ease: 'power2.out',
                overwrite: 'auto',
              })
            } else {
              resetCoverTransform(record, trackState.velocity)
            }
          })
        } else {
          if (hoveredIndex !== null) {
            hoveredIndex = null
            setHoveredVinyl(null)
            container.style.cursor = 'grab'
          }
          coverRecords.forEach((record) =>
            resetCoverTransform(record, trackState.velocity)
          )
        }
      } else {
        coverRecords.forEach((record) =>
          resetCoverTransform(record, trackState.velocity)
        )
      }

      renderer.render(scene, camera)
    }

    function resetCoverTransform(record: CoverRecord, velocity: number) {
      const dynamicSwing = THREE.MathUtils.clamp(velocity * 14, -0.18, 0.18)

      gsap.to(record.group.position, {
        x: record.basePosition.x,
        y: record.basePosition.y + record.introState.offsetY,
        z: record.basePosition.z,
        duration: 0.55,
        ease: 'power3.out',
        overwrite: 'auto',
      })

      gsap.to(record.group.rotation, {
        x: record.baseRotation.x,
        y: record.baseRotation.y + dynamicSwing,
        z: -dynamicSwing * 0.15,
        duration: 0.55,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }

    animate()

    // =========================================================================
    // 9. RESPONSIVE RESIZE
    // =========================================================================
    const onResize = () => {
      if (!container) return
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

  const currentVinyl = hoveredVinyl ?? VINYL_CATALOG[activeIndex]

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-[#F5F2EB] text-[#1C1B18] select-none"
    >
      {/* Encabezado minimalista editorial */}
      <header className="pointer-events-none absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-7 md:px-14">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.28em] text-[#78736A]">
            Vinilhouse • Selección Editorial
          </span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1C1B18] md:text-4xl">
            Vinyl Covers Archive
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-3 rounded-full border border-[#1C1B18]/12 bg-white/60 px-4 py-2 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-[#1C1B18]" />
          <span className="text-xs font-mono tracking-wider text-[#4A4740]">
            {isDraggingUI
              ? 'ARRASTRANDO CARRUSEL...'
              : 'CLIC EN UN VINILO, ARRASTRA O HAZ SCROLL'}
          </span>
        </div>
      </header>

      {/* Contenedor del Canvas WebGL Three.js */}
      <div
        ref={canvasContainerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label="Catálogo 3D interactivo de portadas de vinilos"
      />

      {/* Pie de página con información de la portada activa */}
      <footer className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 px-8 py-8 md:px-14">
        <div className="rounded-2xl border border-[#1C1B18]/10 bg-white/75 px-6 py-4 shadow-sm backdrop-blur-md transition-all duration-300">
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-[#78736A]">
            <span>
              {String(currentVinyl.id).padStart(2, '0')} /{' '}
              {String(VINYL_CATALOG.length).padStart(2, '0')}
            </span>
            <span>•</span>
            <span>{currentVinyl.year}</span>
          </div>
          <h2 className="mt-1 text-xl md:text-3xl font-bold tracking-tight text-[#1C1B18]">
            {currentVinyl.title}
          </h2>
          <p className="text-sm md:text-base text-[#5C5850]">
            {currentVinyl.artist}
          </p>
        </div>

        {/* Indicadores de posición del carrusel (también clicables) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {VINYL_CATALOG.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goToVinylRef.current?.(idx)}
              aria-label={`Ir a ${item.title}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                (hoveredVinyl ? hoveredVinyl.id === item.id : activeIndex === idx)
                  ? 'w-8 bg-[#1C1B18]'
                  : 'w-2 bg-[#1C1B18]/25 hover:bg-[#1C1B18]/50'
              }`}
            />
          ))}
        </div>
      </footer>
    </section>
  )
}
