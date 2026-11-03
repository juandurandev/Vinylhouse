import * as THREE from 'three'

const textureCache = new Map<string, THREE.Texture>()

/**
 * Carga y decodifica una textura fuera del hilo principal usando createImageBitmap
 * con orientación WebGL nativa ('flipY') y la pre-sube a la GPU con renderer.initTexture
 * para eliminar cualquier tirón (lag) durante la animación de entrada.
 */
export async function loadOptimizedTexture(
  url: string,
  renderer: THREE.WebGLRenderer,
  maxAnisotropy: number
): Promise<THREE.Texture> {
  const encodedUrl = encodeURI(url)
  const cached = textureCache.get(encodedUrl)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(encodedUrl, { cache: 'force-cache' })
    const blob = await response.blob()
    const imageBitmap = await createImageBitmap(blob, {
      imageOrientation: 'flipY',
      premultiplyAlpha: 'none',
      colorSpaceConversion: 'none',
    })

    const texture = new THREE.Texture(imageBitmap)
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(maxAnisotropy, 4)
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true

    // Pre-subir la textura a la GPU antes de iniciar las animaciones GSAP
    renderer.initTexture(texture)
    textureCache.set(encodedUrl, texture)
    return texture
  } catch {
    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader()
      loader.load(encodedUrl, (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace
        loaded.anisotropy = Math.min(maxAnisotropy, 4)
        renderer.initTexture(loaded)
        textureCache.set(encodedUrl, loaded)
        resolve(loaded)
      })
    })
  }
}
