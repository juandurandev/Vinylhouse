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

// Catálogo completo con los 15 álbumes en /public/images
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
  {
    id: 9,
    title: "(What's the Story) Morning Glory?",
    artist: 'Oasis',
    year: '1995',
    price: 41.0,
    category: 'Rock',
    image: '/images/(Whats the Story) Morning Glory Oasis.jpg',
  },
  {
    id: 10,
    title: 'Doo-Wops & Hooligans',
    artist: 'Bruno Mars',
    year: '2010',
    price: 34.5,
    category: 'Pop',
    image: '/images/Doo-Wops & Hooligans Bruno Mars.jpg',
  },
  {
    id: 11,
    title: 'Enter The Wu-Tang (36 Chambers)',
    artist: 'Wu-Tang Clan',
    year: '1993',
    price: 40.0,
    category: 'Hip-Hop',
    image: '/images/Enter The Wu-Tang (36 Chambers) Wu-Tang Clan.jpg',
  },
  {
    id: 12,
    title: 'My Beautiful Dark Twisted Fantasy',
    artist: 'Kanye West',
    year: '2010',
    price: 46.0,
    category: 'Hip-Hop',
    image: '/images/My Beautiful Dark Twisted Fantasy Kanye West.jpg',
  },
  {
    id: 13,
    title: 'OK Computer',
    artist: 'Radiohead',
    year: '1997',
    price: 44.0,
    category: 'Rock',
    image: '/images/OK Computer by Radiohead.jpg',
  },
  {
    id: 14,
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    year: '1973',
    price: 48.0,
    category: 'Rock',
    image: '/images/The Dark Side of the Moon Pink Floyd.jpg',
  },
  {
    id: 15,
    title: 'The Eminem Show',
    artist: 'Eminem',
    year: '2002',
    price: 39.0,
    category: 'Hip-Hop',
    image: '/images/The Eminem Show Eminem.jpg',
  },
]

// Configuración central del escenario y física 3D
export const SCENE_CONFIG = {
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
  dragSensitivity: 0.0014,  // Sensibilidad calibrada para recorrer los 15 álbumes con fluidez
  wheelSensitivity: 0.00045,// Sensibilidad de la rueda calibrada para 15 álbumes
  lerpFactor: 0.08,         // Suavizado del desplazamiento del carrusel
  rotationDamping: 7.5,     // Amortiguación ultra suave para el giro de los discos
} as const
