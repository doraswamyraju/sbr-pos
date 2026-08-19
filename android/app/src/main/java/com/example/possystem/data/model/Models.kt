package com.example.possystem.data.model

import com.google.gson.annotations.SerializedName

data class User(
    val id: String? = null,
    val username: String = "",
    val name: String? = null,
    val email: String? = null,
    val role: String = "user",
    @SerializedName("is_admin") val isAdmin: Boolean = false,
    val token: String? = null
)

data class Product(
    val id: String = "",
    val name: String = "",
    val sku: String? = null,
    val price: Double = 0.0,
    @SerializedName("stock_level") val stockLevel: Int = 0,
    val category: String? = "General",
    @SerializedName("supplier_id") val supplierId: String? = null,
    val description: String? = null,
    val image: String? = null
)

data class CartItem(
    val product: Product,
    var quantity: Int = 1,
    var customPrice: Double? = null
) {
    val unitPrice: Double get() = customPrice ?: product.price
    val totalPrice: Double get() = unitPrice * quantity
}

data class Customer(
    val id: String = "",
    val name: String = "",
    val phone: String? = null,
    val email: String? = null,
    val address: String? = null,
    @SerializedName("total_purchases") val totalPurchases: Double = 0.0,
    val balance: Double = 0.0
)

data class Lead(
    val id: String = "",
    val name: String = "",
    val email: String? = null,
    val phone: String? = null,
    val company: String? = null,
    val status: String = "New", // New, Contacted, Qualified, Proposal, Won, Lost
    val value: Double = 0.0,
    val source: String? = "Direct",
    val notes: String? = null,
    @SerializedName("created_at") val createdAt: String? = null
)

data class Purchase(
    val id: String = "",
    @SerializedName("supplier_name") val supplierName: String = "",
    @SerializedName("item_name") val itemName: String = "",
    val quantity: Int = 1,
    @SerializedName("total_cost") val totalCost: Double = 0.0,
    val status: String = "Completed", // Pending, Completed, Cancelled
    val date: String = ""
)

data class Subtask(
    val id: String = "",
    @SerializedName("task_id") val taskId: String = "",
    val title: String = "",
    @SerializedName("is_completed") val isCompleted: Boolean = false
)

data class Task(
    val id: String = "",
    @SerializedName("project_id") val projectId: String = "",
    val title: String = "",
    val description: String? = null,
    val priority: String = "Medium", // Low, Medium, High
    val status: String = "Pending", // Pending, In Progress, Completed
    @SerializedName("assigned_to") val assignedTo: String? = null,
    val deadline: String? = null,
    val subtasks: List<Subtask> = emptyList()
)

data class Project(
    val id: String = "",
    val name: String = "",
    @SerializedName("client_name") val clientName: String? = null,
    val status: String = "Active", // Active, Completed, On Hold
    val progress: Int = 0,
    val budget: Double = 0.0,
    val deadline: String? = null,
    val tasks: List<Task> = emptyList()
)

data class SaleItem(
    @SerializedName("product_id") val productId: String = "",
    @SerializedName("product_name") val productName: String = "",
    val quantity: Int = 1,
    val price: Double = 0.0,
    val total: Double = 0.0
)

data class Sale(
    val id: String = "",
    @SerializedName("invoice_no") val invoiceNo: String = "",
    @SerializedName("customer_name") val customerName: String? = "Walk-in Customer",
    @SerializedName("total_amount") val totalAmount: Double = 0.0,
    val discount: Double = 0.0,
    @SerializedName("final_amount") val finalAmount: Double = 0.0,
    @SerializedName("payment_method") val paymentMethod: String = "Cash", // Cash, Card, UPI, Credit
    @SerializedName("payment_status") val paymentStatus: String = "Paid",
    val date: String = "",
    val items: List<SaleItem> = emptyList()
)

data class ReportSummary(
    @SerializedName("total_revenue") val totalRevenue: Double = 0.0,
    @SerializedName("total_sales") val totalSales: Int = 0,
    @SerializedName("total_products") val totalProducts: Int = 0,
    @SerializedName("total_customers") val totalCustomers: Int = 0,
    @SerializedName("low_stock_count") val lowStockCount: Int = 0,
    @SerializedName("top_category") val topCategory: String = "Solar Water Heaters"
)

data class UserSettings(
    @SerializedName("company_name") val companyName: String = "SBR POS System",
    @SerializedName("company_phone") val companyPhone: String = "+91 9876543210",
    @SerializedName("company_address") val companyAddress: String = "Hyderabad, India",
    @SerializedName("tax_rate") val taxRate: Double = 18.0,
    @SerializedName("currency_symbol") val currencySymbol: String = "₹"
)

data class ApiResponse<T>(
    val success: Boolean = true,
    val status: String? = null,
    val message: String? = null,
    val data: T? = null
)

data class LoginResponse(
    val success: Boolean = false,
    val message: String? = null,
    val user: User? = null
)

