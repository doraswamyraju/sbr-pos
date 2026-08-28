package com.sbr.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.pos.data.api.MockDataProvider
import com.sbr.pos.data.api.RetrofitClient
import com.sbr.pos.data.model.Purchase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PurchasesViewModel : ViewModel() {

    private val _purchases = MutableStateFlow<List<Purchase>>(emptyList())
    val purchases: StateFlow<List<Purchase>> = _purchases.asStateFlow()

    private val _showAddPurchaseSheet = MutableStateFlow(false)
    val showAddPurchaseSheet: StateFlow<Boolean> = _showAddPurchaseSheet.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadPurchases()
    }

    fun loadPurchases() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = RetrofitClient.apiService.getPurchases()
                if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                    _purchases.value = response.body()!!
                } else {
                    _purchases.value = MockDataProvider.getSamplePurchases()
                }
            } catch (e: Exception) {
                _purchases.value = MockDataProvider.getSamplePurchases()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun setShowAddPurchaseSheet(show: Boolean) {
        _showAddPurchaseSheet.value = show
    }

    fun addPurchase(supplierName: String, itemName: String, quantity: Int, totalCost: Double, status: String) {
        val newPO = Purchase(
            id = "PO-${System.currentTimeMillis() % 10000}",
            supplierName = supplierName,
            itemName = itemName,
            quantity = quantity,
            totalCost = totalCost,
            status = status,
            date = "2026-08-19"
        )

        _purchases.value = listOf(newPO) + _purchases.value
        setShowAddPurchaseSheet(false)

        viewModelScope.launch {
            try {
                RetrofitClient.apiService.createPurchase(newPO)
            } catch (e: Exception) {}
        }
    }
}
