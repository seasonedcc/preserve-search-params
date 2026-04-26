import {
  type SearchParamsPreserveOptions,
  preserveSearchParams,
} from 'preserve-search-params'
import type * as React from 'react'
import type { ElementOrComponent, PropsOf } from './types'

type SearchParamsFormOwnProps = SearchParamsPreserveOptions & {
  currentSearchParams: URLSearchParams
  children?: React.ReactNode
}

type SearchParamsFormProps<C extends ElementOrComponent = 'form'> =
  SearchParamsFormOwnProps & { component?: C } & Omit<
      PropsOf<C>,
      keyof SearchParamsFormOwnProps | 'component'
    >

function SearchParamsForm<C extends ElementOrComponent = 'form'>({
  currentSearchParams,
  preserve,
  customValues,
  component,
  children,
  ...props
}: SearchParamsFormProps<C>) {
  const inputs: { key: string; value: string }[] = []
  preserveSearchParams(currentSearchParams, { preserve, customValues }).forEach(
    (value, key) => {
      inputs.push({ key, value })
    }
  )

  const Component = (component ?? 'form') as React.ElementType
  return (
    <Component method="get" {...props}>
      {inputs.map(({ key, value }, index) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: necessary for repeated-key search params
          key={`${key}-${index}`}
          type="hidden"
          name={key}
          value={value}
        />
      ))}
      {children}
    </Component>
  )
}

export { SearchParamsForm }
export type { SearchParamsFormProps, SearchParamsFormOwnProps }
