type SearchParamsValue =
  | string
  | number
  | boolean
  | null
  | SearchParamsValue[]
  | { [key: string]: SearchParamsValue }

type SearchParamsValues = Record<string, SearchParamsValue>

type SearchParamsPreserveOptions = {
  preserve?: 'all' | string[]
  customValues?: SearchParamsValues
}

export type {
  SearchParamsValue,
  SearchParamsValues,
  SearchParamsPreserveOptions,
}
