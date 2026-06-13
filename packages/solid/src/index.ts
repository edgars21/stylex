import {
  StylexDefinition,
  Stylex,
  animate,
  mergeStylexDefinitions,
  type Mtransition,
  type StylexDefinitionWithMtransition,
} from "@stylex3/web";
import { createEffect, onCleanup } from "solid-js";

export type { StylexDefinition, Mtransition, StylexDefinitionWithMtransition };
export { animate, mergeStylexDefinitions, Stylex };

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      stylex: StylexDefinition;
    }
  }
}

export function stylex(element: HTMLElement, callback: () => StylexDefinition) {
  createEffect(() => {
    const value = callback();
    const instnance = new Stylex(element, value, { noObserveCleanup: true });
    onCleanup(() => {
      instnance.onDestroy();
    });
  });
}
