package com.example.possystem.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.possystem.data.api.MockDataProvider
import com.example.possystem.data.api.RetrofitClient
import com.example.possystem.data.model.Customer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class CustomersViewModel : ViewModel() {

    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _showAddCustomerSheet = MutableStateFlow(false)
    val showAddCustomerSheet: StateFlow<Boolean> = _showAddCustomerSheet.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadCustomers()
    }

    fun loadCustomers() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = RetrofitClient.apiService.getCustomers()
                if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                    _customers.value = response.body()!!
                } else {
                    _customers.value = MockDataProvider.getSampleCustomers()
                }
            } catch (e: Exception) {
                _customers.value = MockDataProvider.getSampleCustomers()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setShowAddCustomerSheet(show: Boolean) {
        _showAddCustomerSheet.value = show
    }

    fun addCustomer(name: String, phone: String, email: String, address: String) {
        val newCustomer = Customer(
            id = "CUST-${System.currentTimeMillis() % 10000}",
            name = name,
            phone = phone,
            email = email,
            address = address
        )

        _customers.value = listOf(newCustomer) + _customers.value
        setShowAddCustomerSheet(false)

        viewModelScope.launch {
            try {
                RetrofitClient.apiService.addCustomer(newCustomer)
            } catch (e: Exception) {}
        }
    }
}
