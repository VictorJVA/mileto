import { useCallback, useRef, useState } from "react";

/** Runs an async call with busy and error state, returning its result (or undefined on error). */
export function useCall() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const last = useRef<(() => Promise<unknown>) | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    last.current = fn;
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e);
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  /** Repeats the last call, e.g. after the connection comes back. */
  const retry = useCallback(() => {
    if (last.current) void run(last.current);
  }, [run]);

  return { busy, error, run, retry };
}
