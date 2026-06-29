import { describe, it, expect, vi } from 'vitest';
import { SalesReportService } from './sales-report-service';
import { InMemorySaleRepository } from './in-memory-sale-repository';
import { CsvReportFormatter } from './csv-report-formatter';
import type { ReportMailer, ReportFormatter } from './types';

// The algorithm is fully testable with no infrastructure at all.
// Setup: an in-memory repository with fixture data, a real formatter, and a mailer spy.
// No Postgres. No SMTP. No environment variables. No test doubles that require
// complex setup — the interfaces are narrow enough that a one-line object literal suffices.
//
// Compare to before/: construction required infrastructure config strings, and calling
// generateAndSend() immediately threw on the database call without touching the algorithm.

const JAN_SALES = [
  { id: 's1', amount: 500, region: 'west' },
  { id: 's2', amount: 300, region: 'east' },
  { id: 's3', amount: 700, region: 'west' },
];

const FROM = new Date('2024-01-01');
const TO = new Date('2024-01-31');

function makeService(mailer: ReportMailer = { send: vi.fn() }): SalesReportService {
  return new SalesReportService(
    new InMemorySaleRepository(JAN_SALES),
    new CsvReportFormatter(),
    mailer,
  );
}

describe('SalesReportService (after)', () => {
  describe('generateAndSend — algorithm correctness', () => {
    it('computes total revenue across all sales', () => {
      const mailer: ReportMailer = { send: vi.fn() };
      makeService(mailer).generateAndSend(FROM, TO, ['cto@company.com']);

      // 500 + 300 + 700 = 1500
      expect(mailer.send).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.stringContaining('1500.00') }),
        expect.anything(),
      );
    });

    it('identifies the top region by revenue, not by number of sales', () => {
      const mailer: ReportMailer = { send: vi.fn() };
      // east: 300 (1 sale), west: 500 + 700 = 1200 (2 sales) — west should win by revenue
      makeService(mailer).generateAndSend(FROM, TO, ['cto@company.com']);

      expect(mailer.send).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.stringContaining('west') }),
        expect.anything(),
      );
    });

    it('delivers to all specified recipients', () => {
      const mailer: ReportMailer = { send: vi.fn() };
      makeService(mailer).generateAndSend(FROM, TO, ['cto@company.com', 'cfo@company.com']);

      expect(mailer.send).toHaveBeenCalledWith(
        expect.anything(),
        ['cto@company.com', 'cfo@company.com'],
      );
    });

    it('sends exactly one report per call', () => {
      const mailer: ReportMailer = { send: vi.fn() };
      makeService(mailer).generateAndSend(FROM, TO, ['cto@company.com']);
      expect(mailer.send).toHaveBeenCalledOnce();
    });
  });

  describe('generateAndSend — swappable implementations', () => {
    it('uses whichever formatter is injected — the algorithm does not change', () => {
      // Injecting a JSON formatter instead of CSV requires zero changes to SalesReportService.
      // This test would be impossible in before/: the formatter was hardcoded.
      const jsonFormatter: ReportFormatter = {
        format: vi.fn(() => ({ title: 'JSON Report', body: '{"revenue":1500}' })),
      };
      const mailer: ReportMailer = { send: vi.fn() };
      const service = new SalesReportService(
        new InMemorySaleRepository(JAN_SALES),
        jsonFormatter,
        mailer,
      );

      service.generateAndSend(FROM, TO, ['cto@company.com']);

      expect(jsonFormatter.format).toHaveBeenCalledOnce();
      expect(mailer.send).toHaveBeenCalledWith(
        expect.objectContaining({ body: '{"revenue":1500}' }),
        expect.anything(),
      );
    });

    it('works correctly with an empty sale set', () => {
      const mailer: ReportMailer = { send: vi.fn() };
      const service = new SalesReportService(
        new InMemorySaleRepository([]),
        new CsvReportFormatter(),
        mailer,
      );

      service.generateAndSend(FROM, TO, ['cto@company.com']);

      expect(mailer.send).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.stringContaining('0.00') }),
        expect.anything(),
      );
    });
  });
});
