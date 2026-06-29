// Abstractions that both the high-level module and low-level modules depend on.
//
// Ownership matters: these interfaces are defined at the high-level policy layer,
// not inside the infrastructure implementations. SaleRepository, ReportFormatter,
// and ReportMailer describe what the algorithm needs — not what Postgres or SMTP
// happen to offer. Concrete classes conform to these; these do not conform to them.
//
// Dependency direction:
//   PostgresSaleRepository  ──→ SaleRepository ←── SalesReportService
//   CsvReportFormatter      ──→ ReportFormatter ←──
//   SmtpReportMailer        ──→ ReportMailer    ←──
//
// Neither concrete class nor high-level service points at the other.

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

export interface SaleRepository {
  fetchForPeriod(from: Date, to: Date): Sale[];
}

export interface ReportFormatter {
  format(summary: SalesSummary): Report;
}

export interface ReportMailer {
  send(report: Report, recipients: string[]): void;
}
