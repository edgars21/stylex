import { stylex } from "@stylex/solid";
import { createSignal } from "solid-js";

export default function App() {
  const shadowGreen = "0 0 5px green";
  const shadowRed = "0 0 20px red";

  const [boxShadow, setBoxShadow] = createSignal(shadowGreen);
  const [enableBgGreen, setEnableBgGreen] = createSignal(false);
  const [enabled, setEnabled] = createSignal(false);
  const [scale, setScale] = createSignal(1);

  return (
    <div
      {...(false ? { "data-test-empty": "" } : {})}
      data-test-attr={false}
      data-stylex-enabled={enabled() ? "true" : "false"}
      ref={(el) => {
        stylex(() => [
          el,
          {
            transition: "all 0.3s ease",
            transform: `scale(${scale()})`,
            padding: "20px",
            color: "red",
            "font-size": "20px",
            "box-shadow": boxShadow(),
            "background-color": [
              "yellow",
              ["@media (max-width: 600px)", "gray"],
              ["@enabled=true", "blue"],
              [enableBgGreen(), "green"],
              ["@hover", "purple"],
            ],
          },
        ]);
      }}
    >
      <p>StyleX test</p>
      <div>
        <button
          disabled={boxShadow() === shadowGreen}
          onClick={() => setBoxShadow(shadowGreen)}
        >
          Green Shadow
        </button>
        <button
          disabled={boxShadow() === shadowRed}
          onClick={() => setBoxShadow(shadowRed)}
        >
          Red Shadow
        </button>
      </div>
      <button
        onClick={() => {
          setEnableBgGreen(!enableBgGreen());
          setScale(scale() - 0.05);
        }}
      >
        Swap color
      </button>
      <div>
        <button
          ref={(el) => {
            stylex(() => [
              el,
              {
                "background-color": enabled() ? "red" : "green",
              },
            ]);
          }}
          onClick={() => setEnabled(!enabled())}
        >
          {enabled() ? "Disable blue bg" : "Enable blue bg"}
        </button>
      </div>
    </div>
  );
}
