// import {
//   Stylex,
//   // solidUseStylex as stylex,
//   stylex,
//   animate,
//   type StylexConstructor,
// } from "@stylex/web";
import { createSignal } from "solid-js";
import { animate } from "@stylex/web";
import { stylex } from "@stylex/solid";
false && stylex;

export default function App() {
  const [bgSet, setBgSet] = createSignal(false);
  return (
    <div>
      <div style={{ position: "relative" }}>
        <span>one</span>
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
          use:stylex={
            bgSet()
              ? { 
                border: "1px solid red",
                left: animate("0px", { duration: 600 }),
              }
              : {
                  position: "relative",
                  display: "inline-block",
                  border: "1px solid black",
                  transitionDuration: "413ms, 377ms",
                  left: animate(
                    [
                      ["@data-bg-set", animate("50px", { duration: 700 })],
                      "100px",
                    ],
                    {
                      duration: 700,
                    },
                  ),
                  transition:
                    "leff 150ms ease-out, height 250ms ease, left 400ms cubic-bezier(0.17, 0.67, 0.83, 0.67) 75ms",
                }
          }
        >
          two
        </span>
      </div>
    </div>
  );
}
