let mockedTime = 0;
let nextMockedIntervalId = 1;

let mockedIntervals: {
    f: () => void;
    delay: number;
    nextRunTime: number;
    id: number;
}[] = [];

const sortMockedIntervals = () => {
    mockedIntervals.sort((a, b) => a.nextRunTime - b.nextRunTime);
};

const runIntervals = async () => {
    while (
        mockedIntervals.length > 0 &&
        mockedIntervals[0].nextRunTime <= mockedTime
    ) {
        const interval = mockedIntervals[0];
        interval.f();
        interval.nextRunTime = mockedTime + interval.delay;
        sortMockedIntervals();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
};

// @ts-ignore
globalThis.setInterval = (f, delay) => {
    const id = nextMockedIntervalId;
    nextMockedIntervalId++;
    mockedIntervals.push({
        f,
        delay,
        nextRunTime: mockedTime + delay,
        id,
    });
    sortMockedIntervals();
    return id;
};

// @ts-ignore
globalThis.clearInterval = (id) => {
    mockedIntervals = mockedIntervals.filter((e) => e.id !== id);
};

import { makeThrottler } from "../dist/index.cjs";

const initIsolatedTest = () => {
    mockedTime = 0;
    nextMockedIntervalId = 1;
    mockedIntervals = [];
    return makeThrottler(1000);
};

test("first call to throttler returns true immediately", async () => {
    const throttler = initIsolatedTest();
    expect(await throttler()).toBe(true);
});

test("second consecutive call to throttler returns true", async () => {
    const throttler = initIsolatedTest();
    throttler();
    const secondCallPromise = throttler();
    mockedTime += 1000;
    await runIntervals();
    expect(await secondCallPromise).toBe(true);
});

test("second consecutive call to throttler does not resolve before interval has passed", async () => {
    const throttler = initIsolatedTest();
    throttler();
    const secondCallPromise = throttler();
    let isSecondCallResolved = false;
    (async () => {
        await secondCallPromise;
        isSecondCallResolved = true;
    })();
    mockedTime += 999;
    await runIntervals();
    expect(isSecondCallResolved).toBe(false);
});

test("second consecutive call to throttler resolves immediately when the interval passes", async () => {
    const throttler = initIsolatedTest();
    throttler();
    const secondCallPromise = throttler();
    let isSecondCallResolved = false;
    (async () => {
        await secondCallPromise;
        isSecondCallResolved = true;
    })();
    mockedTime += 1000;
    await runIntervals();
    expect(isSecondCallResolved).toBe(true);
});

test("second delayed call to throttler returns true immediately", async () => {
    const throttler = initIsolatedTest();
    throttler();
    mockedTime += 1200;
    await runIntervals();
    const secondCallPromise = throttler();
    expect(await secondCallPromise).toBe(true);
});

test("in three consecutive calls, the second call returns false", async () => {
    const throttler = initIsolatedTest();
    throttler();
    const secondCallPromise = throttler();
    throttler();
    expect(await secondCallPromise).toEqual(false);
});

test("in three consecutive calls, the third call returns true", async () => {
    const throttler = initIsolatedTest();
    throttler();
    throttler();
    const thirdCallPromise = throttler();
    mockedTime += 1000;
    await runIntervals();
    expect(await thirdCallPromise).toBe(true);
});

test("in three consecutive calls, the second call resolves at the exact moment that the third call is made", async () => {
    const throttler = initIsolatedTest();
    throttler();
    const secondCallPromise = throttler();
    let timeOfSecondResolution = -1;
    (async () => {
        await secondCallPromise;
        timeOfSecondResolution = mockedTime;
    })();
    mockedTime += 314;
    await runIntervals();
    const timeOfThirdCall = mockedTime;
    throttler();
    await runIntervals();
    mockedTime += 5000;
    await runIntervals();
    expect(timeOfSecondResolution).toBe(timeOfThirdCall);
});

test("third consecutive call to throttler does not resolve before interval has passed", async () => {
    const throttler = initIsolatedTest();
    throttler();
    throttler();
    const thirdCallPromise = throttler();
    let isThirdCallResolved = false;
    (async () => {
        await thirdCallPromise;
        isThirdCallResolved = true;
    })();
    mockedTime += 999;
    await runIntervals();
    expect(isThirdCallResolved).toBe(false);
});

test("third consecutive call to throttler resolves immediately when the interval passes", async () => {
    const throttler = initIsolatedTest();
    throttler();
    throttler();
    const thirdCallPromise = throttler();
    let isThirdCallResolved = false;
    (async () => {
        await thirdCallPromise;
        isThirdCallResolved = true;
    })();
    mockedTime += 1000;
    await runIntervals();
    expect(isThirdCallResolved).toBe(true);
});

test("flush when nothing is queued returns false", async () => {
    const throttler = initIsolatedTest();
    expect(throttler.flush(false)).toBe(false);
});

test("flush when something is queued returns true", async () => {
    const throttler = initIsolatedTest();
    throttler();
    throttler();
    expect(throttler.flush(false)).toBe(true);
});

test("flush(false) causes associated promise to resolve to false immediately", async () => {
    const throttler = initIsolatedTest();
    throttler();
    const secondCallPromise = throttler();
    throttler.flush(false);
    expect(await secondCallPromise).toBe(false);
});

test("flush(true) causes associated promise to resolve to true immediately", async () => {
    const throttler = initIsolatedTest();
    throttler();
    const secondCallPromise = throttler();
    throttler.flush(true);
    expect(await secondCallPromise).toBe(true);
});

test("a new call will not resolve before the flush's interval passes", async () => {
    const throttler = initIsolatedTest();
    throttler();
    throttler();
    mockedTime += 500;
    await runIntervals();
    throttler.flush(false);
    const thirdCallPromise = throttler();
    let isThirdCallResolved = false;
    (async () => {
        await thirdCallPromise;
        isThirdCallResolved = true;
    })();
    mockedTime += 999;
    await runIntervals();
    expect(isThirdCallResolved).toBe(false);
});

test("a new call resolves immediately when flush's interval passes", async () => {
    const throttler = initIsolatedTest();
    throttler();
    throttler();
    mockedTime += 500;
    await runIntervals();
    throttler.flush(false);
    const thirdCallPromise = throttler();
    let isThirdCallResolved = false;
    (async () => {
        await thirdCallPromise;
        isThirdCallResolved = true;
    })();
    mockedTime += 1000;
    await runIntervals();
    expect(isThirdCallResolved).toBe(true);
});

test("close causes queued call to resolve to false immediately", async () => {
    const throttler = initIsolatedTest();
    throttler();
    const secondCallPromise = throttler();
    throttler.close();
    expect(await secondCallPromise).toBe(false);
});

test("close causes future calls to throttler to resolve to false immediately", async () => {
    const throttler = initIsolatedTest();
    throttler();
    throttler();
    throttler.close();
    expect(await throttler()).toBe(false);
});

test("isClosed returns false initially", async () => {
    const throttler = initIsolatedTest();
    expect(throttler.isClosed()).toBe(false);
});

test("isClosed returns true after closing", async () => {
    const throttler = initIsolatedTest();
    throttler.close();
    expect(throttler.isClosed()).toBe(true);
});
