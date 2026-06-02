import {
  Stylex,
  // solidUseStylex as stylex,
  stylex,
  animate,
  type StylexConstructor,
} from "@stylex/web";
import { createSignal } from "solid-js";
false && stylex;

import "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "text-node": JSX.HTMLAttributes<HTMLElement> & { ref?: HTMLElement };
    }
    // So `use:stylex` doesn't error:
    interface Directives {
      stylex: StylexConstructor;
    }
  }
}

export default function App() {
  const [bgSet, setBgSet] = createSignal(false);
  return (
    <div>
      <div style={{ position: "relative" }}>
        <span
          ref={(el) => {
            stylex(el, {
              display: "inline-block",

              backgroundColor: [[":hover", "red"], "blue"],
            });
          }}
        >
          one
        </span>
        <button
          onClick={() => {
            setBgSet(!bgSet());
          }}
        >
          Toggle bg {bgSet() ? "On" : "Off"}
        </button>
        <span
          {...{
            "data-bg-set": bgSet() ? "true" : undefined,
          }}
          ref={(el) => {
            stylex(el, {
              position: "relative",
              display: "inline-block",
              border: "1px solid black",
              transitionDuration: "413ms, 377ms",
              left: animate([["@data-bg-set", animate("50px", {duration: 4000})],"100px"], {
                  duration: 4000,
              }),
              transition:
                "leff 150ms ease-out, height 250ms ease, left 400ms cubic-bezier(0.17, 0.67, 0.83, 0.67) 75ms",
            });
          }}
        >
          two
        </span>
      </div>
    </div>
  );
}
