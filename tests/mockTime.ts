const trueTimeout = globalThis.setTimeout;

let mockedTime = 0;
let nextMockedIntervalId = 1;

let mockedIntervals: {
    f: () => void;
    delay: number;
    nextRunTime: number;
    id: number;
}[] = [];

export const resetMockedTime = () => {
    mockedTime = 0;
    nextMockedIntervalId = 1;
    mockedIntervals = [];
};

export const getMockedTime = () => mockedTime;

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
        if (interval.delay > 0) {
            interval.nextRunTime = mockedTime + interval.delay;
            sortMockedIntervals();
        } else {
            clearTimeout(interval.id);
        }
    }
    await new Promise((resolve) => trueTimeout(resolve, 50));
};

export const advanceMockedTime = async (ms: number) => {
    mockedTime += ms;
    await runIntervals();
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
globalThis.setTimeout = (f, delay) => {
    const id = nextMockedIntervalId;
    nextMockedIntervalId++;
    mockedIntervals.push({
        f,
        delay: -1,
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

// @ts-ignore
globalThis.clearTimeout = globalThis.clearInterval;
