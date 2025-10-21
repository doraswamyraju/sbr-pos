// src/components/ConvertLeadModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBarcode } from "react-icons/fa";
import BarcodeModal from "./BarcodeModal"; // Assuming BarcodeModal exists in the same components directory

export default function ConvertLeadModal({
  show,
  onClose,
  lead,
  products = [],
  onConverted = () => {},
  apiConvertUrl = "/sbr-pos/server/api/convert_lead.php",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  useEffect(() => {
    if (!show) {
      setQuery("");
      setResults([]);
      setCart([]);
      setError("");
    }
  }, [show]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const q = query.toString().toLowerCase();
    const found = products.filter(
      (p) =>
        (p.name || "").toString().toLowerCase().includes(q) ||
        (p.sku || "").toString().toLowerCase().includes(q) ||
        (p.id || "").toString() === query.toString()
    );
    setResults(found.slice(0, 50));
  }, [query, products]);

  const handleBarcodeScan = async (scannedBarcode) => {
    try {
      const res = await axios.get(
        `/sbr-pos/server/api/barcode_lookup.php?sku=${encodeURIComponent(scannedBarcode)}`
      );
      const product = res.data?.product ?? res.data?.data ?? res.data;
      if (product) {
        addToCart(product);
        setShowBarcodeScanner(false);
      } else {
        setError("Product not found for that barcode.");
      }
    } catch (err) {
      console.error(err);
      setError("Barcode lookup failed.");
    }
  };

  const addToCart = (product) => {
    setCart((c) => {
      const existing = c.find((it) => Number(it.product_id) === Number(product.id));
      if (existing) return c.map((it) => (it.product_id === product.id ? { ...it, qty: it.qty + 1 } : it));
      return [...c, { product_id: product.id, name: product.name, qty: 1, price: product.price || 0 }];
    });
    setQuery("");
    setResults([]);
  };

  const updateQty = (productId, qty) => {
    qty = Number(qty) || 0;
    setCart((c) => c.map((it) => (Number(it.product_id) === Number(productId) ? { ...it, qty } : it)));
  };

  const removeFromCart = (productId) => {
    setCart((c) => c.filter((it) => Number(it.product_id) !== Number(productId)));
  };

  const handleConvert = async () => {
    if (!lead?.id) {
      setError("Lead not selected.");
      return;
    }
    if (cart.length === 0) {
      setError("Add at least one product to cart.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        lead_id: lead.id,
        items: cart.map((it) => ({ product_id: it.product_id, qty: it.qty })),
      };
      const res = await axios.post(apiConvertUrl, payload);
      if (res.data?.status === "success") {
        onConverted(res.data);
        alert("Converted to sale successfully.");
        onClose();
      } else {
        setError(res.data?.message || "Conversion failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error during conversion.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-start justify-center p-4 overflow-auto">
      <div className="bg-white rounded shadow-lg w-full max-w-3xl mt-12">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Convert Lead to Sale</h3>
            <div className="text-sm text-gray-600">Lead: {lead?.full_name || "-"} • {lead?.email || ""}</div>
          </div>
          <div>
            <button className="px-3 py-1 rounded border" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product search / Barcode</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type product name or paste barcode / SKU"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results.length === 1) {
                    addToCart(results[0]);
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
              <button onClick={() => setShowBarcodeScanner(true)} className="px-3 py-2 bg-gray-200 rounded">
                <FaBarcode />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">Press Enter to quickly add when single result.</div>

            <div className="mt-3">
              {results.length === 0 ? (
                <div className="text-sm text-gray-500">No products found.</div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {results.map((p) => (
                    <li key={p.id} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">SKU: {p.sku || "—"} • ID: {p.id}</div>
                        {p.price !== undefined && <div className="text-sm text-gray-700">Price: ₹{p.price}</div>}
                      </div>
                      <div>
                        <button onClick={() => addToCart(p)} className="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium mb-1">Cart</label>
              <div className="text-xs text-gray-500">Items: {cart.length}</div>
            </div>

            <div className="mt-2 max-h-80 overflow-auto">
              {cart.length === 0 ? (
                <div className="text-sm text-gray-500">No items added.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-600">
                    <tr>
                      <th>Product</th>
                      <th className="w-24">Qty</th>
                      <th className="w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((it) => (
                      <tr key={it.product_id} className="border-t">
                        <td className="py-2">{it.name}</td>
                        <td className="py-2">
                          <input
                            type="number"
                            min="1"
                            value={it.qty}
                            onChange={(e) => updateQty(it.product_id, e.target.value)}
                            className="w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="py-2">
                          <button onClick={() => removeFromCart(it.product_id)} className="px-2 py-1 border rounded text-red-600">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 flex justify-end items-center gap-2">
              {error && <div className="text-sm text-red-600 mr-auto">{error}</div>}
              <button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={handleConvert} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">
                {loading ? "Processing..." : "Convert to Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showBarcodeScanner && (
        <BarcodeModal
          onClose={() => setShowBarcodeScanner(false)}
          onScanSuccess={handleBarcodeScan}
        />
      )}
    </div>
  );
}