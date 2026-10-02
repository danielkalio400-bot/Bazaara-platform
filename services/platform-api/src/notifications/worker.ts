import { processNotificationDeliveries } from "./service.js";

export function startNotificationWorker(input: { intervalMs?: number; log?: { info: (...args: any[]) => void; error: (...args: any[]) => void } } = {}) {
  const intervalMs = Math.max(5_000, input.intervalMs ?? 15_000);
  let stopped = false;
  let running = false;

  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      const result = await processNotificationDeliveries(50);
      if (result.processed > 0) input.log?.info({ processed: result.processed }, "Notification delivery batch processed");
    } catch (error) {
      input.log?.error({ err: error }, "Notification delivery worker failed");
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => { void tick(); }, intervalMs);
  timer.unref?.();
  void tick();
  return () => { stopped = true; clearInterval(timer); };
}
