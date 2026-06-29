import { describe, it, expect } from 'vitest';
import { EmailChannel } from './email-channel';
import type { MessageSender, BatchSender, Schedulable, MetricsProvider } from './types';

// All four capability interfaces are tested independently.
// This is possible because ISP split the fat interface: each concern is now
// a separate type that can be tested without the others.

const message = {
  id: 'm1',
  subject: 'Monthly digest',
  body: 'Here is your digest.',
  recipient: 'user@example.com',
};

describe('EmailChannel as MessageSender', () => {
  it('sends a message', () => {
    const channel: MessageSender = new EmailChannel();
    expect(() => channel.send(message)).not.toThrow();
  });
});

describe('EmailChannel as BatchSender', () => {
  it('sends all messages in the batch', () => {
    const channel: BatchSender = new EmailChannel();
    const messages = [message, { ...message, id: 'm2', recipient: 'other@example.com' }];
    expect(() => channel.sendBatch(messages)).not.toThrow();
  });
});

describe('EmailChannel as Schedulable', () => {
  it('returns a job ID when scheduled', () => {
    const channel: Schedulable = new EmailChannel();
    const jobId = channel.schedule(message, new Date('2025-06-01'));
    expect(typeof jobId).toBe('string');
    expect(jobId.length).toBeGreaterThan(0);
  });

  it('cancel does not throw for a valid job ID', () => {
    const channel: Schedulable = new EmailChannel();
    const jobId = channel.schedule(message, new Date('2025-06-01'));
    expect(() => channel.cancel(jobId)).not.toThrow();
  });
});

describe('EmailChannel as MetricsProvider', () => {
  it('starts with zero counts and full delivery rate', () => {
    const channel: MetricsProvider = new EmailChannel();
    const metrics = channel.getMetrics();
    expect(metrics.sent).toBe(0);
    expect(metrics.failed).toBe(0);
    expect(metrics.deliveryRate).toBe(1);
  });

  it('increments sent count after each send', () => {
    const channel = new EmailChannel();
    channel.send(message);
    channel.send(message);
    const metrics = channel.getMetrics();
    expect(metrics.sent).toBe(2);
    expect(metrics.deliveryRate).toBe(1);
  });
});
