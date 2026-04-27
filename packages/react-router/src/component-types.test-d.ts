import type * as React from 'react'
import type { Link as RRLink } from 'react-router'
import { describe, expectTypeOf, it } from 'vitest'
import * as adapter from './index'
import type {
  SearchParamsFormOwnProps,
  SearchParamsFormProps,
  SearchParamsLinkProps,
  UseResolvedPathWithSearchParamsOptions,
} from './index'
import type { PropsOf } from './types'
import type { useResolvedPathWithSearchParams } from './use-resolved-path-with-search-params'

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
  it('with no `component`, defaults to react-router Link props', () => {
    type Props = SearchParamsLinkProps
    // `to` and `relative` are declared in our own props (we own them)
    expectTypeOf<Props>().toHaveProperty('to')
    expectTypeOf<Props>().toHaveProperty('relative')
    // `preserve`/`customValues` always present
    expectTypeOf<Props>().toHaveProperty('preserve')
    expectTypeOf<Props>().toHaveProperty('customValues')
  })

  it('our own keys are not duplicated when component is the default', () => {
    type Props = SearchParamsLinkProps
    // `to` is ours; the underlying Link also has `to` — Omit ensures our type wins
    expectTypeOf<Props['to']>().toEqualTypeOf<
      React.ComponentProps<typeof RRLink>['to']
    >()
  })

  it('passing a custom component without explicit generic still infers C', () => {
    type CustomLink = React.FC<{
      to: string
      children?: React.ReactNode
      variant: 'a' | 'b'
    }>
    type Props = SearchParamsLinkProps<CustomLink>
    expectTypeOf<Props>().toHaveProperty('variant')
    // required prop on the custom component is required at the wrapper
    expectTypeOf<Props['variant']>().toEqualTypeOf<'a' | 'b'>()
  })

  it('forwardRef components work as `component`', () => {
    type CustomLink = React.ForwardRefExoticComponent<
      React.PropsWithoutRef<{ to: string; size: 'sm' | 'lg' }> &
        React.RefAttributes<HTMLAnchorElement>
    >
    type Props = SearchParamsLinkProps<CustomLink>
    expectTypeOf<Props>().toHaveProperty('size')
  })
})

describe('UseResolvedPathWithSearchParamsOptions', () => {
  it('matches the hook signature', () => {
    type HookOptions = NonNullable<
      Parameters<typeof useResolvedPathWithSearchParams>[1]
    >
    expectTypeOf<UseResolvedPathWithSearchParamsOptions>().toEqualTypeOf<HookOptions>()
  })

  it('carries the preserve and customValues fields', () => {
    expectTypeOf<UseResolvedPathWithSearchParamsOptions>().toHaveProperty(
      'preserve'
    )
    expectTypeOf<UseResolvedPathWithSearchParamsOptions>().toHaveProperty(
      'customValues'
    )
    expectTypeOf<UseResolvedPathWithSearchParamsOptions>().toHaveProperty(
      'relative'
    )
  })
})

describe('SearchParamsFormOwnProps', () => {
  it('contains the preserve-options keys', () => {
    expectTypeOf<SearchParamsFormOwnProps>().toHaveProperty('preserve')
    expectTypeOf<SearchParamsFormOwnProps>().toHaveProperty('customValues')
  })

  it('no longer carries the fetcher prop', () => {
    expectTypeOf<SearchParamsFormOwnProps>().not.toHaveProperty('fetcher')
  })

  it('is assignable into SearchParamsFormProps', () => {
    expectTypeOf<SearchParamsFormOwnProps>().toMatchTypeOf<SearchParamsFormProps>()
  })
})

describe('SearchParamsFormProps inference', () => {
  it('default-generic resolves to RR FormProps shape plus our own', () => {
    type Props = SearchParamsFormProps
    expectTypeOf<Props>().toHaveProperty('preserve')
    expectTypeOf<Props>().toHaveProperty('customValues')
    expectTypeOf<Props>().toHaveProperty('action')
    expectTypeOf<Props>().toHaveProperty('method')
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

  it('forwardRef components work as `component`', () => {
    type CustomForm = React.ForwardRefExoticComponent<
      React.PropsWithoutRef<{ action: string; size: 'sm' | 'lg' }> &
        React.RefAttributes<HTMLFormElement>
    >
    type Props = SearchParamsFormProps<CustomForm>
    expectTypeOf<Props>().toHaveProperty('size')
    expectTypeOf<Props['size']>().toEqualTypeOf<'sm' | 'lg'>()
  })
})

describe('ref forwarding', () => {
  it('SearchParamsLinkProps.ref attaches to HTMLAnchorElement', () => {
    expectTypeOf<SearchParamsLinkProps>().toHaveProperty('ref')
    expectTypeOf<(el: HTMLAnchorElement | null) => void>().toMatchTypeOf<
      NonNullable<SearchParamsLinkProps['ref']>
    >()
  })

  it('SearchParamsFormProps.ref attaches to HTMLFormElement', () => {
    expectTypeOf<SearchParamsFormProps>().toHaveProperty('ref')
    expectTypeOf<(el: HTMLFormElement | null) => void>().toMatchTypeOf<
      NonNullable<SearchParamsFormProps['ref']>
    >()
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
