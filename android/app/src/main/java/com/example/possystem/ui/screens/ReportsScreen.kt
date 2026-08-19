package com.example.possystem.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.possystem.data.model.Sale
import com.example.possystem.ui.viewmodel.ReportsViewModel

@Composable
fun ReportsScreen(
    reportsViewModel: ReportsViewModel
) {
    val summary by reportsViewModel.summary.collectAsState()
    val recentSales by reportsViewModel.recentSales.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "Reports & Analytics",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
        }

        // Summary Metric Cards Grid
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Total Revenue",
                    value = "₹${String.format("%.0f", summary.totalRevenue)}",
                    icon = Icons.Default.TrendingUp,
                    color = Color(0xFF10B981),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Total Sales",
                    value = "${summary.totalSales}",
                    icon = Icons.Default.ReceiptLong,
                    color = Color(0xFF3B82F6),
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Low Stock Alerts",
                    value = "${summary.lowStockCount}",
                    icon = Icons.Default.Warning,
                    color = Color(0xFFEF4444),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Top Category",
                    value = summary.topCategory,
                    icon = Icons.Default.Category,
                    color = Color(0xFF8B5CF6),
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Text(
                text = "Recent Sales History",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        if (recentSales.isEmpty()) {
            item {
                Text("No recent sales recorded.", color = Color.Gray, fontSize = 13.sp)
            }
        } else {
            items(recentSales) { sale ->
                RecentSaleCardItem(sale = sale)
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = title, fontSize = 11.sp, color = Color.Gray)
            Text(text = value, fontSize = 16.sp, fontWeight = FontWeight.Black, color = color, maxLines = 1)
        }
    }
}

@Composable
fun RecentSaleCardItem(sale: Sale) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = sale.invoiceNo, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(text = "${sale.customerName} • ${sale.paymentMethod}", fontSize = 12.sp, color = Color.Gray)
                Text(text = sale.date, fontSize = 11.sp, color = Color.LightGray)
            }
            Text(
                text = "₹${String.format("%.2f", sale.finalAmount)}",
                fontWeight = FontWeight.Black,
                fontSize = 15.sp,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
