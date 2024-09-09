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

import { makeDebouncer } from "../dist/index.cjs";

test("first call to debouncer returns true immediately", async () => {
    const debouncer = makeDebouncer(1000);
    expect(await debouncer()).toBe(true);
});

test("second consecutive call to debouncer returns true", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    const secondCallPromise = debouncer();
    mockedTime += 1000;
    await runIntervals();
    expect(await secondCallPromise).toBe(true);
});

test("second consecutive call to debouncer does not resolve before interval has passed", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    const secondCallPromise = debouncer();
    let isSecondCallResolved = false;
    (async () => {
        await secondCallPromise;
        isSecondCallResolved = true;
    })();
    mockedTime += 999;
    await runIntervals();
    expect(isSecondCallResolved).toBe(false);
});

test("second consecutive call to debouncer resolves immediately when the interval passes", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    const secondCallPromise = debouncer();
    let isSecondCallResolved = false;
    (async () => {
        await secondCallPromise;
        isSecondCallResolved = true;
    })();
    mockedTime += 1000;
    await runIntervals();
    expect(isSecondCallResolved).toBe(true);
});

test("second delayed call to debouncer returns true immediately", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    mockedTime += 1200;
    await runIntervals();
    const secondCallPromise = debouncer();
    expect(await secondCallPromise).toBe(true);
});

test("in three consecutive calls, the second call returns false", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    const secondCallPromise = debouncer();
    debouncer();
    expect(await secondCallPromise).toEqual(false);
});

test("in three consecutive calls, the third call returns true", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    debouncer();
    const thirdCallPromise = debouncer();
    mockedTime += 1000;
    await runIntervals();
    expect(await thirdCallPromise).toBe(true);
});

test("in three consecutive calls, the second call resolves at the exact moment that the third call is made", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    const secondCallPromise = debouncer();
    let timeOfSecondResolution = -1;
    (async () => {
        await secondCallPromise;
        timeOfSecondResolution = mockedTime;
    })();
    mockedTime += 314;
    await runIntervals();
    const timeOfThirdCall = mockedTime;
    debouncer();
    await runIntervals();
    mockedTime += 5000;
    await runIntervals();
    expect(timeOfSecondResolution).toBe(timeOfThirdCall);
});

test("third consecutive call to debouncer does not resolve before interval has passed", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    debouncer();
    const thirdCallPromise = debouncer();
    let isThirdCallResolved = false;
    (async () => {
        await thirdCallPromise;
        isThirdCallResolved = true;
    })();
    mockedTime += 999;
    await runIntervals();
    expect(isThirdCallResolved).toBe(false);
});

test("third consecutive call to debouncer resolves immediately when the interval passes", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    debouncer();
    const thirdCallPromise = debouncer();
    let isThirdCallResolved = false;
    (async () => {
        await thirdCallPromise;
        isThirdCallResolved = true;
    })();
    mockedTime += 1000;
    await runIntervals();
    expect(isThirdCallResolved).toBe(true);
});
