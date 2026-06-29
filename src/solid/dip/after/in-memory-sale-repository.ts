import type { Sale, SaleRepository } from './types';

// A lightweight SaleRepository for tests and local development.
// It points inward: InMemorySaleRepository depends on the SaleRepository abstraction;
// SalesReportService does not depend on InMemorySaleRepository.
//
// A production PostgresSaleRepository would implement the same interface and slot in
// without any change to SalesReportService.

export class InMemorySaleRepository implements SaleRepository {
  constructor(private readonly sales: Sale[]) {}

  fetchForPeriod(_from: Date, _to: Date): Sale[] {
    return this.sales;
  }
}
