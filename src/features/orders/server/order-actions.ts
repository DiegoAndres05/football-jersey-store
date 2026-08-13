"use server";

import {
  createOrder,
  type CreateOrderInput,
} from "@/features/orders/repositories/order-repository";

export async function submitOrder(input: CreateOrderInput) {
  return createOrder(input);
}