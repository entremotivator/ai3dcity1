import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

// Define the available GLB models
export const AVAILABLE_MODELS = [
  // First set of models (for NPCs 1-5)
  {
    name: "Avatar 1",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805baeaa6c6f8a550b38afb-gTp4CqxWkxAai1pp57ARy6zqnK6Udx.glb",
  },
  {
    name: "Avatar 2",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805baad64ce38bc903cb733-VizLyMQbEZddoDVCRuJP4WI748mXfj.glb",
  },
  {
    name: "Avatar 3",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805ba795a4759ef995d0432-KGcondGcskFSfBFkbtdfkuLSyt2uSo.glb",
  },
  {
    name: "Avatar 4",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805bac913b3fb7e8a3da84d-SddDnO7Oc6gLfFlRtvqVj8S0nP0syg.glb",
  },
  {
    name: "Avatar 5",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805bb0d2a9c5c70a479f348-IfKf8q5lVaizU3hFJf1gY1H0ykmbbp.glb",
  },
  // Second set of models (for NPCs 6-10) - Using the correct URLs provided by the user
  {
    name: "Avatar 6",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805bd902a9c5c70a47a2e89-jtpN344Zl7Hoy5edpB80tQJwal5pWU.glb",
  },
  {
    name: "Avatar 7",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805bd435a4759ef995d4f12-ZfBpr5pntlq7e7uaFasElSycIvyXnV.glb",
  },
  {
    name: "Avatar 8",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805bd1e11b444f5fb352210-kY0j5eWD8PG9VCejNVxpyWOknkd1FF.glb",
  },
  {
    name: "Avatar 9",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805bdee11b444f5fb35361c-Duxim4IpzQhiNZWhswDji2LHuN4Rm5.glb",
  },
  {
    name: "Avatar 10",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6805bdd05a4759ef995d5cb0-0o7Nj9zZ5RRyOGrCuxdRKqUHaUnh5q.glb",
  },
]

// Create a cache for preloaded models
const modelCache = new Map()

// Function to preload all models
export const preloadModels = async () => {
  const loader = new GLTFLoader()

  const loadPromises = AVAILABLE_MODELS.map((model) => {
    return new Promise((resolve, reject) => {
      loader.load(
        model.url,
        (gltf) => {
          modelCache.set(model.url, gltf)
          console.log(`Preloaded model: ${model.name}`)
          resolve(gltf)
        },
        undefined,
        (error) => {
          console.error(`Error preloading model ${model.name}:`, error)
          reject(error)
        },
      )
    })
  })

  try {
    await Promise.allSettled(loadPromises)
    console.log("All models preloaded")
    return true
  } catch (error) {
    console.error("Error preloading models:", error)
    return false
  }
}

// Function to get a preloaded model
export const getPreloadedModel = (url: string) => {
  return modelCache.get(url)
}

// Function to check if a model is preloaded
export const isModelPreloaded = (url: string) => {
  return modelCache.has(url)
}
