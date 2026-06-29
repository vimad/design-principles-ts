// Four focused interfaces replace one fat interface.
// Each interface represents exactly one capability — no more.
// Implementors adopt only the interfaces they can genuinely honour.
// Callers declare only the capabilities they actually need.

export interface Message {
  readonly id: string;
  readonly subject: string;
  readonly body: string;
  readonly recipient: string;
}

export interface ChannelMetrics {
  readonly sent: number;
  readonly failed: number;
  readonly deliveryRate: number;
}

// Every channel that can send a single message.
export interface MessageSender {
  readonly name: string;
  send(message: Message): void;
}

// Channels that support efficient multi-message delivery in one call.
// WebhookChannel does NOT implement this — it cannot batch HTTP calls.
export interface BatchSender {
  sendBatch(messages: Message[]): void;
}

// Channels with a built-in scheduler (schedule/cancel round-trip).
// SmsChannel and WebhookChannel do NOT implement this — they are fire-and-forget.
export interface Schedulable {
  schedule(message: Message, deliverAt: Date): string; // returns job ID
  cancel(jobId: string): void;
}

// Channels that track delivery outcomes and expose them.
// WebhookChannel does NOT implement this — it has no delivery confirmation.
export interface MetricsProvider {
  getMetrics(): ChannelMetrics;
}
