package com.example.possystem.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.possystem.data.model.User
import com.example.possystem.ui.viewmodel.AuthViewModel
import com.example.possystem.ui.viewmodel.UsersSettingsViewModel

@Composable
fun UsersSettingsScreen(
    usersSettingsViewModel: UsersSettingsViewModel,
    authViewModel: AuthViewModel
) {
    val users by usersSettingsViewModel.users.collectAsState()
    val settings by usersSettingsViewModel.settings.collectAsState()
    val baseUrlInput by usersSettingsViewModel.baseUrlInput.collectAsState()
    val currentUser by authViewModel.currentUser.collectAsState()

    var activeTab by remember { mutableStateOf(0) } // 0: Settings, 1: Users

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "System Settings & Users",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )

            IconButton(onClick = { authViewModel.logout() }) {
                Icon(Icons.Default.Logout, contentDescription = "Logout", tint = Color(0xFFEF4444))
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        TabRow(selectedTabIndex = activeTab) {
            Tab(selected = activeTab == 0, onClick = { activeTab = 0 }) {
                Text("App & Server Config", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
            }
            Tab(selected = activeTab == 1, onClick = { activeTab = 1 }) {
                Text("User Accounts (${users.size})", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        if (activeTab == 0) {
            // App & Server Settings Tab
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    Text(text = "Backend Connection Setup", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Text(
                        text = "Set your local XAMPP or production API server URL below.",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }

                item {
                    OutlinedTextField(
                        value = baseUrlInput,
                        onValueChange = { usersSettingsViewModel.setBaseUrlInput(it) },
                        label = { Text("API Base URL") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        trailingIcon = {
                            Button(
                                onClick = { usersSettingsViewModel.applyBaseUrl() },
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.padding(end = 4.dp)
                            ) {
                                Text("Apply")
                            }
                        }
                    )
                }

                item { HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp)) }

                item {
                    Text(text = "Company Details & Tax", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }

                item {
                    var companyName by remember(settings) { mutableStateOf(settings.companyName) }
                    var companyPhone by remember(settings) { mutableStateOf(settings.companyPhone) }
                    var companyAddress by remember(settings) { mutableStateOf(settings.companyAddress) }
                    var taxRate by remember(settings) { mutableStateOf(settings.taxRate.toString()) }

                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = companyName,
                            onValueChange = { companyName = it },
                            label = { Text("Company Name") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = companyPhone,
                            onValueChange = { companyPhone = it },
                            label = { Text("Phone Number") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = companyAddress,
                            onValueChange = { companyAddress = it },
                            label = { Text("Address") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = taxRate,
                            onValueChange = { taxRate = it },
                            label = { Text("GST / Tax Rate (%)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth()
                        )
                        Button(
                            onClick = {
                                usersSettingsViewModel.updateSettings(companyName, companyPhone, companyAddress, taxRate.toDoubleOrNull() ?: 18.0)
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Text("Save Company Settings")
                        }
                    }
                }
            }
        } else {
            // Users Directory Tab
            var showAddUserDialog by remember { mutableStateOf(false) }

            Box(modifier = Modifier.fillMaxSize()) {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(users) { u ->
                        UserCardItem(user = u)
                    }
                }

                FloatingActionButton(
                    onClick = { showAddUserDialog = true },
                    modifier = Modifier.align(Alignment.BottomEnd),
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.PersonAdd, contentDescription = "Add User", tint = MaterialTheme.colorScheme.onPrimary)
                }
            }

            if (showAddUserDialog) {
                AddUserDialog(
                    onSave = { username, name, email, role ->
                        usersSettingsViewModel.addUser(username, name, email, role)
                        showAddUserDialog = false
                    },
                    onDismiss = { showAddUserDialog = false }
                )
            }
        }
    }
}

@Composable
fun UserCardItem(user: User) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = user.name ?: user.username, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Text(text = "Username: ${user.username} | Role: ${user.role}", fontSize = 12.sp, color = Color.Gray)
                if (!user.email.isNullOrBlank()) {
                    Text(text = user.email, fontSize = 11.sp, color = Color.LightGray)
                }
            }
            Surface(
                color = if (user.isAdmin) Color(0xFFD1FAE5) else MaterialTheme.colorScheme.secondaryContainer,
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    text = if (user.isAdmin) "Admin" else "Staff",
                    color = if (user.isAdmin) Color(0xFF059669) else MaterialTheme.colorScheme.onSecondaryContainer,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }
        }
    }
}

@Composable
fun AddUserDialog(
    onSave: (username: String, name: String, email: String, role: String) -> Unit,
    onDismiss: () -> Unit
) {
    var username by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("user") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add New System User") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = username, onValueChange = { username = it }, label = { Text("Username *") }, singleLine = true)
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full Name") }, singleLine = true)
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = role == "user", onClick = { role = "user" }, label = { Text("Staff") })
                    FilterChip(selected = role == "admin", onClick = { role = "admin" }, label = { Text("Admin") })
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                if (username.isNotBlank()) {
                    onSave(username, name, email, role)
                }
            }) {
                Text("Create User")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
