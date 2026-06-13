import {
  StylexDefinition,
  Stylex,
  animate,
  mergeStylexDefinitions,
  type Mtransition
} from "@stylex3/web";
import { createEffect, onCleanup } from "solid-js";

export type { StylexDefinition, Mtransition };
export { animate, mergeStylexDefinitions, Stylex };

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      stylex: StylexDefinition;
    }
  }
}

export function stylex(element: HTMLElement, callback: () => StylexDefinition) {
  onCleanup(() => {});
  createEffect(() => {
    const value = callback();
    new Stylex(element, value);
  });
}
