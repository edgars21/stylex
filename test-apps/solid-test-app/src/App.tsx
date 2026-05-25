import { Stylex } from "@stylex/web";
import { createSignal } from "solid-js";

export default function App() {
  let test;
  const [bgSet, setBgSet] = createSignal(false);
  return (
    <div>
      <div
        data-stylex-id="test"
        ref={(el) => {
          new Stylex(el!, {
            padding: "20px",
            backgroundColor: "lightgray",
            border: [[">child:hover", "2px solid red"], "2px solid blue"],
          });
        }}
      >
        <span
          data-stylex-id="child"
          {...{ "data-bg-set": bgSet() ? "" : undefined }}
          ref={(el) => {
            new Stylex(el!, {
              color: ["red"],
              backgroundColor: ["blue"],
              // color: [["<parent-id:hover","blue"],[":active&:hover", "pink"], "red"],
              // backgroundColor: [[":hover", "pink"],[":active", "red"], "blue"],
            });
          }}
        >
          Outer
        </span>
        <button
          onClick={() => {
            setBgSet(!bgSet());
          }}
        >
          Toggle bg {bgSet() ? "On" : "Off"}
        </button>
        <span
          data-stylex-id="sibling"
          {...{ "data-bg-set": bgSet() ? "" : undefined }}
          ref={(el) => {
            new Stylex(el!, {
              display: "inline-block",
              color: ["red"],
              backgroundColor: ["blue"],
              transform: [
                ["~child:hover", { value: "translateX(20px)", duration: 500 }],
                "translateX(0px)",
              ],
              // transform: [
              //   ["~child:hover", "translateX(20px)"],
              //   "translateX(0px)",
              // ],
              // color: [["<parent-id:hover","blue"],[":active&:hover", "pink"], "red"],
              // backgroundColor: [[":hover", "pink"],[":active", "red"], "blue"],
            });
          }}
        >
          Sibling
        </span>
      </div>
    </div>
  );
}
