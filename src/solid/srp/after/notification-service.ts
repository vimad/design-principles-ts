// Single responsibility: notify the customer about order outcomes.
// Only reason to change: notification channel or content changes (email → SMS, template redesign).

export interface NotificationService {
  orderConfirmed(email: string, orderId: string, total: number): void;
}

export class EmailNotificationService implements NotificationService {
  orderConfirmed(email: string, orderId: string, total: number): void {
    console.log(
      `[SMTP] Sent confirmation to ${email}: order ${orderId}, total $${total.toFixed(2)}`
    );
  }
}
