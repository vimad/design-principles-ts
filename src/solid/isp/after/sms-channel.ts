import type { Message, ChannelMetrics, MessageSender, BatchSender, MetricsProvider } from './types';

// SmsChannel: send, batch, and metrics — no scheduling.
//
// The absence of Schedulable from the implements clause IS the ISP fix.
// There are no stubs, no throw-not-supported bodies, no lies.
// Any code that needs scheduling must declare Schedulable and will discover
// at compile time that SmsChannel is not an acceptable argument.

export class SmsChannel implements MessageSender, BatchSender, MetricsProvider {
  readonly name = 'sms';
  private counts = { sent: 0, failed: 0 };

  send(message: Message): void {
    this.counts.sent++;
    console.log(`[SMS] ${message.recipient}: ${message.body.slice(0, 160)}`);
  }

  sendBatch(messages: Message[]): void {
    for (const message of messages) {
      this.send(message);
    }
  }

  getMetrics(): ChannelMetrics {
    const total = this.counts.sent + this.counts.failed;
    return {
      sent: this.counts.sent,
      failed: this.counts.failed,
      deliveryRate: total === 0 ? 1 : this.counts.sent / total,
    };
  }
}
