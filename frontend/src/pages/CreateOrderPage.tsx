import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { createOrder, importOrders } from "../api/api";

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

export const CreateOrderPage = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importSuccess, setImportSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await createOrder({
        latitude: Number(latitude),
        longitude: Number(longitude),
        subtotal: Number(subtotal),
      });

      setLatitude("");
      setLongitude("");
      setSubtotal("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error creating order"));
    } finally {
      setLoading(false);
    }
  };

  const handleCsvImport = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!csvFile) {
      setError("Please select a CSV file");
      return;
    }

    setLoading(true);
    setError("");
    setImportSuccess("");

    try {
      const result = await importOrders(csvFile);
      setImportSuccess(`Successfully imported ${result.created} orders`);
      setCsvFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      setTimeout(() => setImportSuccess(""), 3000);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error importing CSV"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Create Order</h1>

      {success && <p style={{ color: "green", fontWeight: "bold" }}>Order created successfully</p>}
      {importSuccess && <p style={{ color: "green", fontWeight: "bold" }}>{importSuccess}</p>}
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <div style={{ marginBottom: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
        <h2>Add Single Order</h2>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
            style={{ display: "block", marginBottom: "10px", padding: "8px", width: "100%", boxSizing: "border-box" }}
          />
          <input
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
            style={{ display: "block", marginBottom: "10px", padding: "8px", width: "100%", boxSizing: "border-box" }}
          />
          <input
            placeholder="Subtotal"
            value={subtotal}
            onChange={(e) => setSubtotal(e.target.value)}
            required
            style={{ display: "block", marginBottom: "10px", padding: "8px", width: "100%", boxSizing: "border-box" }}
          />
          <button type="submit" disabled={loading} style={{ padding: "10px 20px", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
        <h2>Import from CSV</h2>
        <form onSubmit={handleCsvImport}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            style={{ display: "block", marginBottom: "10px" }}
          />
          <p style={{ fontSize: "12px", color: "#666" }}>CSV format: id, longitude, latitude, timestamp, subtotal</p>
          <button type="submit" disabled={loading || !csvFile} style={{ padding: "10px 20px", cursor: loading || !csvFile ? "not-allowed" : "pointer" }}>
            {loading ? "Importing..." : "Import CSV"}
          </button>
        </form>
      </div>
    </div>
  );
};
