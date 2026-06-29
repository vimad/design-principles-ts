import { describe, it, expect } from 'vitest';
import { SalesReportService } from './sales-report-service';

// DIP makes SalesReportService nearly untestable in isolation.
//
// To construct the service, you must supply infrastructure config — database URL and
// SMTP details. There is no way to pass "test doubles" because the constructor
// accepts strings, not dependencies. The class creates its own concrete objects
// internally, out of reach of any test.
//
// To exercise the algorithm (fetch → summarise → format → send) you need:
//   - A live Postgres instance with sales data loaded
//   - A reachable SMTP server
//   - Acceptance that real emails will fire to real recipients
//
// The business logic — total revenue, top-region calculation, date period formatting —
// is correct or incorrect independent of Postgres and SMTP. But there is no seam
// to insert test data or capture output. The algorithm is untestable.

describe('SalesReportService (before — DIP violated)', () => {
  const FROM = new Date('2024-01-01');
  const TO = new Date('2024-01-31');

  it('can be constructed — but only by providing real infrastructure config', () => {
    // The test must know the database URL and SMTP details just to instantiate the class.
    // These are low-level details that should be invisible to the high-level consumer.
    const service = new SalesReportService(
      'postgres://localhost:5432/sales',
      'smtp.company.com',
      'reports@company.com',
    );
    expect(service).toBeDefined();
  });

  it('generateAndSend throws because no Postgres instance is available', () => {
    const service = new SalesReportService(
      'postgres://localhost:5432/sales',
      'smtp.company.com',
      'reports@company.com',
    );

    // The call throws — not because the logic is wrong, but because there is no database.
    // The algorithm is never reached. All we learn is that infrastructure is absent.
    expect(() =>
      service.generateAndSend(FROM, TO, ['cto@company.com']),
    ).toThrow('PostgresSaleRepository');
  });

  // WHAT WE CANNOT TEST without modifying the class:
  //
  // - Whether summarise() computes total revenue correctly
  //   (it is private; the only path through it requires a database call)
  //
  // - Whether the top region is correctly identified by revenue (not by count)
  //
  // - Whether the formatter is called with the right summary data
  //   (cannot intercept the CsvReportFormatter created internally)
  //
  // - Whether the mailer receives the correct recipients
  //   (cannot intercept SmtpReportMailer)
  //
  // - Whether the algorithm works with a different formatter (JSON, HTML, etc.)
  //   (formatter is hardcoded — cannot be swapped without editing the class)
  //
  // In the after/ version, all of these are covered with simple setup and no infrastructure.
});
