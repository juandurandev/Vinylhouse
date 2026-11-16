import * as THREE from 'three'

const textureCache = new Map<string, THREE.Texture>()
const pendingLoads = new Map<string, Promise<THREE.Texture>>()

/**
 * Crea una textura de respaldo neutra en caso de error de red
 * para nunca bloquear la visualización del catálogo 3D.
 */
function createFallbackTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#e6dfd3'
    ctx.fillRect(0, 0, 64, 64)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/**
 * Carga y decodifica texturas fuera del hilo principal usando HTMLImageElement + img.decode()
 * para máxima compatibilidad con Safari iOS (WebKit), Chrome y Firefox,
 * pre-subiendo la textura a la GPU sin bloquear la animación.
 */
export function loadOptimizedTexture(
  url: string,
  renderer: THREE.WebGLRenderer,
  maxAnisotropy: number
): Promise<THREE.Texture> {
  const encodedUrl = encodeURI(url)

  const cached = textureCache.get(encodedUrl)
  if (cached) {
    return Promise.resolve(cached)
  }

  const inflight = pendingLoads.get(encodedUrl)
  if (inflight) {
    return inflight
  }

  const loadPromise = new Promise<THREE.Texture>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'

    let settled = false
    const finalize = (texture: THREE.Texture) => {
      if (settled) return
      settled = true
      pendingLoads.delete(encodedUrl)
      resolve(texture)
    }

    const buildWebGLTexture = () => {
      const texture = new THREE.Texture(img)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = Math.min(maxAnisotropy, 4)
      texture.generateMipmaps = true
      texture.minFilter = THREE.LinearMipmapLinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.needsUpdate = true

      try {
        renderer.initTexture(texture)
      } catch {
        // Safari iOS subirá la textura automáticamente en el siguiente render
      }

      textureCache.set(encodedUrl, texture)
      finalize(texture)
    }

    img.onload = () => {
      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(buildWebGLTexture)
          .catch(buildWebGLTexture)
      } else {
        buildWebGLTexture()
      }
    }

    img.onerror = () => {
      finalize(createFallbackTexture())
    }

    img.src = encodedUrl
  })

  pendingLoads.set(encodedUrl, loadPromise)
  return loadPromise
}
