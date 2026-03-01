import { getDb } from "../config/db";

interface CreateOrderInput {
  latitude: number;
  longitude: number;
  subtotal: number;
  composite_tax_rate: number;
  tax_amount: number;
  total_amount: number;
  timestamp: Date;
}

interface OrderRecord {
  id: number;
  latitude: number;
  longitude: number;
  subtotal: number;
  composite_tax_rate: number;
  tax_amount: number;
  total_amount: number;
  timestamp: string;
}

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
  async create(order: CreateOrderInput) {
    const db = await getDb();
    const timestamp =
      order.timestamp instanceof Date ? order.timestamp.toISOString() : new Date(order.timestamp).toISOString();

    const result = await db.run(
      `
        INSERT INTO orders (
          latitude,
          longitude,
          subtotal,
          composite_tax_rate,
          tax_amount,
          total_amount,
          timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      order.latitude,
      order.longitude,
      order.subtotal,
      order.composite_tax_rate,
      order.tax_amount,
      order.total_amount,
      timestamp
    );

    const created = await db.get<OrderRecord>("SELECT * FROM orders WHERE id = ?", result.lastID);
    if (!created) {
      throw new Error("Failed to create order");
    }

    return created;
  }

  async findAll(options: FindAllOptions = {}) {
    const db = await getDb();
    const rawPage = options.page ?? 1;
    const rawLimit = options.limit ?? 10;
    const page = rawPage > 0 ? rawPage : 1;
    const limit = rawLimit > 0 ? rawLimit : 10;

    const filters = options.filters ?? {};
    const whereClauses: string[] = [];
    const whereValues: Array<number> = [];

    if (filters.id !== undefined) {
      whereClauses.push("id = ?");
      whereValues.push(filters.id);
    }

    if (filters.minSubtotal !== undefined) {
      whereClauses.push("subtotal >= ?");
      whereValues.push(filters.minSubtotal);
    }

    if (filters.maxSubtotal !== undefined) {
      whereClauses.push("subtotal <= ?");
      whereValues.push(filters.maxSubtotal);
    }

    if (filters.minTotal !== undefined) {
      whereClauses.push("total_amount >= ?");
      whereValues.push(filters.minTotal);
    }

    if (filters.maxTotal !== undefined) {
      whereClauses.push("total_amount <= ?");
      whereValues.push(filters.maxTotal);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const totalResult = await db.get<{ total: number }>(
      `SELECT COUNT(*) as total FROM orders ${whereSql}`,
      ...whereValues
    );

    const total = totalResult?.total ?? 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

    const startIndex = (safePage - 1) * limit;
    const items = await db.all<OrderRecord[]>(
      `
        SELECT *
        FROM orders
        ${whereSql}
        ORDER BY id ASC
        LIMIT ? OFFSET ?
      `,
      ...whereValues,
      limit,
      startIndex
    );

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
