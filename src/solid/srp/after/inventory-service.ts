import type { OrderItem } from './types';

// Single responsibility: manage stock levels.
// Only reason to change: the inventory system or its rules change.

export interface InventoryService {
  checkAvailability(items: OrderItem[]): void;
  deductStock(items: OrderItem[]): void;
}

// In production this would call a warehouse API or DB.
// Here we use an in-memory map so the class stays self-contained for examples.
export class WarehouseInventoryService implements InventoryService {
  private readonly stock: Record<string, number>;

  constructor(stock: Record<string, number>) {
    this.stock = { ...stock };
  }

  checkAvailability(items: OrderItem[]): void {
    for (const item of items) {
      const available = this.stock[item.productId] ?? 0;
      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.productId}: need ${item.quantity}, have ${available}`
        );
      }
    }
  }

  deductStock(items: OrderItem[]): void {
    for (const item of items) {
      const current = this.stock[item.productId] ?? 0;
      this.stock[item.productId] = current - item.quantity;
    }
  }
}
