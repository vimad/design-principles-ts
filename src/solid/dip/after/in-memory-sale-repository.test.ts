import { describe, it, expect } from 'vitest';
import { InMemorySaleRepository } from './in-memory-sale-repository';
import type { SaleRepository } from './types';

// Tests use the SaleRepository interface, not the concrete class.
// Any other SaleRepository implementation must satisfy these same expectations.

const SALES = [
  { id: 's1', amount: 500, region: 'west' },
  { id: 's2', amount: 300, region: 'east' },
];

describe('InMemorySaleRepository as SaleRepository', () => {
  it('returns all sales', () => {
    const repo: SaleRepository = new InMemorySaleRepository(SALES);
    const result = repo.fetchForPeriod(new Date('2024-01-01'), new Date('2024-01-31'));
    expect(result).toHaveLength(2);
    expect(result).toEqual(SALES);
  });

  it('returns an empty array when constructed with no sales', () => {
    const repo: SaleRepository = new InMemorySaleRepository([]);
    expect(repo.fetchForPeriod(new Date(), new Date())).toEqual([]);
  });
});
