import type * as React from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import * as adapter from './index'
import type { SearchParamsFormProps } from './search-params-form'
import type { SearchParamsLinkProps } from './search-params-link'
import type { PropsOf } from './types'

describe('PropsOf', () => {
  it('extracts props from a React component', () => {
    type MyProps = { size: string; color: number }
    type MyComp = React.ComponentType<MyProps>
    expectTypeOf<PropsOf<MyComp>>().toEqualTypeOf<MyProps>()
  })

  it('extracts props from an intrinsic element string', () => {
    expectTypeOf<PropsOf<'a'>>().toEqualTypeOf<
      React.JSX.IntrinsicElements['a']
    >()
    expectTypeOf<PropsOf<'form'>>().toEqualTypeOf<
      React.JSX.IntrinsicElements['form']
    >()
  })

  it('extracts props from a forwardRef component', () => {
    type Ref = React.ForwardRefExoticComponent<
      React.PropsWithoutRef<{ size: string; color: number }> &
        React.RefAttributes<HTMLDivElement>
    >
    expectTypeOf<PropsOf<Ref>>().toHaveProperty('size')
    expectTypeOf<PropsOf<Ref>>().toHaveProperty('color')
  })
})

describe('SearchParamsLinkProps inference', () => {
  it('default-generic case (no `component`) accepts our own props', () => {
    type Props = SearchParamsLinkProps
    expectTypeOf<Props>().toHaveProperty('href')
    expectTypeOf<Props>().toHaveProperty('currentSearchParams')
    expectTypeOf<Props>().toHaveProperty('preserve')
    expectTypeOf<Props>().toHaveProperty('customValues')
  })

  it('our `href` is a plain string and not shadowed by next/link href type', () => {
    type Props = SearchParamsLinkProps
    expectTypeOf<Props['href']>().toEqualTypeOf<string>()
  })

  it('passing a custom component without explicit generic still infers C from value', () => {
    type CustomLink = React.FC<{
      href: string
      children?: React.ReactNode
      variant: 'primary' | 'secondary'
    }>
    type Props = SearchParamsLinkProps<CustomLink>
    expectTypeOf<Props>().toHaveProperty('variant')
    expectTypeOf<Props['variant']>().toEqualTypeOf<'primary' | 'secondary'>()
  })

  it('our own keys are not duplicated when component overlaps', () => {
    type CustomLink = React.FC<{
      href: { custom: 'shape' } // intentionally weird
      children?: React.ReactNode
    }>
    type Props = SearchParamsLinkProps<CustomLink>
    // Our `href: string` wins; the custom `href: { custom: 'shape' }` is omitted
    expectTypeOf<Props['href']>().toEqualTypeOf<string>()
  })

  it('forwardRef components work as `component`', () => {
    type CustomLink = React.ForwardRefExoticComponent<
      React.PropsWithoutRef<{ href: string; size: 'sm' | 'lg' }> &
        React.RefAttributes<HTMLAnchorElement>
    >
    type Props = SearchParamsLinkProps<CustomLink>
    expectTypeOf<Props>().toHaveProperty('size')
    expectTypeOf<Props['size']>().toEqualTypeOf<'sm' | 'lg'>()
  })
})

describe('SearchParamsFormProps inference', () => {
  it('default-generic case resolves to JSX form props minus our own', () => {
    type Props = SearchParamsFormProps
    // Our own
    expectTypeOf<Props>().toHaveProperty('currentSearchParams')
    expectTypeOf<Props>().toHaveProperty('preserve')
    // From <form>
    expectTypeOf<Props>().toHaveProperty('method')
    expectTypeOf<Props>().toHaveProperty('action')
    expectTypeOf<Props>().toHaveProperty('onSubmit')
  })

  it('passing a custom component flows its required props through', () => {
    type CustomForm = React.FC<{
      action: string
      variant: 'a' | 'b'
      children?: React.ReactNode
    }>
    type Props = SearchParamsFormProps<CustomForm>
    expectTypeOf<Props>().toHaveProperty('variant')
    expectTypeOf<Props['variant']>().toEqualTypeOf<'a' | 'b'>()
  })
})

describe('redirectPathWithSearchParams export', () => {
  it('is reachable from the adapter entry with the expected signature', () => {
    expectTypeOf(adapter.redirectPathWithSearchParams).parameters.toEqualTypeOf<
      [Request, string, Parameters<typeof adapter.preserveSearchParams>[1]?]
    >()
    expectTypeOf(
      adapter.redirectPathWithSearchParams
    ).returns.toEqualTypeOf<string>()
  })
})
