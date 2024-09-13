export type RateControl = {
    (): Promise<boolean>;
    flush: (value: boolean) => boolean;
    close: () => void;
    isClosed: () => boolean;
};

type Resolver = (value: boolean) => void;

export const makeDebouncer = (intervalMs: number): RateControl => {
    let isClosed = false;
    let queuedExecution: {
        timeoutId: NodeJS.Timeout;
        resolve: Resolver;
    } | null = null;
    const dequeue = () => {
        queuedExecution!.resolve(true);
        queuedExecution = null;
    };
    const enqueue = (resolve: Resolver) => {
        if (isClosed) {
            resolve(false);
            return;
        }
        if (queuedExecution) {
            clearTimeout(queuedExecution.timeoutId);
            queuedExecution.resolve(false);
        }
        queuedExecution = {
            timeoutId: setTimeout(dequeue, intervalMs),
            resolve,
        };
    };
    const returnValue = () => new Promise(enqueue);
    returnValue.flush = (value: boolean): boolean => {
        if (queuedExecution === null) return false;
        clearTimeout(queuedExecution.timeoutId);
        queuedExecution.resolve(value);
        queuedExecution = null;
        return true;
    };
    returnValue.close = () => {
        if (isClosed) return;
        isClosed = true;
        if (queuedExecution) {
            clearTimeout(queuedExecution.timeoutId);
            queuedExecution.resolve(false);
            queuedExecution = null;
        }
    };
    returnValue.isClosed = () => isClosed;
    return returnValue;
};

export const makeThrottler = (intervalMs: number): RateControl => {
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
