import type { SearchParamsValue } from './types'

function serializeToSearchParams(
  params: URLSearchParams,
  value: SearchParamsValue,
  prefix: string
): void {
  if (value === null || value === undefined) {
    return
  }

  if (Array.isArray(value)) {
    if (prefix.endsWith('[]')) {
      for (const item of value) {
        if (item !== null && item !== undefined) {
          params.append(prefix, String(item))
        }
      }
    } else {
      const firstNonNullItem = value.find(
        (item) => item !== null && item !== undefined
      )

      if (firstNonNullItem === undefined) {
        return
      }

      const isNested = prefix.includes('[')
      const isPrimitiveArray =
        typeof firstNonNullItem !== 'object' || firstNonNullItem === null

      if (isPrimitiveArray && !isNested) {
        for (const item of value) {
          if (item !== null && item !== undefined) {
            params.append(`${prefix}[]`, String(item))
          }
        }
      } else {
        for (const [index, item] of value.entries()) {
          serializeToSearchParams(params, item, `${prefix}[${index}]`)
        }
      }
    }
    return
  }

  if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      serializeToSearchParams(params, nestedValue, `${prefix}[${key}]`)
    }
    return
  }

  params.append(prefix, String(value))
}

export { serializeToSearchParams }
