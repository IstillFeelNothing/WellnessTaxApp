import axios from "axios";
import type { OrdersQueryParams, OrdersResponse } from "../types";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

export const getOrders = async (params: OrdersQueryParams = {}): Promise<OrdersResponse> => {
  const res = await api.get("/orders", { params });
  return res.data;
};

export const createOrder = async (data: {
  latitude: number;
  longitude: number;
  subtotal: number;
}) => {
  const res = await api.post("/orders", data);
  return res.data;
};

export const importOrders = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/orders/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
