import { StylexDefinition, Stylex, animate } from "@stylex/web";
import { createEffect, onCleanup } from "solid-js";

export type { StylexDefinition };
export {
  animate,
}

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
