import { describe, it, expect } from 'vitest';
import { CsvReportFormatter } from './csv-report-formatter';
import type { ReportFormatter } from './types';

// CsvReportFormatter is tested entirely in isolation.
// No repository, no mailer, no SalesReportService — just input → output.
// This isolation is possible because DIP pushed formatting into its own class
// that implements a single focused interface.

const SUMMARY = {
  totalRevenue: 1500,
  topRegion: 'west',
  period: '2024-01-01 to 2024-01-31',
};

describe('CsvReportFormatter as ReportFormatter', () => {
  it('produces a report with the correct title', () => {
    const formatter: ReportFormatter = new CsvReportFormatter();
    const report = formatter.format(SUMMARY);
    expect(report.title).toContain('Sales Report');
    expect(report.title).toContain(SUMMARY.period);
  });

  it('includes revenue formatted to two decimal places', () => {
    const formatter: ReportFormatter = new CsvReportFormatter();
    const report = formatter.format(SUMMARY);
    expect(report.body).toContain('1500.00');
  });

  it('includes the top region', () => {
    const formatter: ReportFormatter = new CsvReportFormatter();
    const report = formatter.format({ ...SUMMARY, topRegion: 'east' });
    expect(report.body).toContain('east');
  });

  it('includes the period', () => {
    const formatter: ReportFormatter = new CsvReportFormatter();
    const report = formatter.format(SUMMARY);
    expect(report.body).toContain('2024-01-01 to 2024-01-31');
  });
});
