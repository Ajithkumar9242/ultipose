export const BASE_URL = "http://ultipos.localhost:8000"

export function getFileUrl(path) {
  if (!path) return ""
  if (path.startsWith("http")) return path // already full url
  if (path.startsWith("/")) return `${BASE_URL}${path}`
  return `${BASE_URL}/${path}`
}
