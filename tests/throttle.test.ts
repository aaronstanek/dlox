import { resetMockedTime, getMockedTime, advanceMockedTime } from "./mockTime";
import { makeThrottler } from "../dist/index.cjs";

const initIsolatedTest = () => {
    resetMockedTime();
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
    await advanceMockedTime(1000);
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
    await advanceMockedTime(999);
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
    await advanceMockedTime(1000);
    expect(isSecondCallResolved).toBe(true);
});

test("second delayed call to throttler returns true immediately", async () => {
    const throttler = initIsolatedTest();
    throttler();
    await advanceMockedTime(1200);
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
    await advanceMockedTime(1000);
    expect(await thirdCallPromise).toBe(true);
});

test("in three consecutive calls, the second call resolves at the exact moment that the third call is made", async () => {
    const throttler = initIsolatedTest();
    throttler();
    const secondCallPromise = throttler();
    let timeOfSecondResolution = -1;
    (async () => {
        await secondCallPromise;
        timeOfSecondResolution = getMockedTime();
    })();
    advanceMockedTime(314);
    const timeOfThirdCall = getMockedTime();
    throttler();
    await advanceMockedTime(0);
    await advanceMockedTime(5000);
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
    await advanceMockedTime(999);
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
    await advanceMockedTime(1000);
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
    await advanceMockedTime(500);
    throttler.flush(false);
    const thirdCallPromise = throttler();
    let isThirdCallResolved = false;
    (async () => {
        await thirdCallPromise;
        isThirdCallResolved = true;
    })();
    await advanceMockedTime(999);
    expect(isThirdCallResolved).toBe(false);
});

test("a new call resolves immediately when flush's interval passes", async () => {
    const throttler = initIsolatedTest();
    throttler();
    throttler();
    advanceMockedTime(500);
    throttler.flush(false);
    const thirdCallPromise = throttler();
    let isThirdCallResolved = false;
    (async () => {
        await thirdCallPromise;
        isThirdCallResolved = true;
    })();
    await advanceMockedTime(1000);
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
