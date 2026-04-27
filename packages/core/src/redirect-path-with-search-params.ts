import { preserveSearchParams } from './preserve-search-params'
import type { SearchParamsPreserveOptions, SearchParamsValues } from './types'

function parsePath(path: string) {
  const hashIndex = path.indexOf('#')
  const pathnameAndSearch = hashIndex === -1 ? path : path.slice(0, hashIndex)
  const hash = hashIndex === -1 ? '' : path.slice(hashIndex + 1)

  const searchIndex = pathnameAndSearch.indexOf('?')
  const pathname =
    searchIndex === -1
      ? pathnameAndSearch
      : pathnameAndSearch.slice(0, searchIndex)
  const search =
    searchIndex === -1 ? '' : pathnameAndSearch.slice(searchIndex + 1)

  return {
    pathname,
    search: search ? `?${search}` : '',
    hash: hash ? `#${hash}` : '',
  }
}

function redirectPathWithSearchParams(
  request: Request,
  path: string,
  options: SearchParamsPreserveOptions = {}
): string {
  const url = new URL(request.url)
  const parsedPath = parsePath(path)
  const search = new URLSearchParams(parsedPath.search)

  const pathValues: SearchParamsValues = {}
  for (const key of new Set(search.keys())) {
    const allValues = search.getAll(key)
    pathValues[key] = allValues.length === 1 ? allValues[0] : allValues
  }

  const preservedSearch = preserveSearchParams(url.searchParams, {
    ...options,
    customValues: { ...pathValues, ...(options.customValues ?? {}) },
  })

  const preservedString = preservedSearch.toString()

  return (
    parsedPath.pathname +
    (preservedString ? `?${preservedString}` : '') +
    parsedPath.hash
  )
}

export { redirectPathWithSearchParams }
