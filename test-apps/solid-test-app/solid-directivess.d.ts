import type { StyleXValidSolidType } from "@stylex/solid";
import "solid-js"; // just to make sure we extend it

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      stylexd: StyleXValidSolidType;
    }
  }
}

