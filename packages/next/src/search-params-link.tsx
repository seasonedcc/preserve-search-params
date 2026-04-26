import NextLink from 'next/link'
import type { SearchParamsPreserveOptions } from 'preserve-search-params'
import type * as React from 'react'
import { buildHref } from './build-href'
import type { ElementOrComponent, PropsOf } from './types'

type SearchParamsLinkOwnProps = SearchParamsPreserveOptions & {
  href: string
  currentSearchParams: URLSearchParams
  children?: React.ReactNode
}

type SearchParamsLinkProps<C extends ElementOrComponent = typeof NextLink> =
  SearchParamsLinkOwnProps & { component?: C } & Omit<
      PropsOf<C>,
      keyof SearchParamsLinkOwnProps | 'component'
    >

function SearchParamsLink<C extends ElementOrComponent = typeof NextLink>({
  href,
  currentSearchParams,
  preserve,
  customValues,
  component,
  children,
  ...props
}: SearchParamsLinkProps<C>) {
  const finalHref = buildHref(href, currentSearchParams, {
    preserve,
    customValues,
  })

  const Component = (component ?? NextLink) as React.ElementType
  return (
    <Component {...props} href={finalHref}>
      {children}
    </Component>
  )
}

export { SearchParamsLink }
export type { SearchParamsLinkProps, SearchParamsLinkOwnProps }
