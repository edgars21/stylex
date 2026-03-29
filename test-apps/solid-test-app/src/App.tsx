import { StyleX } from "@stylex/web";

export default function App() {
  let test;
  return (
    <div>
      <span 
      ref={(el) => {
        test = el;
        console.log("Creating StyleX for element", el);
        const out = new StyleX(el!, {
          color: "red",
          backgroundColor: [[":hover", "pink"],[":active", "red"], "blue"],
        });
        console.log("StyleX instance created:", out);

      }}
      onClick={() => {
        if (test) {
          new StyleX(test!, {
            backgroundColor: "green",
          });
        }
      }}
      >Outer</span>
    </div>
  );
}
