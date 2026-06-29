import type {
  Message,
  ChannelMetrics,
  MessageSender,
  BatchSender,
  Schedulable,
  MetricsProvider,
} from './types';

// Each method declares the narrowest parameter type it actually needs.
//
// scheduleCampaign accepts Schedulable[] — SmsChannel and WebhookChannel cannot be passed.
// collectMetrics accepts MetricsProvider[] — WebhookChannel cannot be passed.
//
// There are no try/catch blocks. No silent partial execution. No data loss.
// The type system enforces capability contracts at the call site, not at runtime.

export class NotificationService {
  broadcast(senders: MessageSender[], message: Message): void {
    for (const sender of senders) {
      sender.send(message);
    }
  }

  broadcastBatch(senders: BatchSender[], messages: Message[]): void {
    for (const sender of senders) {
      sender.sendBatch(messages);
    }
  }

  // Only callable with channels that implement Schedulable.
  // The compiler rejects SmsChannel and WebhookChannel at the call site.
  // Returns one job ID per channel — no silent skips.
  scheduleCampaign(channels: Schedulable[], message: Message, deliverAt: Date): string[] {
    return channels.map((ch) => ch.schedule(message, deliverAt));
  }

  // Returns exactly one ChannelMetrics per provider — no silent data loss.
  collectMetrics(providers: MetricsProvider[]): ChannelMetrics[] {
    return providers.map((p) => p.getMetrics());
  }
}
