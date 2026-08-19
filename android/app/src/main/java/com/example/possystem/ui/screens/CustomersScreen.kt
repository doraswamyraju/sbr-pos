package com.example.possystem.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.possystem.data.model.Customer
import com.example.possystem.ui.components.AddCustomerBottomSheet
import com.example.possystem.ui.viewmodel.CustomersViewModel

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

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { customersViewModel.setShowAddCustomerSheet(true) },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = "Add Customer", tint = MaterialTheme.colorScheme.onPrimary)
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                text = "Customers Directory",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { customersViewModel.setSearchQuery(it) },
                placeholder = { Text("Search by name, phone or email...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(14.dp))

            if (filteredCustomers.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No customers found.", color = Color.Gray)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(filteredCustomers) { customer ->
                        CustomerCardItem(customer = customer)
                    }
                }
            }
        }
    }

    if (showAddCustomerSheet) {
        AddCustomerBottomSheet(
            onSave = { n, p, e, a -> customersViewModel.addCustomer(n, p, e, a) },
            onDismiss = { customersViewModel.setShowAddCustomerSheet(false) }
        )
    }
}

@Composable
fun CustomerCardItem(customer: Customer) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = customer.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                if (customer.balance > 0) {
                    Surface(color = Color(0xFFFEE2E2), shape = RoundedCornerShape(6.dp)) {
                        Text(
                            text = "Due: ₹${String.format("%.2f", customer.balance)}",
                            color = Color(0xFFDC2626),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color.Gray)
                Spacer(modifier = Modifier.width(6.dp))
                Text(text = customer.phone ?: "No phone", fontSize = 13.sp, color = Color.DarkGray)
            }

            if (!customer.email.isNullOrBlank()) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 2.dp)) {
                    Icon(Icons.Default.Email, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color.Gray)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = customer.email, fontSize = 13.sp, color = Color.DarkGray)
                }
            }

            if (!customer.address.isNullOrBlank()) {
                Text(text = customer.address, fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}
