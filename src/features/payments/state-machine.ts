export type PaymentState = "PREPARED" | "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING" | "UNKNOWN";
export type PaymentEvent = "approve" | "reject" | "cancel" | "pending" | "timeout";

export function transitionPayment(state: PaymentState, event: PaymentEvent): PaymentState {
  if (state !== "PREPARED" && state !== "PENDING" && state !== "UNKNOWN") return state;
  if (event === "approve") return "APPROVED";
  if (event === "reject") return "REJECTED";
  if (event === "cancel") return "CANCELLED";
  if (event === "pending") return "PENDING";
  return "UNKNOWN";
}
