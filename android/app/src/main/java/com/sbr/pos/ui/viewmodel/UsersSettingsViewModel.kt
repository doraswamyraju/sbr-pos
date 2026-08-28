package com.sbr.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.pos.data.api.MockDataProvider
import com.sbr.pos.data.api.RetrofitClient
import com.sbr.pos.data.model.User
import com.sbr.pos.data.model.UserSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class UsersSettingsViewModel : ViewModel() {

    private val _users = MutableStateFlow<List<User>>(emptyList())
    val users: StateFlow<List<User>> = _users.asStateFlow()

    private val _settings = MutableStateFlow(UserSettings())
    val settings: StateFlow<UserSettings> = _settings.asStateFlow()

    private val _baseUrlInput = MutableStateFlow(RetrofitClient.getBaseUrl())
    val baseUrlInput: StateFlow<String> = _baseUrlInput.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadUsersAndSettings()
    }

    fun loadUsersAndSettings() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val usersResponse = RetrofitClient.apiService.getUsers()
                if (usersResponse.isSuccessful && !usersResponse.body().isNullOrEmpty()) {
                    _users.value = usersResponse.body()!!
                } else {
                    _users.value = MockDataProvider.getSampleUsers()
                }

                val settingsResponse = RetrofitClient.apiService.getSettings()
                if (settingsResponse.isSuccessful && settingsResponse.body() != null) {
                    _settings.value = settingsResponse.body()!!
                }
            } catch (e: Exception) {
                _users.value = MockDataProvider.getSampleUsers()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun setBaseUrlInput(url: String) {
        _baseUrlInput.value = url
    }

    fun applyBaseUrl() {
        RetrofitClient.updateBaseUrl(_baseUrlInput.value)
        loadUsersAndSettings()
    }

    fun updateSettings(name: String, phone: String, address: String, taxRate: Double) {
        _settings.value = _settings.value.copy(
            companyName = name,
            companyPhone = phone,
            companyAddress = address,
            taxRate = taxRate
        )
    }

    fun addUser(username: String, name: String, email: String, role: String) {
        val newUser = User(
            id = "${System.currentTimeMillis() % 10000}",
            username = username,
            name = name,
            email = email,
            role = role,
            isAdmin = role.lowercase().contains("admin")
        )
        _users.value = _users.value + newUser
    }
}
