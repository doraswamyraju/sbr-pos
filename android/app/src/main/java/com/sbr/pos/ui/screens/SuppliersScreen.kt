package com.sbr.pos.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sbr.pos.data.model.Supplier
import com.sbr.pos.ui.components.AddSupplierBottomSheet
import com.sbr.pos.ui.viewmodel.SuppliersViewModel
import com.sbr.pos.theme.PrimaryBlue
import com.sbr.pos.theme.TextDark
import com.sbr.pos.theme.TextLight
import com.sbr.pos.theme.TextMuted
import com.sbr.pos.theme.BorderSubtle
import com.sbr.pos.theme.StatusError

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SuppliersScreen(
    suppliersViewModel: SuppliersViewModel
) {
    val suppliers by suppliersViewModel.suppliers.collectAsState()
    val searchQuery by suppliersViewModel.searchQuery.collectAsState()

    var showAddSheet by remember { mutableStateOf(false) }
    var editingSupplier by remember { mutableStateOf<Supplier?>(null) }
    var deletingSupplierId by remember { mutableStateOf<String?>(null) }

    val filteredSuppliers = remember(suppliers, searchQuery) {
        if (searchQuery.isBlank()) {
            suppliers
        } else {
            suppliers.filter { s ->
                s.supplierName.contains(searchQuery, ignoreCase = true) ||
                (s.contactName?.contains(searchQuery, ignoreCase = true) == true) ||
                (s.phoneNumber?.contains(searchQuery) == true)
            }
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddSheet = true },
                containerColor = PrimaryBlue,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Supplier")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            Text(
                text = "Supplier Management",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = "Directory of active suppliers and warehouse contacts",
                fontSize = 12.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { suppliersViewModel.setSearchQuery(it) },
                placeholder = { Text("Search by name, contact or phone...", color = TextLight, fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryBlue) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { suppliersViewModel.setSearchQuery("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", tint = TextMuted)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = TextDark,
                    unfocusedTextColor = TextDark,
                    focusedBorderColor = PrimaryBlue,
                    unfocusedBorderColor = BorderSubtle
                ),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (filteredSuppliers.isEmpty()) {
                Box(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.LocalShipping,
                            contentDescription = null,
                            tint = TextLight,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = "No suppliers recorded", color = TextMuted, fontSize = 14.sp)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filteredSuppliers) { supplier ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = supplier.supplierName,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = TextDark
                                        )
                                        if (!supplier.contactName.isNullOrBlank()) {
                                            Text(
                                                text = "Contact: ${supplier.contactName}",
                                                fontSize = 13.sp,
                                                color = TextMuted
                                            )
                                        }
                                    }
                                    Row {
                                        IconButton(onClick = { editingSupplier = supplier }) {
                                            Icon(Icons.Default.Edit, contentDescription = "Edit", tint = PrimaryBlue, modifier = Modifier.size(20.dp))
                                        }
                                        IconButton(onClick = { deletingSupplierId = supplier.id }) {
                                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = StatusError, modifier = Modifier.size(20.dp))
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                if (!supplier.phoneNumber.isNullOrBlank()) {
                                    Text(text = "Phone: ${supplier.phoneNumber}", fontSize = 12.sp, color = TextMuted)
                                }
                                if (!supplier.email.isNullOrBlank()) {
                                    Text(text = "Email: ${supplier.email}", fontSize = 12.sp, color = TextMuted)
                                }
                                if (!supplier.address.isNullOrBlank()) {
                                    Text(text = "Address: ${supplier.address}", fontSize = 12.sp, color = TextMuted)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddSheet) {
        AddSupplierBottomSheet(
            onSave = { n, c, p, e, a ->
                suppliersViewModel.addSupplier(n, c, p, e, a)
                showAddSheet = false
            },
            onDismiss = { showAddSheet = false }
        )
    }

    if (editingSupplier != null) {
        AddSupplierBottomSheet(
            supplier = editingSupplier,
            onSave = { n, c, p, e, a ->
                suppliersViewModel.updateSupplier(
                    editingSupplier!!.copy(
                        supplierName = n,
                        contactName = c,
                        phoneNumber = p,
                        email = e,
                        address = a
                    )
                )
                editingSupplier = null
            },
            onDismiss = { editingSupplier = null }
        )
    }

    if (deletingSupplierId != null) {
        AlertDialog(
            onDismissRequest = { deletingSupplierId = null },
            title = { Text("Delete Supplier?") },
            text = { Text("Are you sure you want to remove this supplier profile? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        suppliersViewModel.deleteSupplier(deletingSupplierId!!)
                        deletingSupplierId = null
                    }
                ) {
                    Text("Delete", color = StatusError)
                }
            },
            dismissButton = {
                TextButton(onClick = { deletingSupplierId = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}
