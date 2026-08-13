const STREAM_ABORT_DELAY_MS = 10_000;

export type ReactReadableStream = ReadableStream & { allReady: Promise<void> };

export async function waitForAllReady(stream: ReactReadableStream) {
  const safeAllReady = stream.allReady.catch(() => {});

  const timeout = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      void stream.cancel();
      reject(new Error("timed out streaming server render"));
    }, STREAM_ABORT_DELAY_MS);

    void safeAllReady.finally(() => clearTimeout(timer));
  });

  await Promise.race([stream.allReady, timeout]);
}
