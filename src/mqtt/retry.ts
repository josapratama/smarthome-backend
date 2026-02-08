export type RetryOptions = {
  retries: number; // jumlah retry, mis 3
  delaysMs: number[]; // backoff, mis [500, 1000, 2000]
  shouldRetry?: (err: unknown) => boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      const retryable = opts.shouldRetry ? opts.shouldRetry(err) : true;
      const isLast = attempt === opts.retries;
      if (!retryable || isLast) break;

      const delay =
        opts.delaysMs[Math.min(attempt, opts.delaysMs.length - 1)] ?? 0;
      if (delay > 0) await sleep(delay);
    }
  }

  throw lastErr;
}
