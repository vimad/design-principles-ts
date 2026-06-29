import { describe, it, expect, vi } from 'vitest';
import { NotificationService } from './notification-service';
import type { MessageSender, BatchSender, Schedulable, MetricsProvider, Message } from './types';

// The integration test for NotificationService uses vi.fn() mocks shaped to
// exactly the interface each method needs — no more.
//
// A mock for broadcast() only needs { send: vi.fn() }.
// A mock for scheduleCampaign() only needs { schedule: vi.fn() } and { cancel: vi.fn() }.
//
// In before/, every mock had to implement five methods regardless of what was being tested.
// Here mock setup size is proportional to the capability being exercised.

const message: Message = {
  id: 'm1',
  subject: 'Hello',
  body: 'World',
  recipient: 'user@example.com',
};

describe('NotificationService (after)', () => {
  describe('broadcast', () => {
    it('calls send on every sender', () => {
      const s1: MessageSender = { name: 'a', send: vi.fn() };
      const s2: MessageSender = { name: 'b', send: vi.fn() };
      const service = new NotificationService();

      service.broadcast([s1, s2], message);

      expect(s1.send).toHaveBeenCalledOnce();
      expect(s1.send).toHaveBeenCalledWith(message);
      expect(s2.send).toHaveBeenCalledWith(message);
    });
  });

  describe('broadcastBatch', () => {
    it('calls sendBatch on every batch sender', () => {
      const s: BatchSender = { sendBatch: vi.fn() };
      const messages = [message, { ...message, id: 'm2' }];
      const service = new NotificationService();

      service.broadcastBatch([s], messages);

      expect(s.sendBatch).toHaveBeenCalledWith(messages);
    });
  });

  describe('scheduleCampaign', () => {
    it('returns one job ID per channel and calls schedule on each', () => {
      const ch1: Schedulable = { schedule: vi.fn(() => 'job-1'), cancel: vi.fn() };
      const ch2: Schedulable = { schedule: vi.fn(() => 'job-2'), cancel: vi.fn() };
      const service = new NotificationService();
      const deliverAt = new Date('2025-06-01');

      const jobIds = service.scheduleCampaign([ch1, ch2], message, deliverAt);

      expect(jobIds).toEqual(['job-1', 'job-2']);
      expect(ch1.schedule).toHaveBeenCalledWith(message, deliverAt);
      expect(ch2.schedule).toHaveBeenCalledWith(message, deliverAt);
    });

    // TypeScript compile-time enforcement — uncomment to see the error:
    //
    //   import { SmsChannel } from './sms-channel';
    //   import { WebhookChannel } from './webhook-channel';
    //
    //   const service = new NotificationService();
    //   const sms = new SmsChannel();
    //   const webhook = new WebhookChannel('https://example.com/hook');
    //
    //   service.scheduleCampaign([sms], message, new Date());
    //   // Error: Argument of type 'SmsChannel[]' is not assignable to
    //   //        parameter of type 'Schedulable[]'
    //   //        SmsChannel has no 'schedule' method.
    //
    //   service.scheduleCampaign([webhook], message, new Date());
    //   // Error: Argument of type 'WebhookChannel[]' is not assignable to
    //   //        parameter of type 'Schedulable[]'
    //   //        WebhookChannel has no 'schedule' method.
    //
    // In before/, these calls compiled and only failed at runtime — silently swallowed.
  });

  describe('collectMetrics', () => {
    it('returns exactly one ChannelMetrics per provider — no silent data loss', () => {
      const p1: MetricsProvider = {
        getMetrics: vi.fn(() => ({ sent: 10, failed: 1, deliveryRate: 0.91 })),
      };
      const p2: MetricsProvider = {
        getMetrics: vi.fn(() => ({ sent: 5, failed: 0, deliveryRate: 1 })),
      };
      const service = new NotificationService();

      const results = service.collectMetrics([p1, p2]);

      expect(results).toHaveLength(2);
      expect(p1.getMetrics).toHaveBeenCalled();
      expect(p2.getMetrics).toHaveBeenCalled();
    });
  });
});
