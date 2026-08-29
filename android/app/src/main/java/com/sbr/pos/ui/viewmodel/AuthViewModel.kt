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
        val cleanUsername = username.trim()
        viewModelScope.launch {
            _isLoading.value = true
            _loginError.value = null
            try {
                val response = RetrofitClient.apiService.login(
                    mapOf("username" to cleanUsername, "password" to password)
                )
                val body = response.body()
                if (response.isSuccessful && body?.success == true && body.user != null) {
                    _currentUser.value = body.user
                } else {
                    _loginError.value = body?.message ?: "Invalid username or password"
                }
            } catch (e: Exception) {
                // Fallback for offline mode if matching mock user exists
                val sampleUsers = MockDataProvider.getSampleUsers()
                val match = sampleUsers.find { it.username.equals(cleanUsername, ignoreCase = true) }
                if (match != null) {
                    _currentUser.value = match
                } else {
                    _loginError.value = "Failed to connect to server: ${e.localizedMessage ?: "Network error"}"
                }
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun logout() {
        _currentUser.value = null
        _loginError.value = null
    }

    fun clearError() {
        _loginError.value = null
    }
}
