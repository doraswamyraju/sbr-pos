package com.example.possystem.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.possystem.data.api.MockDataProvider
import com.example.possystem.data.api.RetrofitClient
import com.example.possystem.data.model.ReportSummary
import com.example.possystem.data.model.Sale
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ReportsViewModel : ViewModel() {

    private val _summary = MutableStateFlow(MockDataProvider.getSampleReports())
    val summary: StateFlow<ReportSummary> = _summary.asStateFlow()

    private val _recentSales = MutableStateFlow<List<Sale>>(emptyList())
    val recentSales: StateFlow<List<Sale>> = _recentSales.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadReports()
    }

    fun loadReports() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val repResponse = RetrofitClient.apiService.getReportSummary()
                if (repResponse.isSuccessful && repResponse.body() != null) {
                    _summary.value = repResponse.body()!!
                } else {
                    _summary.value = MockDataProvider.getSampleReports()
                }

                val salesResponse = RetrofitClient.apiService.getSales()
                if (salesResponse.isSuccessful && !salesResponse.body().isNullOrEmpty()) {
                    _recentSales.value = salesResponse.body()!!
                } else {
                    _recentSales.value = MockDataProvider.getSampleSales()
                }
            } catch (e: Exception) {
                _summary.value = MockDataProvider.getSampleReports()
                _recentSales.value = MockDataProvider.getSampleSales()
            } finally {
                _isLoading.value = false
            }
        }
    }
}
