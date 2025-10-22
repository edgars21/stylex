import { stylex } from "@stylex/solid";
import { createSignal } from "solid-js";

export default function App() {
  return (
    <div
      ref={(el) => {
        stylex(el, () => ({
          color: [
            [
              "@hover",
              "blue",
            ],
            "red",
          ],
        }));
      }}
    >
      <span>Outer</span>
      <Inner />
    </div>
  );
}

function Inner() {
  const [on, setOn] = createSignal(false);
  return (
    <div
      use:stylex={{
        "backgroundColor": on() ? "red" : "blue",
      }}
      onClick={() => setOn(!on())}
    >
      Inner
    </div>
  );
}
