import type { Message, MessageSender } from './types';

// WebhookChannel: send only.
//
// The class is intentionally small. That IS the point.
// In before/, WebhookChannel was ~40 lines: 15 lines of stubs that threw, one
// sendBatch loop that misrepresented batching semantics, and the real logic buried within.
//
// Here the class surface area matches the real capability: one method, one responsibility.

export class WebhookChannel implements MessageSender {
  readonly name = 'webhook';

  constructor(private readonly url: string) {}

  send(message: Message): void {
    console.log(`[Webhook] POST ${this.url} — ${message.subject} → ${message.recipient}`);
  }
}
