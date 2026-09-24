import { ApiError } from './errors'

export async function fakeHttp<T>(
  operation: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (signal?.aborted) throw new DOMException('Request aborted', 'AbortError')
  return operation().catch((error: unknown) => {
    if (error instanceof ApiError) throw error
    throw new ApiError(error instanceof Error ? error.message : 'Request failed', 500)
  })
}
