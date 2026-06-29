// Dependency Inversion Principle violated.
//
// SalesReportService is a high-level policy: fetch sales, compute a summary,
// format it into a report, and deliver it. That algorithm is independent of whether
// the data lives in Postgres or S3, whether reports go out via SMTP or Slack,
// or whether the format is CSV or JSON.
//
// But SalesReportService CONSTRUCTS its own low-level dependencies — it calls `new`
// on concrete infrastructure classes inside its constructor. This breaks DIP two ways:
//
//   1. The high-level module depends on low-level modules (directly, by name).
//      Changing PostgresSaleRepository requires editing SalesReportService.
//
//   2. The constructor signature leaks infrastructure details into the high-level API:
//      callers must supply a database URL and SMTP host just to create the service.
//      The service knows things it should never need to know.
//
// The result: the algorithm cannot be tested without standing up real infrastructure.

// ─── Low-level modules ────────────────────────────────────────────────────────
// These would normally live in their own files. Placed here to make the coupling
// visible: SalesReportService imports and constructs all of them.

export interface Sale {
  readonly id: string;
  readonly amount: number;
  readonly region: string;
}

export interface SalesSummary {
  readonly totalRevenue: number;
  readonly topRegion: string;
  readonly period: string;
}

export interface Report {
  readonly title: string;
  readonly body: string;
}

class PostgresSaleRepository {
  constructor(private readonly connectionString: string) {}

  fetchForPeriod(_from: Date, _to: Date): Sale[] {
    // Production: open connection, run SELECT ... WHERE date BETWEEN ...
    throw new Error(
      `PostgresSaleRepository: no database available at ${this.connectionString}`,
    );
  }
}

class CsvReportFormatter {
  format(summary: SalesSummary): Report {
    const lines = [
      'metric,value',
      `period,${summary.period}`,
      `total_revenue,${summary.totalRevenue.toFixed(2)}`,
      `top_region,${summary.topRegion}`,
    ];
    return {
      title: `Sales Report — ${summary.period}`,
      body: lines.join('\n'),
    };
  }
}

class SmtpReportMailer {
  constructor(
    private readonly host: string,
    private readonly fromAddress: string,
  ) {}

  send(_report: Report, _recipients: string[]): void {
    // Production: open SMTP connection, compose email, deliver
    throw new Error(`SmtpReportMailer: cannot connect to ${this.host}`);
  }
}

// ─── High-level module ────────────────────────────────────────────────────────

export class SalesReportService {
  private readonly repository: PostgresSaleRepository;
  private readonly formatter: CsvReportFormatter;
  private readonly mailer: SmtpReportMailer;

  // DIP violated: the constructor takes raw infrastructure config and uses it to
  // instantiate concrete low-level classes. The caller must know db URLs and SMTP
  // details. Swapping Postgres for BigQuery means changing this constructor.
  constructor(databaseUrl: string, smtpHost: string, fromAddress: string) {
    this.repository = new PostgresSaleRepository(databaseUrl);
    this.formatter = new CsvReportFormatter();
    this.mailer = new SmtpReportMailer(smtpHost, fromAddress);
  }

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
