import { serializeToSearchParams } from './serialize-to-search-params'
import type { SearchParamsPreserveOptions } from './types'

function preserveSearchParams(
  search: URLSearchParams,
  options?: SearchParamsPreserveOptions
) {
  const preserve = options?.preserve ?? 'all'
  const customValues = options?.customValues || {}

  const allowedKey =
    preserve === 'all' ? () => true : (key: string) => preserve.includes(key)

  const preservedSearch = new URLSearchParams()

  for (const [key, value] of search) {
    if (allowedKey(key)) {
      preservedSearch.append(key, value)
    }
  }

  for (const [key, value] of Object.entries(customValues)) {
    const matchingKeys = Array.from(preservedSearch.keys()).filter(
      (paramKey) => paramKey === key || paramKey.startsWith(`${key}[`)
    )
    for (const paramKey of matchingKeys) {
      preservedSearch.delete(paramKey)
    }

    serializeToSearchParams(preservedSearch, value, key)
  }

  return preservedSearch
}

export { preserveSearchParams }
