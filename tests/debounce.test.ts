import { resetMockedTime, getMockedTime, advanceMockedTime } from "./mockTime";
import { makeDebouncer } from "../dist/index.cjs";

const initIsolatedTest = () => {
    resetMockedTime();
    return makeDebouncer(1000);
};

test("first call to debouncer returns true at interval time", async () => {
    const debouncer = initIsolatedTest();
    debouncer();
    const firstCallPromise = Promise.any([
        debouncer(),
        new Promise((resolve) =>
            setTimeout(() => {
                resolve("timeout");
            }, 1001),
        ),
    ]);
    advanceMockedTime(1000);
    expect(await firstCallPromise).toBe(true);
});

test("first call to debouncer does not resolve before interval time", async () => {
    const debouncer = initIsolatedTest();
    debouncer();
    const firstCallPromise = Promise.any([
        debouncer(),
        new Promise((resolve) =>
            setTimeout(() => {
                resolve("timeout");
            }, 999),
        ),
    ]);
    advanceMockedTime(998);
    advanceMockedTime(1);
    expect(await firstCallPromise).toBe("timeout");
});

test("second call to debouncer returns true one interval after second call", async () => {
    const debouncer = initIsolatedTest();
    debouncer();
    advanceMockedTime(314);
    const secondCallPromise = Promise.any([
        debouncer(),
        new Promise((resolve) =>
            setTimeout(() => {
                resolve("timeout");
            }, 1001),
        ),
    ]);
    advanceMockedTime(1000);
    expect(await secondCallPromise).toBe(true);
});

test("second call to debouncer does not resolve before interval time", async () => {
    const debouncer = initIsolatedTest();
    debouncer();
    advanceMockedTime(314);
    const secondCallPromise = Promise.any([
        debouncer(),
        new Promise((resolve) =>
            setTimeout(() => {
                resolve("timeout");
            }, 999),
        ),
    ]);
    advanceMockedTime(998);
    advanceMockedTime(1);
    expect(await secondCallPromise).toBe("timeout");
});

test("flush when nothing is queued returns false", async () => {
    const debouncer = initIsolatedTest();
    expect(debouncer.flush(false)).toBe(false);
});

test("flush when something is queued returns true", async () => {
    const debouncer = initIsolatedTest();
    debouncer();
    expect(debouncer.flush(false)).toBe(true);
});

test("flush(false) causes associated promise to resolve to false immediately", async () => {
    const debouncer = initIsolatedTest();
    const firstCallPromise = debouncer();
    debouncer.flush(false);
    expect(await firstCallPromise).toBe(false);
});

test("flush(true) causes associated promise to resolve to true immediately", async () => {
    const debouncer = initIsolatedTest();
    const firstCallPromise = debouncer();
    debouncer.flush(true);
    expect(await firstCallPromise).toBe(true);
});

test("close causes queued call to resolve to false immediately", async () => {
    const debouncer = initIsolatedTest();
    const firstCallPromise = debouncer();
    debouncer.close();
    expect(await firstCallPromise).toBe(false);
});

test("close causes future calls to throttler to resolve to false immediately", async () => {
    const debouncer = initIsolatedTest();
    debouncer();
    debouncer();
    debouncer.close();
    expect(await debouncer()).toBe(false);
});

test("isClosed returns false initially", async () => {
    const debouncer = initIsolatedTest();
    expect(debouncer.isClosed()).toBe(false);
});

test("isClosed returns true after closing", async () => {
    const debouncer = initIsolatedTest();
    debouncer.close();
    expect(debouncer.isClosed()).toBe(true);
});
