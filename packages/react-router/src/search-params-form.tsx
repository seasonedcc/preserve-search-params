import {
  type SearchParamsPreserveOptions,
  preserveSearchParams,
} from 'preserve-search-params'
import type * as React from 'react'
import { Form as DefaultForm, useLocation } from 'react-router'
import type { ElementOrComponent, PropsOf } from './types'

type SearchParamsFormOwnProps = SearchParamsPreserveOptions & {
  children?: React.ReactNode
}

type SearchParamsFormProps<C extends ElementOrComponent = typeof DefaultForm> =
  SearchParamsFormOwnProps & { component?: C } & Omit<
      PropsOf<C>,
      keyof SearchParamsFormOwnProps | 'component'
    >

function SearchParamsForm<C extends ElementOrComponent = typeof DefaultForm>({
  preserve,
  customValues,
  component,
  children,
  ...props
}: SearchParamsFormProps<C>) {
  const location = useLocation()
  const search = new URLSearchParams(location.search)
  const inputs: { key: string; value: string }[] = []

  preserveSearchParams(search, { preserve, customValues }).forEach(
    (value, key) => {
      inputs.push({ key, value })
    }
  )

  const Component = (component ?? DefaultForm) as React.ElementType
  return (
    <Component method="get" {...props}>
      {inputs.map(({ key, value }, index) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: necessary for repeated-key search params (e.g. order=action&order=asc)
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
