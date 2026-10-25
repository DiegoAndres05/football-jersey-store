type ContactFields = {
  fullName: string;
  phone: string;
  shippingFullName: string;
  shippingPhone: string;
};

/** Si el destinatario es quien compra, el pedido usa el nombre y el teléfono de contacto. */
export function withRecipientContact<T extends ContactFields>(values: T, recipientIsCustomer: boolean): T {
  if (!recipientIsCustomer) return values;
  return {
    ...values,
    shippingFullName: values.fullName,
    shippingPhone: values.phone,
  };
}
