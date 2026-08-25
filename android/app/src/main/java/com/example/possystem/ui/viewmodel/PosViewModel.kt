package com.example.possystem.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.possystem.data.api.MockDataProvider
import com.example.possystem.data.api.RetrofitClient
import com.example.possystem.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class PosViewModel : ViewModel() {

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()

    private val _cart = MutableStateFlow<List<CartItem>>(emptyList())
    val cart: StateFlow<List<CartItem>> = _cart.asStateFlow()

    private val _selectedCustomer = MutableStateFlow<Customer?>(null)
    val selectedCustomer: StateFlow<Customer?> = _selectedCustomer.asStateFlow()

    private val _discount = MutableStateFlow(0.0)
    val discount: StateFlow<Double> = _discount.asStateFlow()

    private val _paymentMethod = MutableStateFlow("Cash") // Cash, Card, UPI, Credit
    val paymentMethod: StateFlow<String> = _paymentMethod.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategory = MutableStateFlow("All")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _showCheckoutSheet = MutableStateFlow(false)
    val showCheckoutSheet: StateFlow<Boolean> = _showCheckoutSheet.asStateFlow()

    private val _showBarcodeSheet = MutableStateFlow(false)
    val showBarcodeSheet: StateFlow<Boolean> = _showBarcodeSheet.asStateFlow()

    private val _lastCompletedSale = MutableStateFlow<Sale?>(null)
    val lastCompletedSale: StateFlow<Sale?> = _lastCompletedSale.asStateFlow()

    private val _showInvoiceModal = MutableStateFlow(false)
    val showInvoiceModal: StateFlow<Boolean> = _showInvoiceModal.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val prodResponse = RetrofitClient.apiService.getProducts()
                if (prodResponse.isSuccessful && !prodResponse.body().isNullOrEmpty()) {
                    _products.value = prodResponse.body()!!
                } else {
                    _products.value = MockDataProvider.getSampleProducts()
                }

                val custResponse = RetrofitClient.apiService.getCustomers()
                if (custResponse.isSuccessful && custResponse.body()?.data != null) {
                    _customers.value = custResponse.body()!!.data!!
                } else {
                    _customers.value = MockDataProvider.getSampleCustomers()
                }
            } catch (e: Exception) {
                _products.value = MockDataProvider.getSampleProducts()
                _customers.value = MockDataProvider.getSampleCustomers()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setSelectedCategory(category: String) {
        _selectedCategory.value = category
    }

    fun onBarcodeScanned(barcode: String) {
        val cleanBarcode = barcode.trim()
        val match = _products.value.find { 
            it.sku?.trim()?.equals(cleanBarcode, ignoreCase = true) == true || 
            it.id.trim().equals(cleanBarcode, ignoreCase = true) 
        }
        if (match != null) {
            addToCart(match)
        }
    }

    fun addToCart(product: Product, quantity: Int = 1) {
        val currentCart = _cart.value.toMutableList()
        val index = currentCart.indexOfFirst { it.product.id == product.id }
        if (index >= 0) {
            val existing = currentCart[index]
            currentCart[index] = existing.copy(quantity = existing.quantity + quantity)
        } else {
            currentCart.add(CartItem(product = product, quantity = quantity))
        }
        _cart.value = currentCart
    }

    fun updateCartQuantity(productId: String, newQuantity: Int) {
        if (newQuantity <= 0) {
            removeFromCart(productId)
            return
        }
        val currentCart = _cart.value.toMutableList()
        val index = currentCart.indexOfFirst { it.product.id == productId }
        if (index >= 0) {
            currentCart[index] = currentCart[index].copy(quantity = newQuantity)
            _cart.value = currentCart
        }
    }

    fun removeFromCart(productId: String) {
        _cart.value = _cart.value.filter { it.product.id != productId }
    }

    fun clearCart() {
        _cart.value = emptyList()
        _discount.value = 0.0
        _selectedCustomer.value = null
    }

    fun setDiscount(amount: Double) {
        _discount.value = amount
    }

    fun setPaymentMethod(method: String) {
        _paymentMethod.value = method
    }

    fun selectCustomer(customer: Customer?) {
        _selectedCustomer.value = customer
    }

    fun setShowCheckoutSheet(show: Boolean) {
        _showCheckoutSheet.value = show
    }

    fun setShowBarcodeSheet(show: Boolean) {
        _showBarcodeSheet.value = show
    }

    fun setShowInvoiceModal(show: Boolean) {
        _showInvoiceModal.value = show
    }

    val subtotal: Double
        get() = _cart.value.sumOf { it.totalPrice }

    val finalTotal: Double
        get() = (subtotal - _discount.value).coerceAtLeast(0.0)

    val cartItemCount: Int
        get() = _cart.value.sumOf { it.quantity }

    fun processCheckout() {
        if (_cart.value.isEmpty()) return

        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        val dateStr = sdf.format(Date())
        val invoiceNo = "INV-${System.currentTimeMillis() % 100000}"

        val items = _cart.value.map {
            SaleItem(
                productId = it.product.id,
                productName = it.product.name,
                quantity = it.quantity,
                price = it.unitPrice,
                total = it.totalPrice
            )
        }

        val sale = Sale(
            id = "SL-${System.currentTimeMillis() % 10000}",
            invoiceNo = invoiceNo,
            customerName = _selectedCustomer.value?.name ?: "Walk-in Customer",
            totalAmount = subtotal,
            discount = _discount.value,
            finalAmount = finalTotal,
            paymentMethod = _paymentMethod.value,
            paymentStatus = "Paid",
            date = dateStr,
            items = items
        )

        val request = CreateSaleRequest(
            userId = 1,
            customerId = _selectedCustomer.value?.id,
            customerName = _selectedCustomer.value?.name ?: "Walk-in Customer",
            totalAmount = subtotal,
            discount = _discount.value,
            payableAmount = finalTotal,
            paymentMode = _paymentMethod.value,
            paymentMethod = _paymentMethod.value,
            cartItems = items,
            items = items
        )

        viewModelScope.launch {
            try {
                val response = RetrofitClient.apiService.createSale(request)
                if (response.isSuccessful) {
                    loadData()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            _lastCompletedSale.value = sale
            _showCheckoutSheet.value = false
            _showInvoiceModal.value = true
            clearCart()
        }
    }
}
