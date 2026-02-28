export interface Order {
  id: number;
  latitude: number;
  longitude: number;
  subtotal: number;
  composite_tax_rate: number;
  tax_amount: number;
  total_amount: number;
  timestamp: string;
}

export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  id?: number;
  minSubtotal?: number;
  maxSubtotal?: number;
  minTotal?: number;
  maxTotal?: number;
}

export interface OrdersResponse {
  items: Order[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
