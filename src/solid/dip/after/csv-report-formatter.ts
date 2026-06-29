import type { SalesSummary, Report, ReportFormatter } from './types';

// Concrete low-level implementation of ReportFormatter.
// It depends on the abstraction; the abstraction does not depend on it.
// Swapping to JsonReportFormatter or HtmlReportFormatter requires no changes
// to SalesReportService — inject the new formatter at construction time.

export class CsvReportFormatter implements ReportFormatter {
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
