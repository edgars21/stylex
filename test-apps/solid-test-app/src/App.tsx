import { StyleX } from "@stylex/web";
import { createSignal } from "solid-js";

export default function App() {
  let test;
  const [bgSet, setBgSet] = createSignal(false);
  return (
    <div>
      <div
        data-stylex-id="test"
        ref={(el) => {
          new StyleX(el!, {
            padding: "20px",
            backgroundColor: "lightgray",
          });
        }}
      >
        <span
          {...{ "data-bg-set": bgSet() ? "" : undefined }}
          ref={(el) => {
            new StyleX(el!, {
              padding: [["@data-bg-set", "0px"], "0px"],
              color: ["red"],
              backgroundColor: [["<test:hover", "green"], "blue"],
              // color: [["<parent-id:hover","blue"],[":active&:hover", "pink"], "red"],
              // backgroundColor: [[":hover", "pink"],[":active", "red"], "blue"],
            });
          }}
        >
          Outer
        </span>
        <button onClick={() => setBgSet(!bgSet())}>
          Toggle bg {bgSet() ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
