import type * as React from 'react'

type ElementOrComponent =
  // biome-ignore lint/suspicious/noExplicitAny: standard polymorphic-component constraint
  keyof React.JSX.IntrinsicElements | React.ComponentType<any>

type PropsOf<T> = T extends React.ComponentType<infer P>
  ? P
  : T extends keyof React.JSX.IntrinsicElements
    ? React.JSX.IntrinsicElements[T]
    : never

export type { ElementOrComponent, PropsOf }
