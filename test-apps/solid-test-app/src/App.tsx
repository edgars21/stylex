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
  let test;
  const [bgSet, setBgSet] = createSignal(false);
  return (
    <div>
      <div>
        <span
        // use:stylex={animate(
        //   {
        //     backgroundColor: "green",
        //     color: [[":hover", "pink"], animate("red", { duration: 1000 })],
        //   },
        //   {
        //     duration: 1000,
        //   },
        // )}
        >
          one
        </span>
        <span
          ref={(el) => {
            stylex(
              el,
              animate(
                {
                  transformRotateY: [
                    // animate([":hover", "16deg"], { duration: 1000 }),
                    // animate(
                    //   [":hover", animate("18deg", { duration: 1000 })],
                    //   { duration: 1000 },
                    // ),
                    // [":hover", animate("18deg", { duration: 1000 })],
                    "18deg",
                    animate("17deg", {
                      duration: 1000,
                      timingFunction: "animation on 17deg simple value",
                    }),
                  ],
                  // color: animate("blue", { duration: 1000, timingFunction: "animation on color simple value" }),
                  // fontSize: "3px",
                },
                { duration: 1000, timingFunction: "wraps stylex object" },
              ),
            );
          }}
        >
          two
        </span>
        <button
          onClick={() => {
            setBgSet(!bgSet());
          }}
        >
          Toggle bg {bgSet() ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
