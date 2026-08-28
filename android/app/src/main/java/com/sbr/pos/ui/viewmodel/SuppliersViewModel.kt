package com.sbr.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.pos.data.api.MockDataProvider
import com.sbr.pos.data.api.RetrofitClient
import com.sbr.pos.data.model.Supplier
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SuppliersViewModel : ViewModel() {

    private val _suppliers = MutableStateFlow<List<Supplier>>(emptyList())
    val suppliers: StateFlow<List<Supplier>> = _suppliers.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadSuppliers()
    }

    fun loadSuppliers() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = RetrofitClient.apiService.getSuppliers()
                if (response.isSuccessful && response.body() != null) {
                    _suppliers.value = response.body()!!
                } else {
                    _suppliers.value = MockDataProvider.getSampleSuppliers()
                }
            } catch (e: Exception) {
                _suppliers.value = MockDataProvider.getSampleSuppliers()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun addSupplier(name: String, contact: String, phone: String, email: String, address: String) {
        val newSupplier = Supplier(
            id = "SUP-${System.currentTimeMillis() % 10000}",
            supplierName = name,
            contactName = contact,
            phoneNumber = phone,
            email = email,
            address = address
        )

        _suppliers.value = listOf(newSupplier) + _suppliers.value

        viewModelScope.launch {
            try {
                RetrofitClient.apiService.addSupplier(newSupplier)
            } catch (e: Exception) {}
        }
    }

    fun updateSupplier(supplier: Supplier) {
        _suppliers.value = _suppliers.value.map {
            if (it.id == supplier.id) supplier else it
        }

        viewModelScope.launch {
            try {
                RetrofitClient.apiService.updateSupplier(supplier)
            } catch (e: Exception) {}
        }
    }

    fun deleteSupplier(supplierId: String) {
        _suppliers.value = _suppliers.value.filter { it.id != supplierId }

        viewModelScope.launch {
            try {
                RetrofitClient.apiService.deleteSupplier(supplierId)
            } catch (e: Exception) {}
        }
    }
}
