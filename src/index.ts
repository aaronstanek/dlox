export type Debouncer = {
    (): Promise<boolean>;
    hasQueued: () => boolean;
    flush: (value: boolean) => boolean;
    close: () => void;
    isClosed: () => boolean;
};

type Resolver = (value: boolean) => void;

export const makeDebouncer = (intervalMs: number): Debouncer => {
    let isClosed = false;
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
        if (isClosed) {
            resolve(false);
            return;
        }
        if (intervalId === null) {
            intervalId = setInterval(dequeue, intervalMs);
            resolve(true);
            return;
        }
        if (queuedResolve) queuedResolve(false);
        queuedResolve = resolve;
    };
    const returnValue = () => new Promise(enqueue);
    returnValue.hasQueued = () => queuedResolve !== null;
    returnValue.flush = (value: boolean) => {
        if (queuedResolve === null) return false;
        clearInterval(intervalId!);
        intervalId = setInterval(dequeue, intervalMs);
        queuedResolve(value);
        queuedResolve = null;
        return true;
    };
    returnValue.close = () => {
        if (isClosed) return;
        isClosed = true;
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
        if (queuedResolve) {
            queuedResolve(false);
            queuedResolve = null;
        }
    };
    returnValue.isClosed = () => isClosed;
    return returnValue;
};
