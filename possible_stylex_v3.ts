import { onAnimateEndAll } from "stylex";

Stylex({});

function customTween() {}

Element.stylex.animate(600, "ease-in-out", () => {}).backgroundColor("red");

Element.stylex.animate(customTween).backgroundColor("red");

Element.stylex
  .change({
    fontSize: animate("15px", 500, "ease-in-out", () => {}),
    backgroundColor: "blue",
  })
  .animate(600, "ease-in-out", () => {});

Element.stylex
  .change({
    fontSize: animate("15px", 500, "ease-in-out", () => {}),
    backgroundColor: "blue",
  })
  .animate(
    600,
    "ease-in-out",
    onAnimateEndAll(() => {}),
  );

Element.stylex
  .change(
    animate(
      {
        fontSize: animate("15px", 500, "ease-in-out", () => {}),
        backgroundColor: "blue",
      },
      600,
      "ease-in-out",
      onAnimateEndAll(() => {}),
    ),
  )



stylex({
    default: {
        color: [[":hover", "blue"],"red"],
    },
    "@disabled": {
        color: [[":hover", "blue"], "light-red"],
    }
})

stylex({
    default: {
        color: [animate([":hover", "blue"], {onEnd: () =>  {
            console.log("hover animation ended");
        }}), animate("red")],
    },
    "@disabled": animate({
        color: animate([[":hover", "blue"], "light-red"],
    }),
    transition: {

        backgroundColor: animate(["white", "black"], {duration: 300, easing: "ease-in-out", onEnd: () => {}}),
        transormTranslateY : animate(["0px", "10px"], {duration: 300, easing: "ease-in-out", onEnd: () => {}}),

    }
})