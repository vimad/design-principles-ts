import type { Message, NotificationChannel, ChannelMetrics } from './notification-channel';

// NotificationService is forced to defend against its own interface.
//
// The fat NotificationChannel interface promises that every channel supports scheduling
// and metrics. That promise is false for SmsChannel and WebhookChannel. So every method
// that uses those capabilities must wrap calls in try/catch to suppress the exceptions.
//
// Two concrete harms:
//   scheduleCampaign — silently skips channels that throw. Callers have no way to know
//     how many channels actually scheduled the message. Partial execution with no signal.
//   collectMetrics — silently drops results from channels that throw. Callers expect one
//     ChannelMetrics per channel; they get fewer, with no indication of which are missing.

export class NotificationService {
  constructor(private readonly channels: NotificationChannel[]) {}

  broadcast(message: Message): void {
    for (const channel of this.channels) {
      channel.send(message);
    }
  }

  broadcastBatch(messages: Message[]): void {
    for (const channel of this.channels) {
      channel.sendBatch(messages);
    }
  }

  // Silent partial execution.
  // The type says all channels can schedule. The runtime disagrees for two of three.
  // Callers see no error and have no idea which channels were skipped.
  scheduleCampaign(message: Message, deliverAt: Date): void {
    for (const channel of this.channels) {
      try {
        channel.schedule(message, deliverAt);
      } catch {
        // channel doesn't support scheduling — silently ignored
      }
    }
  }

  // Silent data loss.
  // Callers expect one ChannelMetrics per channel. They get however many don't throw.
  collectMetrics(): ChannelMetrics[] {
    const results: ChannelMetrics[] = [];
    for (const channel of this.channels) {
      try {
        results.push(channel.getMetrics());
      } catch {
        // channel doesn't support metrics — silently dropped
      }
    }
    return results;
  }
}
