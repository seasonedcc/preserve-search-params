import type * as React from 'react'
import type { Link as RRLink } from 'react-router'
import { describe, expectTypeOf, it } from 'vitest'
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
