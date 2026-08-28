package com.sbr.pos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sbr.pos.data.model.Purchase
import com.sbr.pos.ui.components.AddPurchaseBottomSheet
import com.sbr.pos.ui.viewmodel.PurchasesViewModel

@Composable
fun PurchasesScreen(
    purchasesViewModel: PurchasesViewModel
) {
    val purchases by purchasesViewModel.purchases.collectAsState()
    val showAddPurchaseSheet by purchasesViewModel.showAddPurchaseSheet.collectAsState()

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { purchasesViewModel.setShowAddPurchaseSheet(true) },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "New Purchase", tint = MaterialTheme.colorScheme.onPrimary)
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
                text = "Supplier Purchase Orders",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )

            Spacer(modifier = Modifier.height(14.dp))

            if (purchases.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No purchase orders recorded.", color = Color.Gray)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(purchases) { purchase ->
                        PurchaseCardItem(purchase = purchase)
                    }
                }
            }
        }
    }

    if (showAddPurchaseSheet) {
        AddPurchaseBottomSheet(
            onSave = { s, i, q, c, st -> purchasesViewModel.addPurchase(s, i, q, c, st) },
            onDismiss = { purchasesViewModel.setShowAddPurchaseSheet(false) }
        )
    }
}

@Composable
fun PurchaseCardItem(purchase: Purchase) {
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
                Text(text = purchase.supplierName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Surface(
                    color = if (purchase.status == "Completed") Color(0xFFD1FAE5) else Color(0xFFFEF3C7),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = purchase.status,
                        color = if (purchase.status == "Completed") Color(0xFF059669) else Color(0xFFD97706),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(text = "Item: ${purchase.itemName} (Qty: ${purchase.quantity})", fontSize = 14.sp)
            Text(
                text = "Total Cost: ₹${String.format("%.2f", purchase.totalCost)} | Date: ${purchase.date}",
                fontSize = 12.sp,
                color = Color.Gray,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}
