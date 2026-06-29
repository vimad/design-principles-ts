import { describe, it, expect, vi } from 'vitest';
import { NotificationService } from './notification-service';
import type { NotificationChannel, Message } from './notification-channel';

// Test friction from the fat interface:
//
// Every mock must implement ALL five methods, even when the test only cares about one.
// A test for broadcast() must still stub schedule(), cancel(), and getMetrics() —
// methods that have nothing to do with sending.
//
// This noise is not a test-writing problem. It is ISP surfacing in test setup:
// the interface is wider than any single concern, so every stub must cover the gap.

const mockMessage: Message = {
  id: 'm1',
  subject: 'Hello',
  body: 'World',
  recipient: 'user@example.com',
};

function makeChannel(overrides: Partial<NotificationChannel> = {}): NotificationChannel {
  return {
    name: 'mock',
    send: vi.fn(),
    sendBatch: vi.fn(),
    // Every mock must stub schedule() and cancel() even if the test never touches them.
    schedule: vi.fn(() => {
      throw new Error('not supported');
    }),
    cancel: vi.fn(() => {
      throw new Error('not supported');
    }),
    getMetrics: vi.fn(() => {
      throw new Error('not supported');
    }),
    ...overrides,
  };
}

describe('NotificationService (before)', () => {
  it('broadcast sends to all channels', () => {
    const ch1 = makeChannel();
    const ch2 = makeChannel();
    const service = new NotificationService([ch1, ch2]);

    service.broadcast(mockMessage);

    expect(ch1.send).toHaveBeenCalledWith(mockMessage);
    expect(ch2.send).toHaveBeenCalledWith(mockMessage);
  });

  it('scheduleCampaign silently skips channels that do not support scheduling', () => {
    const schedulable = makeChannel({ schedule: vi.fn(() => 'job-123') });
    const nonSchedulable = makeChannel(); // throws for schedule
    const service = new NotificationService([schedulable, nonSchedulable]);

    // Does not throw — the service swallows the error silently.
    // The caller cannot tell that nonSchedulable was skipped.
    expect(() =>
      service.scheduleCampaign(mockMessage, new Date('2025-01-01'))
    ).not.toThrow();

    expect(schedulable.schedule).toHaveBeenCalled();
    // nonSchedulable.schedule was called too — it just threw and was suppressed.
    expect(nonSchedulable.schedule).toHaveBeenCalled();
  });

  it('collectMetrics silently returns fewer results than channels', () => {
    const withMetrics = makeChannel({
      getMetrics: vi.fn(() => ({ sent: 10, failed: 2, deliveryRate: 0.83 })),
    });
    const withoutMetrics = makeChannel(); // throws for getMetrics
    const service = new NotificationService([withMetrics, withoutMetrics]);

    const metrics = service.collectMetrics();

    // Two channels configured. One result returned. Silent data loss.
    expect(metrics).toHaveLength(1);
    expect(withMetrics.getMetrics).toHaveBeenCalled();
  });
});
