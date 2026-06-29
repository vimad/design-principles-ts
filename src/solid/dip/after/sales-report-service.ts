import type { Sale, SalesSummary, SaleRepository, ReportFormatter, ReportMailer } from './types';

// SalesReportService is a pure high-level policy class.
//
// It knows the algorithm — fetch, summarise, format, deliver — but knows nothing
// about databases, SMTP, or CSV. All three dependencies are received through the
// constructor as abstractions. The class does not import any concrete implementation.
//
// This makes the algorithm independently testable: inject an in-memory repository
// with fixture data, a spy formatter, and a capture mailer — no infrastructure needed.
// It also makes implementations swappable: moving from Postgres to BigQuery, or from
// SMTP to SendGrid, requires zero changes to this file.

export class SalesReportService {
  constructor(
    private readonly repository: SaleRepository,
    private readonly formatter: ReportFormatter,
    private readonly mailer: ReportMailer,
  ) {}

  generateAndSend(from: Date, to: Date, recipients: string[]): void {
    const sales = this.repository.fetchForPeriod(from, to);
    const summary = this.summarise(sales, from, to);
    const report = this.formatter.format(summary);
    this.mailer.send(report, recipients);
  }

  private summarise(sales: Sale[], from: Date, to: Date): SalesSummary {
    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);

    const regionTotals = new Map<string, number>();
    for (const sale of sales) {
      regionTotals.set(sale.region, (regionTotals.get(sale.region) ?? 0) + sale.amount);
    }
    const topRegion =
      [...regionTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';

    return {
      totalRevenue,
      topRegion,
      period: `${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}`,
    };
  }
}
