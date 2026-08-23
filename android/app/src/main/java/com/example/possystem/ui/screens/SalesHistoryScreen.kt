package com.example.possystem.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.possystem.data.model.Sale
import com.example.possystem.ui.components.InvoiceDialog
import com.example.possystem.ui.viewmodel.ReportsViewModel
import com.example.possystem.theme.PrimaryBlue
import com.example.possystem.theme.TextDark
import com.example.possystem.theme.TextLight
import com.example.possystem.theme.TextMuted
import com.example.possystem.theme.BorderSubtle

@Composable
fun SalesHistoryScreen(
    reportsViewModel: ReportsViewModel
) {
    val sales by reportsViewModel.recentSales.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedSaleDetail by remember { mutableStateOf<Sale?>(null) }

    val filteredSales = remember(sales, searchQuery) {
        if (searchQuery.isBlank()) {
            sales
        } else {
            sales.filter { sale ->
                sale.invoiceNo.contains(searchQuery, ignoreCase = true) ||
                sale.customerName.contains(searchQuery, ignoreCase = true)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Sales History",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
        )
        Text(
            text = "Search and view invoices, print thermal receipts, or share",
            fontSize = 12.sp,
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by Invoice No or Customer Name...", color = TextLight) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryBlue) },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { searchQuery = "" }) {
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

        if (filteredSales.isEmpty()) {
            Box(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.ReceiptLong,
                        contentDescription = null,
                        tint = TextLight,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "No sales records found", color = TextMuted, fontSize = 14.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredSales) { sale ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedSaleDetail = sale },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(16.dp)
                                .fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = sale.invoiceNo,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = TextDark
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "${sale.customerName} • ${sale.paymentMethod}",
                                    fontSize = 13.sp,
                                    color = TextMuted
                                )
                                Text(
                                    text = sale.date,
                                    fontSize = 11.sp,
                                    color = Color.LightGray
                                )
                            }
                            Text(
                                text = "₹${String.format("%.2f", sale.finalAmount)}",
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp,
                                color = PrimaryBlue
                            )
                        }
                    }
                }
            }
        }
    }

    if (selectedSaleDetail != null) {
        InvoiceDialog(
            sale = selectedSaleDetail!!,
            onDismiss = { selectedSaleDetail = null }
        )
    }
}
