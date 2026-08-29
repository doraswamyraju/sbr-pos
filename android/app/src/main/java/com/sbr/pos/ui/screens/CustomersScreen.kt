package com.sbr.pos.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sbr.pos.R
import com.sbr.pos.data.model.Customer
import com.sbr.pos.theme.*
import com.sbr.pos.ui.components.AddCustomerBottomSheet
import com.sbr.pos.ui.viewmodel.CustomersViewModel

@Composable
fun CustomersScreen(
    customersViewModel: CustomersViewModel
) {
    val customers by customersViewModel.customers.collectAsState()
    val searchQuery by customersViewModel.searchQuery.collectAsState()
    val showAddCustomerSheet by customersViewModel.showAddCustomerSheet.collectAsState()

    val filteredCustomers = remember(customers, searchQuery) {
        if (searchQuery.isBlank()) customers
        else customers.filter { c ->
            c.name.contains(searchQuery, ignoreCase = true) ||
            (c.phone?.contains(searchQuery) == true) ||
            (c.email?.contains(searchQuery, ignoreCase = true) == true)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF3F4F6))
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Title & Add Customer Button Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Customers",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDark
                    )
                    Button(
                        onClick = { customersViewModel.setShowAddCustomerSheet(true) },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add Customer", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }

            // Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { customersViewModel.setSearchQuery(it) },
                    placeholder = { Text("Search customers by name, phone, or e...", color = TextLight, fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextDark,
                        unfocusedTextColor = TextDark,
                        focusedBorderColor = PrimaryBlue,
                        unfocusedBorderColor = BorderSubtle
                    )
                )
            }

            // Customer Cards
            if (filteredCustomers.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No customers found.", color = TextMuted)
                    }
                }
            } else {
                items(filteredCustomers) { customer ->
                    CustomerDashboardCard(
                        customer = customer,
                        onEdit = {},
                        onDelete = {}
                    )
                }
            }
        }
    }

    if (showAddCustomerSheet) {
        AddCustomerBottomSheet(
            onSave = { n, p, e, a, g, gstin -> customersViewModel.addCustomer(n, p, e, a, g, gstin) },
            onDismiss = { customersViewModel.setShowAddCustomerSheet(false) }
        )
    }
}

@Composable
fun CustomerDashboardCard(
    customer: Customer,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column {
            // Thin Blue Top Border
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .background(PrimaryBlue)
            )
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = customer.name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = TextDark,
                        modifier = Modifier.weight(1f)
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = "Edit",
                            tint = PrimaryBlue,
                            modifier = Modifier
                                .size(20.dp)
                                .clickable { onEdit() }
                        )
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "Delete",
                            tint = StatusError,
                            modifier = Modifier
                                .size(20.dp)
                                .clickable { onDelete() }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(customer.phone ?: "No phone", fontSize = 13.sp, color = TextMuted)
                if (!customer.email.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(customer.email, fontSize = 13.sp, color = TextMuted)
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // GST Badge
                    val isGst = customer.isGstRegistered == 1
                    Surface(
                        color = if (isGst) Color(0xFFD1FAE5) else Color(0xFFFEE2E2),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = "GST Registered: ${if (isGst) "Yes" else "No"}",
                            color = if (isGst) Color(0xFF065F46) else Color(0xFF991B1B),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }

                    // Status Badge
                    Surface(
                        color = Color(0xFFD1FAE5),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = "Status: Active",
                            color = Color(0xFF065F46),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }
            }
        }
    }
}
