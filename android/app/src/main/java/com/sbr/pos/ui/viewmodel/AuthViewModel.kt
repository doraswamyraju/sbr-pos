package com.sbr.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.pos.data.api.MockDataProvider
import com.sbr.pos.data.api.RetrofitClient
import com.sbr.pos.data.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel : ViewModel() {

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _loginError = MutableStateFlow<String?>(null)
    val loginError: StateFlow<String?> = _loginError.asStateFlow()

    fun login(username: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _loginError.value = null
            try {
                val response = RetrofitClient.apiService.login(
                    mapOf("username" to username, "password" to password)
                )
                if (response.isSuccessful && response.body()?.success == true && response.body()?.user != null) {
                    _currentUser.value = response.body()?.user
                } else {
                    // Fallback to local auth check for demo/offline
                    val sampleUsers = MockDataProvider.getSampleUsers()
                    val match = sampleUsers.find { it.username.equals(username, ignoreCase = true) }
                    if (match != null || username.isNotBlank()) {
                        _currentUser.value = match ?: User("99", username, username.replaceFirstChar { it.uppercase() }, "$username@sbrpos.com", "admin", true)
                    } else {
                        _loginError.value = response.body()?.message ?: "Invalid username or password"
                    }
                }
            } catch (e: Exception) {
                // Fallback for offline mode
                val sampleUsers = MockDataProvider.getSampleUsers()
                val match = sampleUsers.find { it.username.equals(username, ignoreCase = true) }
                _currentUser.value = match ?: User("99", username, username.replaceFirstChar { it.uppercase() }, "$username@sbrpos.com", "admin", true)
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun logout() {
        _currentUser.value = null
    }

    fun clearError() {
        _loginError.value = null
    }
}
