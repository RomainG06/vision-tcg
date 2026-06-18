export class ScrapeAlreadyRunningError extends Error {
  constructor(status) {
    super('A scrape job is already running');
    this.name = 'ScrapeAlreadyRunningError';
    this.statusCode = 409;
    this.status = status;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function serializeError(error) {
  return {
    error: 'Scrape failed',
    message: error?.message || 'Unknown scrape error',
  };
}

export function createScrapeJobManager({ startScrape }) {
  let running = false;
  let current = null;
  let last = null;

  return {
    async start(payload = {}) {
      if (running) {
        throw new ScrapeAlreadyRunningError(this.getStatus());
      }

      running = true;
      current = {
        state: 'running',
        started_at: nowIso(),
        filters: payload.filters || {},
        sources: payload.sources || [],
      };

      try {
        const result = await startScrape(payload);
        last = {
          state: 'idle',
          last_status: result?.status || 'completed',
          completed_at: nowIso(),
          stats: result?.stats || null,
        };
        return result;
      } catch (error) {
        const failed = {
          status: 'failed',
          ...serializeError(error),
          errors: [{ type: 'fatal_error', message: error?.message || 'Unknown scrape error' }],
        };
        last = {
          state: 'idle',
          last_status: 'failed',
          completed_at: nowIso(),
          error: failed.message,
        };
        return failed;
      } finally {
        running = false;
        current = null;
      }
    },

    getStatus() {
      if (running) return { ...current };
      return last || { state: 'idle', last_status: null };
    },
  };
}
