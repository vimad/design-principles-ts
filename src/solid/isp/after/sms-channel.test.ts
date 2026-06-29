import { describe, it, expect } from 'vitest';
import { SmsChannel } from './sms-channel';
import type { MessageSender, BatchSender, MetricsProvider } from './types';

// SmsChannel implements three interfaces. The test proves each one works
// in isolation. There is no Schedulable test — because SmsChannel is not one.
//
// In before/, any test that exercised an SmsChannel via NotificationChannel had
// to deal with schedule() and cancel() throwing. Here there is nothing to deal with.

const message = {
  id: 'm1',
  subject: 'Your code',
  body: '123456',
  recipient: '+15550001234',
};

describe('SmsChannel as MessageSender', () => {
  it('sends a message', () => {
    const channel: MessageSender = new SmsChannel();
    expect(() => channel.send(message)).not.toThrow();
  });
});

describe('SmsChannel as BatchSender', () => {
  it('sends all messages in the batch', () => {
    const channel: BatchSender = new SmsChannel();
    const messages = [message, { ...message, id: 'm2', recipient: '+15550009876' }];
    expect(() => channel.sendBatch(messages)).not.toThrow();
  });
});

describe('SmsChannel as MetricsProvider', () => {
  it('starts with zero counts and full delivery rate', () => {
    const channel: MetricsProvider = new SmsChannel();
    const metrics = channel.getMetrics();
    expect(metrics.sent).toBe(0);
    expect(metrics.failed).toBe(0);
    expect(metrics.deliveryRate).toBe(1);
  });

  it('tracks sent count across send and sendBatch', () => {
    const channel = new SmsChannel();
    channel.send(message);
    channel.sendBatch([message, message]);
    expect(channel.getMetrics().sent).toBe(3);
  });
});
