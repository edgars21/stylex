export function test(take: any) {
    const attr = take.getAttribute("data-stylex-id");
    console.log("was given: ", attr,  take);
}