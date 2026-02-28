import { Request, Response } from "express";
import fs from "fs";
import csv from "csv-parser";
import { orderService } from "../services/order.service";

const parseOptionalNumber = (value: unknown, fieldName: string) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = parseFloat(String(value));
  if (!isFinite(parsed)) {
    throw new Error(`Invalid query parameter: ${fieldName}`);
  }

  return parsed;
};

const parseOptionalPositiveInt = (value: unknown, fieldName: string) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid query parameter: ${fieldName}`);
  }

  return parsed;
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const page = parseOptionalPositiveInt(req.query.page, "page") ?? 1;
    const limit = parseOptionalPositiveInt(req.query.limit, "limit") ?? 10;
    const id = parseOptionalPositiveInt(req.query.id, "id");
    const minSubtotal = parseOptionalNumber(req.query.minSubtotal, "minSubtotal");
    const maxSubtotal = parseOptionalNumber(req.query.maxSubtotal, "maxSubtotal");
    const minTotal = parseOptionalNumber(req.query.minTotal, "minTotal");
    const maxTotal = parseOptionalNumber(req.query.maxTotal, "maxTotal");

    if (
      minSubtotal !== undefined &&
      maxSubtotal !== undefined &&
      minSubtotal > maxSubtotal
    ) {
      return res.status(400).json({ message: "minSubtotal cannot be greater than maxSubtotal" });
    }

    if (
      minTotal !== undefined &&
      maxTotal !== undefined &&
      minTotal > maxTotal
    ) {
      return res.status(400).json({ message: "minTotal cannot be greater than maxTotal" });
    }

    const orders = await orderService.getAllOrders({
      page,
      limit,
      filters: {
        id,
        minSubtotal,
        maxSubtotal,
        minTotal,
        maxTotal,
      },
    });

    res.json(orders);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid query parameter")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Error fetching orders" });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const rawLat = req.body.latitude;
    const rawLon = req.body.longitude;
    const rawSubtotal = req.body.subtotal;

    const latitude = parseFloat(rawLat);
    const longitude = parseFloat(rawLon);
    const subtotal = parseFloat(rawSubtotal);

    if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(subtotal)) {
      return res.status(400).json({ message: "Invalid latitude, longitude or subtotal" });
    }

    const order = await orderService.createOrder({
      latitude,
      longitude,
      subtotal,
      timestamp: new Date(),
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error creating order" });
  }
};

export const importOrders = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file required" });
    }

    const results: any[] = [];
    let importError: any = null;

    const stream = fs.createReadStream(req.file.path);

    stream
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("error", (error) => {
        importError = error;
      })
      .on("end", async () => {
        try {
          if (importError) {
            throw importError;
          }

          if (results.length === 0) {
            if (req.file) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: "CSV file is empty" });
          }

          const created = [];
          const errors = [];

          for (let i = 0; i < results.length; i++) {
            try {
              const row = results[i];
              if (row.latitude === undefined || row.latitude === "" || row.longitude === undefined || row.longitude === "" || row.subtotal === undefined || row.subtotal === "") {
                errors.push(`Row ${i + 1}: Missing required fields (latitude, longitude, subtotal)`);
                continue;
              }

              const latitude = parseFloat(row.latitude);
              const longitude = parseFloat(row.longitude);
              const subtotal = parseFloat(row.subtotal);

              if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(subtotal)) {
                errors.push(`Row ${i + 1}: Invalid numeric values`);
                continue;
              }

              const order = await orderService.createOrder({
                latitude,
                longitude,
                subtotal,
                timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
              });

              created.push(order);
            } catch (rowError: any) {
              errors.push(`Row ${i + 1}: ${rowError.message}`);
            }
          }

          if (req.file) {
            fs.unlinkSync(req.file.path);
          }

          res.json({
            created: created.length,
            createdItems: created,
            errors: errors.length > 0 ? errors : undefined,
          });
        } catch (error: any) {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (e) {}
          }
          res.status(500).json({ message: `Failed to process CSV data: ${error.message}` });
        }
      });
  } catch (error: any) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
      res.status(500).json({ message: "Import failed: " + error.message });
  }
};
