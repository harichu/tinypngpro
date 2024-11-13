export type ResponseStore = {
  key: string
  url: string
  size: number
}

export type ResponseProcess = {
  key: string
  size: number
  type: string
  width: number
  height: number
  url: string
  originalSize: number
  message?: string
}