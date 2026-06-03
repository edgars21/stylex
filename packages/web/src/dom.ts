export function createEventListenerWithCleanupFactory() {
  const listeners: [
    EventTarget,
    string,
    (e: Event) => void,
    options?: AddEventListenerOptions,
  ][] = [];

  return [
    (
      target: EventTarget,
      event: string,
      handler: (e: Event) => void,
      options?: AddEventListenerOptions,
    ) => {
      target.addEventListener(event, handler, options);
      const listener = [
        target,
        event,
        handler,
        ...(options ? [options] : []),
      ] as [EventTarget, string, (e: Event) => void];
      listeners.push(listener);

      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          target.removeEventListener(event, handler);
          listeners.splice(index, 1);
        }
      };
    },
    () => {
      listeners.forEach(([target, event, handler]) => {
        target.removeEventListener(event, handler);
      });
    },
  ] as const;
}

export function createMutationObserverWithCleanupFactory() {
  const observers: MutationObserver[] = [];
  return [
    (
      target: HTMLElement,
      options: MutationObserverInit,
      handler: (mutations: MutationRecord[]) => void,
    ) => {
      const observer = new MutationObserver(handler);
      observer.observe(target, options);
      observers.push(observer);

      return () => {
        const index = observers.indexOf(observer);
        if (index > -1) {
          observer.disconnect();
          observers.splice(index, 1);
        }
      };
    },
    () => {
      observers.forEach((observer) => {
        observer.disconnect();
      });
    },
  ] as const;
}

type DestroyedCallback = (element: Element) => void;

/**
 * Watches a set of DOM elements and fires a callback when any of them
 * are removed from the document — directly or via an ancestor being removed.
 *
 * Uses a single MutationObserver on <body> (subtree: true) regardless of
 * how many elements are being watched.
 */
export class ElementDestructionObserver {
  private readonly _onDestroyed: DestroyedCallback;
  private readonly _watched = new Set<Element>();
  private readonly _mo: MutationObserver;
  private _attached = false;

  constructor(onDestroyed: DestroyedCallback) {
    this._onDestroyed = onDestroyed;
    this._mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const removed of mutation.removedNodes) {
          this._checkNode(removed);
        }
      }
    });
  }

  /** Start watching one or more elements. Safe to call with duplicates. */
  observe(...elements: Element[]): void {
    for (const el of elements) {
      this._watched.add(el);
    }
    if (!this._attached) {
      this._mo.observe(document.body, { childList: true, subtree: true });
      this._attached = true;
    }
  }

  /** Stop watching a specific element without affecting others. */
  unobserve(element: Element): void {
    this._watched.delete(element);
    if (this._watched.size === 0) this._detach();
  }

  /** Stop watching all elements and tear down the MutationObserver. */
  disconnect(): void {
    this._watched.clear();
    this._detach();
  }

  /** Read-only snapshot of currently watched elements. */
  get watchedElements(): ReadonlySet<Element> {
    return this._watched;
  }

  private _checkNode(node: Node): void {
    for (const el of this._watched) {
      if (node === el || (node instanceof Element && node.contains(el))) {
        this._watched.delete(el);
        this._onDestroyed(el);
      }
    }
    if (this._watched.size === 0) this._detach();
  }

  private _detach(): void {
    if (this._attached) {
      this._mo.disconnect();
      this._attached = false;
    }
  }
}
