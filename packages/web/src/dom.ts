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
