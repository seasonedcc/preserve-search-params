import {
  type SearchParamsPreserveOptions,
  preserveSearchParams,
} from 'preserve-search-params'

function buildHref(
  href: string,
  currentSearchParams: URLSearchParams,
  options: SearchParamsPreserveOptions
): string {
  const search = preserveSearchParams(currentSearchParams, options).toString()

  if (!search) return href

  const separator = href.includes('?') ? '&' : '?'
  return `${href}${separator}${search}`
}

export { buildHref }
