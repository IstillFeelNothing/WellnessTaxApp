import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { getOrders, importOrders } from "../api/api";
import type { Order, OrdersQueryParams } from "../types";
import { OrderTable } from "../components/OrderTable";
import { Pagination } from "../components/Paginations";

interface FilterFormState {
  id: string;
  minSubtotal: string;
  maxSubtotal: string;
  minTotal: string;
  maxTotal: string;
}

const DEFAULT_PAGE_SIZE = 5;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;
    return responseMessage || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState<FilterFormState>({
    id: "",
    minSubtotal: "",
    maxSubtotal: "",
    minTotal: "",
    maxTotal: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<OrdersQueryParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  const parseOptionalNumber = (value: string) => {
    if (value.trim() === "") {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  };

  const loadOrders = async (page: number, limit: number, queryFilters: OrdersQueryParams) => {
    setIsFetching(true);

    try {
      setError("");
      const data = await getOrders({
        ...queryFilters,
        page,
        limit,
      });

      setOrders(data.items);
      setTotalPages(data.totalPages);
      setTotalOrders(data.total);

      if (data.page !== page) {
        setCurrentPage(data.page);
      }
    } catch (error: unknown) {
      setError("Failed to fetch orders: " + getErrorMessage(error, "Unable to load orders"));
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadOrders(currentPage, pageSize, appliedFilters);
  }, [currentPage, pageSize, appliedFilters]);

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError("");
    setSuccess("");

    try {
      const result = await importOrders(file);
      setSuccess(`Imported ${result.created} orders successfully`);
      setTimeout(() => setSuccess(""), 3000);
      await loadOrders(currentPage, pageSize, appliedFilters);
      e.target.value = "";
    } catch (error: unknown) {
      setError("Import failed: " + getErrorMessage(error, "Import error"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleApplyFilters = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const id = parseOptionalNumber(filters.id);
    const minSubtotal = parseOptionalNumber(filters.minSubtotal);
    const maxSubtotal = parseOptionalNumber(filters.maxSubtotal);
    const minTotal = parseOptionalNumber(filters.minTotal);
    const maxTotal = parseOptionalNumber(filters.maxTotal);

    if (
      id === null ||
      minSubtotal === null ||
      maxSubtotal === null ||
      minTotal === null ||
      maxTotal === null
    ) {
      setError("Filters must contain valid numbers");
      return;
    }

    if (id !== undefined && (!Number.isInteger(id) || id <= 0)) {
      setError("ID must be a positive integer");
      return;
    }

    if (
      minSubtotal !== undefined &&
      maxSubtotal !== undefined &&
      minSubtotal > maxSubtotal
    ) {
      setError("Min subtotal cannot be greater than max subtotal");
      return;
    }

    if (
      minTotal !== undefined &&
      maxTotal !== undefined &&
      minTotal > maxTotal
    ) {
      setError("Min total cannot be greater than max total");
      return;
    }

    setError("");
    setCurrentPage(1);
    setAppliedFilters({
      id,
      minSubtotal,
      maxSubtotal,
      minTotal,
      maxTotal,
    });
  };

  const handleResetFilters = () => {
    setFilters({
      id: "",
      minSubtotal: "",
      maxSubtotal: "",
      minTotal: "",
      maxTotal: "",
    });
    setAppliedFilters({});
    setCurrentPage(1);
  };

  return (
    <div>
      <h1>Orders</h1>

      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleApplyFilters} style={{ marginBottom: "16px", display: "grid", gap: "8px" }}>
        <h3>Filters</h3>
        <input
          type="number"
          min={1}
          placeholder="Order ID"
          value={filters.id}
          onChange={(e) => setFilters({ ...filters, id: e.target.value })}
        />
        <input
          type="number"
          placeholder="Min subtotal"
          value={filters.minSubtotal}
          onChange={(e) => setFilters({ ...filters, minSubtotal: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max subtotal"
          value={filters.maxSubtotal}
          onChange={(e) => setFilters({ ...filters, maxSubtotal: e.target.value })}
        />
        <input
          type="number"
          placeholder="Min total"
          value={filters.minTotal}
          onChange={(e) => setFilters({ ...filters, minTotal: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max total"
          value={filters.maxTotal}
          onChange={(e) => setFilters({ ...filters, maxTotal: e.target.value })}
        />
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button type="submit">Apply Filters</button>
          <button type="button" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </form>

      <div style={{ marginBottom: "16px" }}>
        <label>
          Items per page:{" "}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleImport}
        disabled={isImporting}
      />
      {isImporting && <p>Importing...</p>}

      {isFetching ? <p>Loading orders...</p> : <OrderTable orders={orders} />}

      <p>
        Total orders: {totalOrders} | Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
      </p>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
