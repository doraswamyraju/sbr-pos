// src/pages/Sales.jsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from '../config';
import axios from "axios";
import SalesDesktop from "./SalesDesktop";
import SalesMobile from "./SalesMobile";

/**
 * Complete Sales.jsx
 * - Restores helper functions that were missing (buildReceiptHtml, openPrintWindowWithHtml)
 * - Passes companyDetails to children via sharedProps
 * - Preserves all existing behaviors (cart, payment, server calls, barcode lookup)
 */

// fallback user
const fallbackUser = { id: 1, full_name: "Admin User" };

const DEFAULT_WALKIN_CUSTOMER = { id: 0, full_name: "Walk-in Customer", phone_number: "-", email: "-" };

const Sales = ({ user: incomingUser }) => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(DEFAULT_WALKIN_CUSTOMER);
  const [heldCarts, setHeldCarts] = useState([]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [isGstCustomer, setIsGstCustomer] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [upiId, setUpiId] = useState("");
  const [gstInputValue, setGstInputValue] = useState("");

  const [newCustomer, setNewCustomer] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    address: "",
  });

  const [lastSale, setLastSale] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  // ADD NEW STATE FOR COMPANY INFO
  const [companyDetails, setCompanyDetails] = useState(null);

  // Corrected User State Management
  const [user, setUser] = useState(incomingUser || fallbackUser);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // ADD NEW FUNCTION TO FETCH COMPANY INFO
  const fetchCompanyInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/server/api/company_info.php`);
      // Normalize the data from the API response
      const data = res.data;
      if (data && data.company_name) {
        setCompanyDetails({
          name: data.company_name,
          addressLine1: data.address,
          addressLine2: data.address_line2,
          phone: data.phone_number,
          email: data.email,
          gst: data.gstin,
          logoUrl: data.logo_path,
          default_print_format: data.default_print_format,
        });
      } else {
        // Fallback if the API returns no data
        setCompanyDetails({
          name: "SBR Solutions Pvt Ltd",
          addressLine1: "123, MG Road",
          addressLine2: "Bengaluru, Karnataka - 560001",
          phone: "+91-98765-43210",
          email: "info@sbrpos.com",
          gst: "29ABCDE1234F2Z5",
          logoUrl: "/logo.png",
          default_print_format: "A4",
        });
      }
    } catch (err) {
      console.error("Failed to fetch company info:", err);
      // Fallback in case of API failure
      setCompanyDetails({
        name: "SBR Solutions Pvt Ltd",
        addressLine1: "123, MG Road",
        addressLine2: "Bengaluru, Karnataka - 560001",
        phone: "+91-98765-43210",
        email: "info@sbrpos.com",
        gst: "29ABCDE1234F2Z5",
        logoUrl: "/logo.png",
        default_print_format: "A4",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Keep your existing endpoints
      const [pRes, cRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/server/api/products.php`),
        axios.get(`${API_BASE_URL}/server/api/customers.php`),
        // ADD THE NEW FETCH CALL
        fetchCompanyInfo()
      ]);
      setProducts(parseProductsFromResponse(pRes.data));
      setCustomers(parseProductsFromResponse(cRes.data));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Check backend.");
      setLoading(false);
    }
  };

  const parseProductsFromResponse = (resData) => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData.products)) return resData.products;
    if (Array.isArray(resData.data)) return resData.data;
    if (Array.isArray(resData.items)) return resData.items;
    return [];
  };

  /* ---------- CART HELPERS ---------- */
  const canAddOnMobile = () => isMobile;
  const handleAddToCart = (product, qty = 1) => {
    if (!product) return;
    if (canAddOnMobile() && !selectedCustomer) {
      return alert("Select a customer first (mobile).");
    }
    const id =
      product.id ?? product.ID ?? product.product_id ?? product.sku ?? JSON.stringify(product).slice(0, 12);
    const price = Number(product.price ?? product.sale_price ?? product.price_inr ?? 0);
    if (isNaN(price)) {
      return alert("Product has invalid price. Cannot add to cart.");
    }
    const existing = cart.find((c) => c.id === id);
    if (existing) {
      setCart(cart.map((i) => (i.id === id ? { ...i, quantity: Number(i.quantity) + qty } : i)));
    } else {
      setCart([...cart, { ...product, id, quantity: qty, price }]);
    }
  };

  const handleRemoveFromCart = (productId) => setCart(cart.filter((i) => i.id !== productId));
  const updateQuantity = (productId, qty) => setCart(cart.map((i) => (i.id === productId ? { ...i, quantity: qty } : i)));

  const handleClearCart = () => {
    setCart([]);
    setSelectedCustomer(DEFAULT_WALKIN_CUSTOMER);
    setDiscount(0);
  };

  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customer: selectedCustomer || DEFAULT_WALKIN_CUSTOMER,
      cart: [...cart],
      discount
    };
    setHeldCarts(prev => [newHold, ...prev]);
    setCart([]);
    setSelectedCustomer(DEFAULT_WALKIN_CUSTOMER);
    setDiscount(0);
  };

  const handleRecallCart = (holdId) => {
    const target = heldCarts.find(h => h.id === holdId);
    if (!target) return;
    setCart(target.cart);
    setSelectedCustomer(target.customer || DEFAULT_WALKIN_CUSTOMER);
    setDiscount(target.discount || 0);
    setHeldCarts(prev => prev.filter(h => h.id !== holdId));
  };

  useEffect(() => {
    let buffer = "";
    let lastTime = Date.now();

    const handleKeyDown = (e) => {
      const tag = e.target ? e.target.tagName : '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      const now = Date.now();
      if (now - lastTime > 150) {
        buffer = "";
      }
      lastTime = now;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          handleBarcodeScanSuccess(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, cart, selectedCustomer]);

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const payable = Math.max(0, subtotal - Number(discount || 0));

  /* ---------- BARCODE ---------- */
  const handleBarcodeScanSuccess = async (scannedBarcode) => {
    if (canAddOnMobile() && !selectedCustomer) {
      alert("Select a customer first (mobile).");
      setShowProductModal(false);
      return;
    }
    try {
      const res = await axios.get(
        `${API_BASE_URL}/server/api/barcode_lookup.php?sku=${encodeURIComponent(scannedBarcode)}`
      );
      const product = res.data?.product ?? res.data?.data ?? res.data;
      if (!product) {
        alert("Product not found for that barcode.");
        return;
      }
      handleAddToCart(product, 1);
    } catch (err) {
      console.error(err);
      alert("Barcode lookup failed.");
    }
  };

  /* ---------- SEARCH helpers ---------- */
  const filteredProducts = (term = "") => {
    const t = (term ?? "").toString().toLowerCase();
    return (products || []).filter((p) => {
      const name = (p?.name ?? p?.title ?? "").toString().toLowerCase();
      const sku = (p?.sku ?? p?.SKU ?? "").toString().toLowerCase();
      return name.includes(t) || sku.includes(t);
    });
  };

  const filteredCustomers = (term = "") => {
    const t = (term ?? "").toString().toLowerCase();
    return (customers || []).filter((c) => {
      const name = (c?.full_name ?? c?.name ?? "").toString().toLowerCase();
      const phone = (c?.phone_number ?? c?.phone ?? "").toString();
      return name.includes(t) || phone.includes(t);
    });
  };

  /* ---------- PAYMENT ---------- */
  const resetPaymentForm = () => {
    setPaymentAmount("");
    setChangeAmount(0);
    setPaymentMode("cash");
    setUpiId("");
    setGstInputValue("");
    setIsGstCustomer(Boolean(selectedCustomer?.gst_number));
    setDiscount(0);
  };

  /* ---------- Helper: buildReceiptHtml (used when no server receipt_html present) ---------- */
  // NOW ACCEPTS companyDetails AS AN ARGUMENT
  const buildReceiptHtml = (sale, forThermal = false, comp = companyDetails) => {
    const date = new Date(sale?.created_at ?? Date.now()).toLocaleString();
    const items = (sale?.cart_items ?? sale?.items ?? []).map((it) => {
      const qty = Number(it.quantity || it.qty || 1);
      const price = Number(it.price || it.unit_price || 0);
      const total = (qty * price).toFixed(2);
      const name = it.name || it.title || it.product_name || "";
      return { name, qty, price: price.toFixed(2), total };
    });

    const containerStyle = forThermal
      ? `width:240px;font-family:monospace; font-size:12px; margin:0 auto;`
      : `max-width:700px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;font-size:14px;`;

    const logoHtml = comp.logoUrl ? `<div style="text-align:center;margin-bottom:8px;"><img src="${comp.logoUrl}" style="max-height:60px;max-width:160px" alt="logo" /></div>` : "";

    const itemsRows = items
      .map(
        (it) => `
      <tr>
        <td style="padding:6px 0">${it.name}</td>
        <td style="padding:6px 0;text-align:center">${it.qty}</td>
        <td style="padding:6px 0;text-align:right">₹${it.price}</td>
        <td style="padding:6px 0;text-align:right">₹${it.total}</td>
      </tr>
    `
      )
      .join("");

    const gstHtml = sale?.gst_number ? `<div>Customer GST: ${sale.gst_number}</div>` : "";

    const html = `
      <div style="${containerStyle}">
        ${logoHtml}
        <div style="text-align:center;font-weight:700;font-size:16px">${comp.name}</div>
        <div style="text-align:center;font-size:12px;margin-bottom:6px">${comp.addressLine1}${comp.addressLine2 ? `<br/>${comp.addressLine2}` : ""}</div>
        <div style="text-align:center;font-size:12px;margin-bottom:8px">Phone: ${comp.phone} ${comp.email ? `• ${comp.email}` : ""} ${comp.gst ? `<br/>GST: ${comp.gst}` : ""}</div>

        <div style="margin:8px 0;border-top:1px dashed #999"></div>

        <div>
          <div><strong>Invoice ID:</strong> ${sale.id ?? sale.invoice_id ?? sale.sale_id ?? "N/A"}</div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Customer:</strong> ${sale.customer_name ?? "Walk-in"}</div>
          ${gstHtml}
        </div>

        <table style="width:100%;margin-top:8px;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid #ddd">
              <th style="text-align:left">Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Rate</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="margin-top:8px;border-top:1px dashed #999;padding-top:8px">
          <div style="display:flex;justify-content:space-between"><div>Subtotal</div><div>₹${Number(sale.total_amount ?? sale.subtotal ?? 0).toFixed(2)}</div></div>
          <div style="display:flex;justify-content:space-between"><div>Discount</div><div>₹${Number(sale.discount ?? 0).toFixed(2)}</div></div>
          <div style="display:flex;justify-content:space-between;font-weight:700"><div>Payable</div><div>₹${Number(sale.payable_amount ?? sale.payable ?? sale.total_amount ?? 0).toFixed(2)}</div></div>
          <div style="margin-top:8px">Payment: ${sale.payment_mode ?? "NA"} ${sale.upi_id ? `• UPI:${sale.upi_id}` : ""}</div>
        </div>

        <div style="text-align:center;margin-top:10px;font-size:12px">Thank you for your business!</div>
      </div>
    `;
    return html;
  };

  /* ---------- Helper: open print window ---------- */
  const openPrintWindowWithHtml = (html, autoPrint = false) => {
    try {
      const w = window.open("", "_blank", "width=420,height=640");
      if (!w) {
        alert("Pop-up blocked. Allow pop-ups for this site to print receipt.");
        return;
      }
      const full = `
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Invoice</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; margin: 8px; }
          .top-actions { position: fixed; right: 8px; top: 8px; z-index: 999; }
          .no-print { display:block; }
          @media print { .no-print { display:none; } }
        </style>
      </head>
      <body>
        <div class="no-print top-actions">
          <button onclick="window.print();" style="padding:8px 10px;margin-right:6px;background:#0b79ff;color:#fff;border:none;border-radius:4px;cursor:pointer">Print</button>
          <button onclick="window.close();" style="padding:8px 10px;background:#6c757d;color:#fff;border:none;border-radius:4px;cursor:pointer">Close</button>
        </div>
        <div style="margin-top:44px;">
          ${html}
        </div>
      </body>
      </html>
      `;
      w.document.open();
      w.document.write(full);
      w.document.close();
      if (autoPrint) {
        setTimeout(() => {
          try { w.print(); } catch (e) { /* ignore */ }
        }, 700);
      }
    } catch (e) {
      console.error("openPrintWindowWithHtml error", e);
    }
  };

/* ---------- PROCESS SALE (REPLACEMENT) ---------- */
const handleProcessSale = async () => {
  if (!user?.id) setUser(fallbackUser);
  if (!cart.length) {
    alert("Cart is empty. Add items before processing sale.");
    return;
  }

  let gstNumberToSend = null;
  if (isGstCustomer) {
    if (selectedCustomer?.gstin) gstNumberToSend = selectedCustomer.gstin;
    else if (gstInputValue && gstInputValue.trim()) gstNumberToSend = gstInputValue.trim();
    else {
      alert("Enter GST number for GST-registered customer.");
      return;
    }
  }

  if (paymentMode === "upi" && (!upiId || !upiId.trim())) {
    alert("Enter UPI ID for UPI payments.");
    return;
  }

  const payload = {
    user_id: user?.id ?? fallbackUser.id,
    customer_id: selectedCustomer ? selectedCustomer.id : null,
    customer_name: selectedCustomer ? (selectedCustomer.full_name ?? selectedCustomer.name) : "Walk-in",
    is_gst_customer: selectedCustomer ? selectedCustomer.is_gst_registered : isGstCustomer,
    gst_number: selectedCustomer ? selectedCustomer.gstin : gstNumberToSend,
    total_amount: subtotal,
    discount: Number(discount || 0),
    payable_amount: payable,
    cart_items: cart.map((i) => ({ id: i.id, name: i.name ?? i.title ?? "", quantity: i.quantity, price: Number(i.price) || 0 })),
    payment_mode: paymentMode,
    upi_id: paymentMode === "upi" ? upiId : null,
  };

  try {
    const res = await axios.post(
      `${API_BASE_URL}/server/api/sales.php`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: true,
        timeout: 20000,
      }
    );

    const ct = (res.headers && res.headers["content-type"]) || "";
    if (typeof res.data === "string" && ct.includes("text/html")) {
      console.error("Server returned HTML. Response body:", res.data.slice(0, 200));
      alert("Server returned HTML (possible login redirect or PHP error). Please check server and login.");
      return;
    }

    if (res.data && res.data.success) {
      const saleFromServer = res.data.sale ?? res.data;
      const receiptHtmlFromServer = res.data.receipt_html ?? null;
      const returnedItems = res.data.items ?? res.data.itemsInserted ?? null;

      const normalizedCartItems = (returnedItems && Array.isArray(returnedItems) && returnedItems.length)
        ? returnedItems.map(it => ({
            name: it.name || it.product_name || it.title || it.product || "",
            quantity: Number(it.quantity ?? it.qty ?? 1),
            price: Number(it.price ?? it.unit_price ?? it.rate ?? it.amount ?? 0)
          }))
        : (payload.cart_items || []);

      const serverCustomerName =
        (saleFromServer && (saleFromServer.customer_name || saleFromServer.customer_full_name || saleFromServer.customer)) ||
        null;

      const normalizedCustomerName = serverCustomerName
        || (selectedCustomer && (selectedCustomer.full_name || selectedCustomer.name))
        || payload.customer_name
        || "Walk-in Customer";

      const normalizedIsGst = (typeof saleFromServer?.is_gst_customer !== "undefined")
        ? Boolean(saleFromServer.is_gst_customer)
        : Boolean(selectedCustomer?.is_gst_registered || isGstCustomer);

      const normalizedGstNumber =
        saleFromServer?.gst_number ?? selectedCustomer?.gstin ?? gstInputValue ?? null;

      const lastSaleToSet = {
        ...saleFromServer,
        cart_items: saleFromServer.cart_items ?? normalizedCartItems,
        items: saleFromServer.items ?? returnedItems ?? normalizedCartItems,
        customer_name: String(saleFromServer?.customer_name || saleFromServer?.customer_full_name || normalizedCustomerName),
        customer_id: saleFromServer?.customer_id ?? payload.customer_id ?? selectedCustomer?.id ?? null,
        is_gst_customer: normalizedIsGst,
        gst_number: normalizedGstNumber
      };

      setLastSale(lastSaleToSet);
      setCart([]);
      setDiscount(0);
      setShowPaymentModal(false);
      resetPaymentForm();

      let toPrintHtml = null;
      if (receiptHtmlFromServer && typeof receiptHtmlFromServer === "string") {
        toPrintHtml = receiptHtmlFromServer;
      } else {
        toPrintHtml = buildReceiptHtml(lastSaleToSet, false, companyDetails);
      }

      openPrintWindowWithHtml(toPrintHtml, /*autoPrint=*/false);
    } else {
      console.error("Sale failed. Backend response:", res.data);
      const msg = res.data?.message || JSON.stringify(res.data) || "Server rejected the sale request.";
      alert(`Process Sale failed: ${msg}`);
    }
  } catch (err) {
    console.error("handleProcessSale error:", err);

    if (err.response) {
      const status = err.response.status;
      const ct = (err.response.headers && err.response.headers["content-type"]) || "";
      const data = err.response.data;
      if (typeof data === "string" && ct.includes("text/html")) {
        const snippet = data.slice(0, 800).replace(/<[^>]*>/g, "").slice(0, 300);
        alert(`Server responded with HTML (status ${status}). Likely auth / server error. Snippet:\n\n${snippet}`);
        return;
      }
      if (data && typeof data === "object") {
        const serverMsg = data.message || JSON.stringify(data).slice(0, 450);
        alert(`Server error (${status}): ${serverMsg}`);
        return;
      }
      alert(`Server error (${status}): ${String(data).slice(0, 400)}`);
      return;
    }

    if (err.request) {
      alert("No response from server. Possible network/CORS issue or server crash. Check server logs.");
      return;
    }

    alert("Unexpected error: " + (err.message || String(err)));
  }
};


  /* ---------- NEW CUSTOMER ---------- */
  const handleNewCustomerChange = (name, value) => setNewCustomer((p) => ({ ...p, [name]: value }));
  const handleAddNewCustomer = async (e) => {
    e?.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/server/api/customers.php`, newCustomer, { withCredentials: true });
      alert("New customer added!");
      setShowNewCustomerModal(false);
      setNewCustomer({ full_name: "", phone_number: "", email: "", address: "" });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add customer.");
    }
  };

  /* ---------- Props to pass down (includes company) ---------- */
  const sharedProps = {
    user,
    isMobile,
    products,
    customers,
    company: companyDetails, // <-- pass company so InvoiceModal can use it
    cart,
    setCart,
    selectedCustomer,
    setSelectedCustomer,
    setLastSale,
    lastSale,
    handleAddToCart,
    handleRemoveFromCart,
    updateQuantity,
    handleClearCart,
    handleHoldCart,
    handleRecallCart,
    heldCarts,
    subtotal,
    payable,
    discount,
    setDiscount,
    showProductModal,
    setShowProductModal,
    showNewCustomerModal,
    setShowNewCustomerModal,
    showPaymentModal,
    setShowPaymentModal,
    resetPaymentForm,
    paymentAmount,
    changeAmount,
    isGstCustomer,
    setGstInputValue,
    paymentMode,
    upiId,
    gstInputValue,
    setPaymentAmount,
    setChangeAmount,
    setIsGstCustomer,
    setPaymentMode,
    setUpiId,
    handleProcessSale,
    handleBarcodeScanSuccess,
    handleNewCustomerChange,
    handleAddNewCustomer,
    filteredProducts,
    filteredCustomers,
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return isMobile ? <SalesMobile {...sharedProps} /> : <SalesDesktop {...sharedProps} />;
};

export default Sales;