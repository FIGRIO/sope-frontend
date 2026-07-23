export const ADMIN_ORDER_CREATED_EVENT = "sope:admin-order-created";

export type RealtimeNotification = {
  type:
    | "NEW_MESSAGE"
    | "ORDER_PLACED"
    | "ADMIN_NEW_ORDER"
    | "PAYMENT_SUCCESS"
    | "PAYMENT_FAILED"
    | "ORDER_STATUS_UPDATED"
    | "SYSTEM"
    | string;
  title: string;
  message: string;
  referenceId?: string | null;
  timestamp?: string | null;
};

export function dispatchAdminOrderCreated(notification: RealtimeNotification) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<RealtimeNotification>(ADMIN_ORDER_CREATED_EVENT, {
      detail: notification,
    }),
  );
}
