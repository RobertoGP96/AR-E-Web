/**
 * Next 16 vendors a React canary whose server AND client builds export
 * `ViewTransition` under its stable name, but @types/react 19.2 only
 * declares `unstable_ViewTransition` behind the /experimental
 * entrypoint. Bridge the gap with the subset of the props we use
 * (shape copied from @types/react/experimental.d.ts). Delete this file
 * once @types/react ships the stable export.
 */
import type { ExoticComponent, ReactNode } from 'react';

declare module 'react' {
  export type ViewTransitionClassPerType = Record<
    'default' | (string & {}),
    'none' | 'auto' | (string & {})
  >;
  export type ViewTransitionClass =
    | ViewTransitionClassPerType
    | 'none'
    | 'auto'
    | (string & {});

  export interface ViewTransitionProps {
    children?: ReactNode | undefined;
    default?: ViewTransitionClass | undefined;
    enter?: ViewTransitionClass | undefined;
    exit?: ViewTransitionClass | undefined;
    share?: ViewTransitionClass | undefined;
    update?: ViewTransitionClass | undefined;
    name?: 'auto' | (string & {}) | undefined;
  }

  export const ViewTransition: ExoticComponent<ViewTransitionProps>;
}
