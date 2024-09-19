# dlox

A lightweight, promise-based debouncing and throttling library designed to help you build fast and responsive user interfaces in JavaScript and TypeScript applications.

Unlike traditional callback-based approaches, dlox leverages promises to offer several key advantages:

-   Simplified Asynchronous Control Flow: Promises provide a cleaner and more intuitive way to manage asynchronous operations, making it easier to reason about debouncing and throttling logic.
-   Improved Readability: The declarative style of promises often leads to more concise and readable code, enhancing maintainability.
-   Integration with Modern JavaScript Features: dlox seamlessly integrates with other modern JavaScript features like async/await, making it a great fit for contemporary web development.

By using dlox, you can effectively manage asynchronous tasks in your applications, resulting in improved performance, responsiveness, and overall user experience.

Jump to:

-   [Installation](#installation)
-   [Basic Usage Examples](#basic-usage-examples)
-   [API](#api)

## Installation

```bash
npm install dlox
```

## Basic Usage Examples

### Debouncing

```typescript
import { makeDebouncer } from "dlox";

// Make a debouncer that waits 100 ms for the user to finish their input.
const debouncer = makeDebouncer(100);

async function myDebouncedFunction() {
    const isTheUserDoneWithInput = await debouncer();

    if (!isTheUserDoneWithInput) {
        // Another thread is going to execute the debounced code.
        // Do cleanup operations and exit gracefully.
        return;
    }

    // Place debounced code here.
    // This section of code runs once when the user has finished their input
}
```

### Throttling

```typescript
import { makeThrottler } from "dlox";

// Make a throttler that spaces consecutive executions
// of the throttled code at least 100 ms apart.
const throttler = makeThrottler(100);

async function myThrottledFunction() {
    // If the most recent execution of the throttled code was less than
    // 100 ms ago, wait until the 100 ms are up, and then keep running.
    // If multiple threads are waiting for the 100 ms to be up,
    // the thread that started waiting last runs the throttled code.
    const isThisTheLastThreadToStartWaiting = await throttler();

    if (!isThisTheLastThreadToStartWaiting) {
        // Another thread is going to execute the throttled code.
        // Do cleanup operations and exit gracefully.
        return;
    }

    // Place throttled code here.
    // This section of code runs at most every 100 ms.
}
```

## API

dlox keeps things simple, there's only two exported functions, and one exported TypeScript type.

```typescript
import { makeDebouncer, makeThrottler } from "dlox";
import type { RateControl } from "dlox";
```

API Contents:

-   [makeDebouncer](#makedebouncer)
-   [makeThrottler](#makethrottler)
-   [RateControl()](#ratecontrol)
    -   [Order and timing for a debouncer](#order-and-timing-for-a-debouncer)
    -   [Order and timing for a throttler](#order-and-timing-for-a-throttler)
-   [RateControl.flush()](#ratecontrolflush)
-   [RateControl.close()](#ratecontrolclose)
-   [RateControl.isClosed()](#ratecontrolisclosed)

### makeDebouncer

```typescript
makeDebouncer(intervalMs: number): RateControl
```

Construct a new `RateControl` instance that acts as a debouncer.

`intervalMs` is the number of milliseconds of inactivity that the debouncer looks for before running the debounced code.

### makeThrottler

```typescript
makeThrottler(intervalMs: number): RateControl
```

Construct a new `RateControl` instance that acts as a throttler.

`intervalMs` is the number of milliseconds that the throttler waits between consecutive executions of the throttled code.

### RateControl()

```typescript
RateControl(): Promise<boolean>
```

`RateControl` instances are callable. The promise returned from calling a `RateControl` instance indicates whether the caller has permission to run a section of debounced/throttled code.
The promise is guaranteed to resolve.

If the promise resolves to `true` then the caller has permission to run the debounced/throttled code immediately. dlox schedules the resolution time of promises that resolve to `true` such that the debounced/throttled code runs at the appropriate time and frequency.

If the promise resolves to `false` then the caller does not have permission to run the debounced/throttled code. When a caller receives a promise that resolves to `false`, the caller should abandon the debounced/throttled code; dlox assigns another thread to run the debounced/throttled code. dlox does not schedule the resolution time for promises that resolve to `false`.

#### Order and timing for a debouncer

The last call to a debouncer before a long break of no calls returns a promise that resolves to `true`. All other calls return promises that resolve to `false`.

As an example, assume that there are three `RateControl()` calls to a debouncer with an interval wait time of 100 ms. Assume that these calls happen at 0 ms, 10 ms, and 150 ms.

1. The promise for the first call resolves to `false` because another call, the call at 10 ms, happens in the 100 ms after the first call is made.
2. The promise for the call at 10 ms resolves to `true` at 110 ms because there are no other calls in the 100 ms range from 10 ms to 110 ms.
3. The promise for the call at 150 ms resolves to `true` at 250 ms because there are no other calls in the 100 ms range from 150 ms to 250 ms.

#### Order and timing for a throttler

The first call to a throttler after a long break, including the first call after the `RateControl` is constructed, returns a promise that resolves to `true` immediately. This allows reactive interfaces to show a result immediately after the user begins to their input. This first call after a break sets a periodic interval. At the end of each interval, the throttler takes the most recent call and resolves the associated promise to `true`. All other promises resolve to `false`.

As an example, assume that there are five `RateControl()` calls to a throttler with an interval wait time of 100 ms. Assume that these calls happen at 0 ms, 10 ms, 20 ms, 30 ms, and 120 ms.

1. The promise for the first call resolves to `true` immediately. This call creates a 100 ms cycle.
2. The promises for the calls at 10 ms and 20 ms resolve to `false`. This is because the call at 30 ms occurs after the these two calls but before the end of the interval cycle at 100 ms. You can think of the call at 30 ms as blocking the calls at 10 ms and 20 ms.
3. The call at 30 ms resolves to `true` at 100 ms. This is because there are no other calls between the call at 30 ms and the end of the interval cycle at 100 ms
4. The call at 120 ms resolves to `true` at 200 ms. This is because the throttler must wait until the end of the next interval cycle at 200 ms before resolving another promise to `true`.

### RateControl.flush()

```typescript
RateControl.flush(value: boolean): boolean
```

`RateControl.flush` forces immediate resolution the current queued thread. This allows for immediate execution of a debounced/throttled section, or for the cancellation of a queued thread.

The parameter `value` is the value that the outstanding promise resolves to. `RateControl.flush(true)` tells the thread that called `RateControl()` to run the debounced/throttled code immediately. `RateControl.flush(false)` tells the thread that called `RateControl()` to abandon the debounced/throttled code.

If all promises returned from `RateControl()` have already been resolved, then `RateControl.flush` has no effect. `RateControl.flush` returns `true` if there was an outstanding promise to resolve, and `false` otherwise.

If `RateControl.flush` resolves the current queued thread, then the `RateControl` ensures that the next execution of the debounced/throttled code occurs no sooner than one interval wait time after the call to `RateControl.flush`.

### RateControl.close()

```typescript
RateControl.close(): void
```

`RateControl.close` is a hint to a `RateControl` instance that the code it debounces/throttles is no longer needed. While calling `RateControl.close` is optional, it may provide performance benefits in some cases.

The target use case of `RateControl.close` is client-side navigations in a browser. Without calling `RateControl.close`, a `RateControl` may schedule debounced/throttled code from one page to run after the user has navigated to an unrelated page. In such a case, the debounced/throttled code would still run, but the browser would discard the output, wasting resources.

`RateControl.close` causes all of the `RateControl`'s outstanding promises to resolve immediately with a value of `false` and all future calls to `RateControl()` to resolve to `false`. In the case of a client-side navigation, you should call `RateControl.close` at the start of the navigation.

Closing a `RateControl` is permanent and cannot be undone, however you can always create a new `RateControl` with `makeDebouncer` and `makeThrottler`.

### RateControl.isClosed()

```typescript
RateControl.isClosed(): boolean
```

`RateControl.isClosed` returns `true` if `RateControl.close` has been called on this `RateControl` instance and returns `false` otherwise.

## More Examples

### Debouncing a search API in React

```javascript
import { useState, useEffect } from 'react';
import { makeDebouncer } from 'dlox';

function SearchDebouncer({ doSearch }) {
  // Debounce for 500ms
  const [searchDebouncer] = useState(makeDebouncer(500));
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState('');

  // close the debouncer when the component unmounts
  useEffect(()=>{
    return ()=>{
        searchDebouncer.close()
    }
  }, []);

  // run a search on the backend after the user has
  // finished their input
  useEffect(() => {
    const asyncEffect = () => {
        if (!(await searchDebouncer())) return
        const results = await doSearch(query);
        setSearchResults(results);
    }
    asyncEffect()
  }, [query, doSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
    <p>{searchResults}</p>
  );
}

export default SearchDebouncer;
```

### Throttling infinite scrolling in JavaScript

```javascript
import { makeThrottler } from "dlox";

// Throttle at a period of 500 ms
const throttler = makeThrottler(500);

async function loadMoreContent() {
    // Fetch more content from the backend API
    const newContent = await fetchMoreContent();
    // Append new content to the DOM
    appendContentToDOM(newContent);
}

// Attach loadMoreContent function to scroll event, using the throttler
window.addEventListener("scroll", async () => {
    if (isAtBottomOfPage()) {
        if (!(await throttler())) return;
        await loadMoreContent();
    }
});
```
