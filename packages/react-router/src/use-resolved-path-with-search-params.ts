import { preserveSearchParams } from 'preserve-search-params'
import type { SearchParamsPreserveOptions } from 'preserve-search-params'
import { type Path, type To, useLocation, useResolvedPath } from 'react-router'

type RelativeRoutingType = 'route' | 'path'

type Options = SearchParamsPreserveOptions & {
  relative?: RelativeRoutingType
}

function useResolvedPathWithSearchParams(to: To, options: Options = {}): Path {
  const location = useLocation()
  const search = new URLSearchParams(location.search)
  const { relative, ...preserveOptions } = options
  const resolvedPath = useResolvedPath(to, { relative })

  return {
    ...resolvedPath,
    search: preserveSearchParams(search, preserveOptions).toString(),
  }
}

export { useResolvedPathWithSearchParams }
