const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '')

export const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  if (!configuredApiUrl) return fetch(path, init)

  try {
    return await fetch(`${configuredApiUrl}${path}`, init)
  } catch (configuredError) {
    try {
      return await fetch(path, init)
    } catch (fallbackError) {
      const detail = fallbackError instanceof Error ? fallbackError.message : String(configuredError)
      throw new Error(`Could not reach the ExamIQ API at ${configuredApiUrl} or through the local API proxy. Start the backend and retry. ${detail}`)
    }
  }
}
