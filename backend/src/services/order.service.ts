import { taxService } from "./tax.service";
import { orderRepository } from "../repositories/order.repository";

interface CreateOrderDTO {
  latitude: number;
  longitude: number;
  subtotal: number;
  timestamp: Date;
}

interface GetOrdersOptions {
  page?: number;
  limit?: number;
  filters?: {
    id?: number;
    minSubtotal?: number;
    maxSubtotal?: number;
    minTotal?: number;
    maxTotal?: number;
  };
}

class OrderService {
  async getAllOrders(options: GetOrdersOptions = {}) {
    return orderRepository.findAll(options);
  }

  async createOrder(data: CreateOrderDTO) {
    const rates = await taxService.getRates(
      data.latitude,
      data.longitude
    );

    const composite_tax_rate =
      rates.state_rate +
      rates.county_rate +
      rates.city_rate +
      rates.special_rate;

    const tax_amount = data.subtotal * composite_tax_rate;
    const total_amount = data.subtotal + tax_amount;

    return orderRepository.create({
      ...data,
      composite_tax_rate,
      tax_amount,
      total_amount,
    });
  }
}

export const orderService = new OrderService();
