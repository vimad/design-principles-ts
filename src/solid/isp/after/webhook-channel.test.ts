import { describe, it, expect } from 'vitest';
import { WebhookChannel } from './webhook-channel';
import type { MessageSender } from './types';

// WebhookChannel implements one interface. The test file reflects that.
// There are no stubs for batch, schedule, cancel, or getMetrics — they do not exist.
//
// The type-level restriction is demonstrated in the comment below.
// In before/, this restriction did not exist: the compiler accepted a WebhookChannel
// anywhere a NotificationChannel was expected, and the runtime had to catch the lie.

const message = {
  id: 'm1',
  subject: 'Order shipped',
  body: 'Your order is on its way.',
  recipient: 'customer@example.com',
};

describe('WebhookChannel as MessageSender', () => {
  it('sends a message without throwing', () => {
    const channel: MessageSender = new WebhookChannel('https://example.com/hook');
    expect(() => channel.send(message)).not.toThrow();
  });
});

// TypeScript compile-time enforcement — uncomment to see the errors:
//
//   import type { Schedulable, MetricsProvider } from './types';
//
//   const ch = new WebhookChannel('https://example.com/hook');
//
//   const _s: Schedulable = ch;
//   // Error: Property 'schedule' is missing in type 'WebhookChannel'
//   //        but required in type 'Schedulable'.
//
//   const _m: MetricsProvider = ch;
//   // Error: Property 'getMetrics' is missing in type 'WebhookChannel'
//   //        but required in type 'MetricsProvider'.
//
// These errors replace the silent runtime throws from before/.
