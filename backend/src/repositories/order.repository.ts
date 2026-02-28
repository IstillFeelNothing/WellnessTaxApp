const orders: any[] = [];

interface OrderFilters {
  id?: number;
  minSubtotal?: number;
  maxSubtotal?: number;
  minTotal?: number;
  maxTotal?: number;
}

interface FindAllOptions {
  page?: number;
  limit?: number;
  filters?: OrderFilters;
}

class OrderRepository {
  create(order: any) {
    const newOrder = {
      id: orders.length + 1,
      ...order,
    };

    orders.push(newOrder);
    return newOrder;
  }

  findAll(options: FindAllOptions = {}) {
    const rawPage = options.page ?? 1;
    const rawLimit = options.limit ?? 10;
    const page = rawPage > 0 ? rawPage : 1;
    const limit = rawLimit > 0 ? rawLimit : 10;

    const filters = options.filters ?? {};

    const filteredOrders = orders.filter((order) => {
      if (filters.id !== undefined && order.id !== filters.id) {
        return false;
      }

      if (filters.minSubtotal !== undefined && order.subtotal < filters.minSubtotal) {
        return false;
      }

      if (filters.maxSubtotal !== undefined && order.subtotal > filters.maxSubtotal) {
        return false;
      }

      if (filters.minTotal !== undefined && order.total_amount < filters.minTotal) {
        return false;
      }

      if (filters.maxTotal !== undefined && order.total_amount > filters.maxTotal) {
        return false;
      }

      return true;
    });

    const total = filteredOrders.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

    const startIndex = (safePage - 1) * limit;
    const endIndex = startIndex + limit;
    const items = filteredOrders.slice(startIndex, endIndex);

    return {
      items,
      page: safePage,
      limit,
      total,
      totalPages,
    };
  }
}

export const orderRepository = new OrderRepository();
