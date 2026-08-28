package com.sbr.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.pos.data.api.MockDataProvider
import com.sbr.pos.data.api.RetrofitClient
import com.sbr.pos.data.model.Product
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class InventoryViewModel : ViewModel() {

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategory = MutableStateFlow("All")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _showAddProductSheet = MutableStateFlow(false)
    val showAddProductSheet: StateFlow<Boolean> = _showAddProductSheet.asStateFlow()

    private val _editingProduct = MutableStateFlow<Product?>(null)
    val editingProduct: StateFlow<Product?> = _editingProduct.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadProducts()
    }

    fun loadProducts() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = RetrofitClient.apiService.getProducts()
                if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                    _products.value = response.body()!!
                } else {
                    _products.value = MockDataProvider.getSampleProducts()
                }
            } catch (e: Exception) {
                _products.value = MockDataProvider.getSampleProducts()
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

    fun openAddProductSheet(productToEdit: Product? = null) {
        _editingProduct.value = productToEdit
        _showAddProductSheet.value = true
    }

    fun closeAddProductSheet() {
        _showAddProductSheet.value = false
        _editingProduct.value = null
    }

    fun saveProduct(name: String, sku: String, price: Double, stock: Int, category: String, description: String) {
        val currentList = _products.value.toMutableList()
        val targetId = _editingProduct.value?.id ?: "PRD-${System.currentTimeMillis() % 10000}"

        val newProduct = Product(
            id = targetId,
            name = name,
            sku = sku.ifBlank { "SKU-$targetId" },
            price = price,
            stockLevel = stock,
            category = category.ifBlank { "General" },
            description = description
        )

        val index = currentList.indexOfFirst { it.id == targetId }
        if (index >= 0) {
            currentList[index] = newProduct
        } else {
            currentList.add(0, newProduct)
        }
        _products.value = currentList
        closeAddProductSheet()

        viewModelScope.launch {
            try {
                if (index >= 0) {
                    RetrofitClient.apiService.updateProduct(newProduct)
                } else {
                    RetrofitClient.apiService.addProduct(newProduct)
                }
            } catch (e: Exception) {
                // Offline fallback already updated state
            }
        }
    }

    fun deleteProduct(id: String) {
        _products.value = _products.value.filter { it.id != id }
        viewModelScope.launch {
            try {
                RetrofitClient.apiService.deleteProduct(id)
            } catch (e: Exception) {}
        }
    }
}
