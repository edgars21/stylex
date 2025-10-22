import { stylex } from "@stylex/solid";
import { createSignal } from "solid-js";

export default function App() {

  const [enabled1, setEnabled1] = createSignal(false);
  const [enabled2, setEnabled2] = createSignal(false);

  return (
    <div
      data-stylex-enabled1={enabled1() ? "works" : "false"}
      {...(enabled2() ? { "data-stylex-enabled2": "" } : {})}
      ref={(el) => {
        stylex(() => [
          el,
          {
            transition: "all 0.3s ease",
            padding: "20px",
            color: "red",
            "font-size": "20px",
            // transform: "translateY(-50px)",
            transform: [["@active", "translateY(-50px)"]],
            "background-color": ["gray", 
              ["@active", "red"],
              ["@enabled1=works", "blue"],
              ["@enabled2", "pink"], 
            ],
          },
        ]);
      }}
    >
      <p>StyleX test</p>
      <div>
        <button
          onClick={() => setEnabled1(!enabled1())}
        >
         Enable one 
        </button>
        <button
          onClick={() => setEnabled2(!enabled2())}
        >
         Enable two
        </button>
      </div>
    </div>
  );
}
