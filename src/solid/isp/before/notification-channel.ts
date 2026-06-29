// ISP violated.
//
// NotificationChannel is a "fat" interface that bundles four distinct capabilities:
// sending, batching, scheduling, and metrics reporting.
//
// Real channels support different subsets of these capabilities.
// The interface forces every channel to implement every method — even ones it
// cannot meaningfully support. The result is a codebase full of throw-not-supported
// bodies, silent try/catch swallowing in the service, and a type system that
// promises substitutability it cannot deliver.

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

export interface NotificationChannel {
  readonly name: string;
  send(message: Message): void;
  sendBatch(messages: Message[]): void;
  schedule(message: Message, deliverAt: Date): string; // returns job ID
  cancel(jobId: string): void;
  getMetrics(): ChannelMetrics;
}

// EmailChannel is the one implementation that actually supports everything.
// It sets the illusion that the fat interface is reasonable.
export class EmailChannel implements NotificationChannel {
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
    console.log(`[Email] Scheduled "${message.subject}" at ${deliverAt.toISOString()}`);
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

// SmsChannel cannot schedule — SMS gateways are fire-and-forget.
// It is forced to implement schedule() and cancel() anyway, and must throw.
export class SmsChannel implements NotificationChannel {
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

  // FORCED STUB — SMS gateways do not support scheduled delivery.
  // NotificationService must try/catch this or check instanceof to use scheduling.
  schedule(_message: Message, _deliverAt: Date): string {
    throw new Error('SMS channel does not support scheduled delivery');
  }

  // FORCED STUB — nothing to cancel if nothing was scheduled.
  cancel(_jobId: string): void {
    throw new Error('SMS channel does not support scheduled delivery');
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

// WebhookChannel fires individual HTTP POST requests.
// It cannot batch (each webhook is a separate HTTP call with its own response),
// cannot schedule, and has no delivery metrics — it's fire-and-forget.
export class WebhookChannel implements NotificationChannel {
  readonly name = 'webhook';

  constructor(private readonly url: string) {}

  send(message: Message): void {
    console.log(`[Webhook] POST ${this.url} — ${message.subject} → ${message.recipient}`);
  }

  // FORCED STUB — loops over individual sends. Semantically wrong: callers
  // that pass a batch expect one HTTP round-trip, not N.
  sendBatch(messages: Message[]): void {
    for (const message of messages) {
      this.send(message);
    }
  }

  // FORCED STUB — HTTP webhooks are triggered by the caller; they cannot be scheduled.
  schedule(_message: Message, _deliverAt: Date): string {
    throw new Error('Webhook channel does not support scheduling');
  }

  // FORCED STUB
  cancel(_jobId: string): void {
    throw new Error('Webhook channel does not support scheduling');
  }

  // FORCED STUB — webhooks have no delivery confirmation or tracking.
  getMetrics(): ChannelMetrics {
    throw new Error('Webhook channel does not provide metrics');
  }
}
