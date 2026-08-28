package com.sbr.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.pos.data.api.MockDataProvider
import com.sbr.pos.data.api.RetrofitClient
import com.sbr.pos.data.model.Customer
import com.sbr.pos.data.model.Lead
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LeadsViewModel : ViewModel() {

    private val _leads = MutableStateFlow<List<Lead>>(emptyList())
    val leads: StateFlow<List<Lead>> = _leads.asStateFlow()

    private val _selectedStage = MutableStateFlow("All")
    val selectedStage: StateFlow<String> = _selectedStage.asStateFlow()

    private val _showAddLeadSheet = MutableStateFlow(false)
    val showAddLeadSheet: StateFlow<Boolean> = _showAddLeadSheet.asStateFlow()

    private val _editingLead = MutableStateFlow<Lead?>(null)
    val editingLead: StateFlow<Lead?> = _editingLead.asStateFlow()

    private val _showConvertSheet = MutableStateFlow(false)
    val showConvertSheet: StateFlow<Boolean> = _showConvertSheet.asStateFlow()

    private val _leadToConvert = MutableStateFlow<Lead?>(null)
    val leadToConvert: StateFlow<Lead?> = _leadToConvert.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadLeads()
    }

    fun loadLeads() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = RetrofitClient.apiService.getLeads()
                if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                    _leads.value = response.body()!!
                } else {
                    _leads.value = MockDataProvider.getSampleLeads()
                }
            } catch (e: Exception) {
                _leads.value = MockDataProvider.getSampleLeads()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun setSelectedStage(stage: String) {
        _selectedStage.value = stage
    }

    fun openAddLeadSheet(lead: Lead? = null) {
        _editingLead.value = lead
        _showAddLeadSheet.value = true
    }

    fun closeAddLeadSheet() {
        _showAddLeadSheet.value = false
        _editingLead.value = null
    }

    fun openConvertSheet(lead: Lead) {
        _leadToConvert.value = lead
        _showConvertSheet.value = true
    }

    fun closeConvertSheet() {
        _showConvertSheet.value = false
        _leadToConvert.value = null
    }

    fun saveLead(name: String, email: String, phone: String, company: String, status: String, value: Double, notes: String) {
        val current = _leads.value.toMutableList()
        val targetId = _editingLead.value?.id ?: "LD-${System.currentTimeMillis() % 10000}"

        val newLead = Lead(
            id = targetId,
            name = name,
            email = email,
            phone = phone,
            company = company,
            status = status,
            value = value,
            notes = notes,
            createdAt = "2026-08-19"
        )

        val index = current.indexOfFirst { it.id == targetId }
        if (index >= 0) {
            current[index] = newLead
        } else {
            current.add(0, newLead)
        }
        _leads.value = current
        closeAddLeadSheet()

        viewModelScope.launch {
            try {
                RetrofitClient.apiService.addLead(newLead)
            } catch (e: Exception) {}
        }
    }

    fun convertLeadToCustomer(onSuccess: (Customer) -> Unit) {
        val lead = _leadToConvert.value ?: return
        val newCustomer = Customer(
            id = "CUST-${System.currentTimeMillis() % 10000}",
            name = lead.name,
            phone = lead.phone,
            email = lead.email,
            address = lead.company ?: "Converted from Lead"
        )

        // Mark lead status as Won
        val current = _leads.value.toMutableList()
        val idx = current.indexOfFirst { it.id == lead.id }
        if (idx >= 0) {
            current[idx] = current[idx].copy(status = "Won")
            _leads.value = current
        }

        closeConvertSheet()
        onSuccess(newCustomer)

        viewModelScope.launch {
            try {
                RetrofitClient.apiService.convertLeadToCustomer(
                    mapOf("lead_id" to lead.id, "customer_name" to lead.name)
                )
            } catch (e: Exception) {}
        }
    }
}
