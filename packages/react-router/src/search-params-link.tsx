import type { SearchParamsPreserveOptions } from 'preserve-search-params'
import type * as React from 'react'
import { Link as DefaultLink, type LinkProps } from 'react-router'
import type { ElementOrComponent, PropsOf } from './types'
import { useResolvedPathWithSearchParams } from './use-resolved-path-with-search-params'

type SearchParamsLinkOwnProps = Pick<LinkProps, 'to' | 'relative'> &
  SearchParamsPreserveOptions & {
    children?: React.ReactNode
  }

type SearchParamsLinkProps<C extends ElementOrComponent = typeof DefaultLink> =
  SearchParamsLinkOwnProps & { component?: C } & Omit<
      PropsOf<C>,
      keyof SearchParamsLinkOwnProps | 'component'
    >

function SearchParamsLink<C extends ElementOrComponent = typeof DefaultLink>({
  to,
  relative,
  preserve,
  customValues,
  component,
  children,
  ...props
}: SearchParamsLinkProps<C>) {
  const resolvedTo = useResolvedPathWithSearchParams(to, {
    relative,
    preserve,
    customValues,
  })

  const Component = (component ?? DefaultLink) as React.ElementType
  return (
    <Component {...props} to={resolvedTo}>
      {children}
    </Component>
  )
}

export { SearchParamsLink }
export type { SearchParamsLinkProps, SearchParamsLinkOwnProps }
