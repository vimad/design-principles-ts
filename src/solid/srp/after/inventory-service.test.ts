import { describe, it, expect } from 'vitest';
import { WarehouseInventoryService } from './inventory-service';

// WarehouseInventoryService tests need only a stock map and a list of items.
// No order object, no customer, no payment, no email.
// We control the starting stock state precisely — no hardcoded fixture to know about.

describe('WarehouseInventoryService', () => {
  it('passes when all items are in stock', () => {
    const svc = new WarehouseInventoryService({ 'WIDGET-A': 10 });
    expect(() =>
      svc.checkAvailability([{ productId: 'WIDGET-A', quantity: 5, unitPrice: 50 }])
    ).not.toThrow();
  });

  it('passes when requested quantity exactly matches stock', () => {
    const svc = new WarehouseInventoryService({ 'WIDGET-A': 5 });
    expect(() =>
      svc.checkAvailability([{ productId: 'WIDGET-A', quantity: 5, unitPrice: 50 }])
    ).not.toThrow();
  });

  it('throws with a clear message when stock is insufficient', () => {
    const svc = new WarehouseInventoryService({ 'WIDGET-A': 2 });
    expect(() =>
      svc.checkAvailability([{ productId: 'WIDGET-A', quantity: 5, unitPrice: 50 }])
    ).toThrow('Insufficient stock for WIDGET-A: need 5, have 2');
  });

  it('treats an unknown product as zero stock', () => {
    const svc = new WarehouseInventoryService({});
    expect(() =>
      svc.checkAvailability([{ productId: 'UNKNOWN', quantity: 1, unitPrice: 50 }])
    ).toThrow('Insufficient stock for UNKNOWN: need 1, have 0');
  });

  it('deducts stock after successful reservation', () => {
    const svc = new WarehouseInventoryService({ 'WIDGET-A': 10 });
    svc.deductStock([{ productId: 'WIDGET-A', quantity: 3, unitPrice: 50 }]);
    // Proves stock was actually reduced — a subsequent check reflects the new level
    expect(() =>
      svc.checkAvailability([{ productId: 'WIDGET-A', quantity: 8, unitPrice: 50 }])
    ).toThrow('Insufficient stock for WIDGET-A: need 8, have 7');
  });

  it('checks availability across multiple items simultaneously', () => {
    const svc = new WarehouseInventoryService({ 'WIDGET-A': 10, 'WIDGET-B': 2 });
    expect(() =>
      svc.checkAvailability([
        { productId: 'WIDGET-A', quantity: 5, unitPrice: 50 },
        { productId: 'WIDGET-B', quantity: 5, unitPrice: 20 },
      ])
    ).toThrow('Insufficient stock for WIDGET-B');
  });
});
