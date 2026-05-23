// @ts-nocheck
const callbacks = new WeakMap();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const removedNode of mutation.removedNodes) {
      walk(removedNode);
    }
  }
});

function walk(node) {
  if (callbacks.has(node)) {
    callbacks.get(node)();
    callbacks.delete(node);
  }

  node.childNodes?.forEach(walk);
}

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
