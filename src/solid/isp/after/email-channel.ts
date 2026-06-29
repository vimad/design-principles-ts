import type {
  Message,
  ChannelMetrics,
  MessageSender,
  BatchSender,
  Schedulable,
  MetricsProvider,
} from './types';

// EmailChannel implements all four interfaces because email genuinely supports
// all four capabilities. Implementing more interfaces is not an ISP violation —
// forcing implementations that throw or no-op is.
//
// Callers that only need MessageSender can still accept an EmailChannel,
// because EmailChannel IS a MessageSender.

export class EmailChannel implements MessageSender, BatchSender, Schedulable, MetricsProvider {
  readonly name = 'email';
  private counts = { sent: 0, failed: 0 };

  send(message: Message): void {
    this.counts.sent++;
    console.log(`[Email] ${message.recipient}: ${message.subject}`);
  }

  sendBatch(messages: Message[]): void {
    for (const message of messages) {
      this.send(message);
    }
  }

  schedule(message: Message, deliverAt: Date): string {
    const jobId = `email-${message.id}-${deliverAt.getTime()}`;
    console.log(`[Email] Scheduled "${message.subject}" for ${deliverAt.toISOString()}`);
    return jobId;
  }

  cancel(jobId: string): void {
    console.log(`[Email] Cancelled job ${jobId}`);
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
