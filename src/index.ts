export type Debouncer = () => Promise<boolean>;

type Resolver = (value: boolean) => void;

export const makeDebouncer = (intervalMs: number): Debouncer => {
    let intervalId: NodeJS.Timeout | null = null;
    let queuedResolve: Resolver | null = null;
    const dequeue = () => {
        if (queuedResolve) {
            queuedResolve(true);
            queuedResolve = null;
            return;
        }
        clearInterval(intervalId!);
        intervalId = null;
    };
    const enqueue = (resolve: Resolver) => {
        if (intervalId === null) {
            intervalId = setInterval(dequeue, intervalMs);
            resolve(true);
            return;
        }
        if (queuedResolve) queuedResolve(false);
        queuedResolve = resolve;
    };
    return () => new Promise(enqueue);
};
