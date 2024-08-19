import { makeDebouncer } from "../dist/index.cjs";

test("first call to debouncer returns true", async () => {
    const debouncer = makeDebouncer(1000);
    expect(await debouncer()).toEqual(true);
});

test("first call to debouncer resolves immediately", async () => {
    const debouncer = makeDebouncer(1000);
    const start = Date.now();
    await debouncer();
    const delta = Date.now() - start;
    expect(delta).toBeLessThan(200);
});

test("second consecutive call to debouncer returns true", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    expect(await debouncer()).toEqual(true);
});

test("second consecutive call to debouncer resolves after interval has passed", async () => {
    const debouncer = makeDebouncer(1000);
    const start = Date.now();
    debouncer();
    await debouncer();
    const delta = Date.now() - start;
    expect(delta).toBeGreaterThan(950);
});

test("second consecutive call to debouncer resolves immediately when the interval passes", async () => {
    const debouncer = makeDebouncer(1000);
    const start = Date.now();
    debouncer();
    await debouncer();
    const delta = Date.now() - start;
    expect(delta).toBeLessThan(1200);
});

test("second delayed call to debouncer returns true", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(await debouncer()).toEqual(true);
});

test("second delayed call to debouncer resolves immediately", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const start = Date.now();
    await debouncer();
    const delta = Date.now() - start;
    expect(delta).toBeLessThan(200);
});

test("in three consecutive calls, the second call returns false", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    const secondPromise = debouncer();
    debouncer();
    expect(await secondPromise).toEqual(false);
});

test("in three consecutive calls, the third call returns true", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    debouncer();
    expect(await debouncer()).toEqual(true);
});

test("in three consecutive calls, the second call resolves after the third call is made", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    const timeOfSecondResolvePromise = (async (
        promiseTwo: Promise<boolean>,
    ) => {
        await promiseTwo;
        return Date.now();
    })(debouncer());
    // add a delay between the second and third calls
    // so that if the second resolves immediately,
    // that resolution occurs before the third call
    await new Promise((resolve) => setTimeout(resolve, 300));
    const timeOfThirdCall = Date.now();
    debouncer();
    expect(await timeOfSecondResolvePromise).toBeGreaterThanOrEqual(
        timeOfThirdCall,
    );
});

test("in three consecutive calls, when the third call is made, the second call resolves immediately", async () => {
    const debouncer = makeDebouncer(1000);
    debouncer();
    const timeOfSecondResolvePromise = (async (
        promiseTwo: Promise<boolean>,
    ) => {
        await promiseTwo;
        return Date.now();
    })(debouncer());
    await new Promise((resolve) => setTimeout(resolve, 300));
    const timeOfThirdCall = Date.now();
    debouncer();
    expect(await timeOfSecondResolvePromise).toBeLessThan(
        timeOfThirdCall + 200,
    );
});

test("in three consecutive calls, the third call resolves after interval has passed", async () => {
    const debouncer = makeDebouncer(1000);
    const start = Date.now();
    debouncer();
    debouncer();
    await debouncer();
    const delta = Date.now() - start;
    expect(delta).toBeGreaterThan(950);
});

test("in three consecutive calls, the third call resolves immediately when the interval passes", async () => {
    const debouncer = makeDebouncer(1000);
    const start = Date.now();
    debouncer();
    debouncer();
    await debouncer();
    const delta = Date.now() - start;
    expect(delta).toBeLessThan(1200);
});
