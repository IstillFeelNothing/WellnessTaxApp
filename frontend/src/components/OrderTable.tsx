import type { Order } from "../types";

interface Props {
  orders: Order[];
}

export const OrderTable = ({ orders }: Props) => {
  if (orders.length === 0) {
    return <p>No orders found</p>;
  }

  return (
    <table border={1} cellPadding={8}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Subtotal</th>
          <th>Tax</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>{order.subtotal.toFixed(2)}</td>
            <td>{order.tax_amount.toFixed(2)}</td>
            <td>{order.total_amount.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
