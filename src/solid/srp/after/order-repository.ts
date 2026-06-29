import type { Order } from './types';

// Single responsibility: persist and retrieve orders.
// Only reason to change: the storage layer or schema changes.

export interface OrderRepository {
  save(order: Order, transactionId: string): string;
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly records: Array<{ id: string; order: Order; transactionId: string }> = [];

  save(order: Order, transactionId: string): string {
    const id = `ord_${this.records.length + 1}`;
    this.records.push({ id, order, transactionId });
    return id;
  }

  all(): ReadonlyArray<{ id: string; order: Order; transactionId: string }> {
    return this.records;
  }
}
