package com.example.possystem.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.possystem.data.model.Product
import com.example.possystem.theme.*
import com.example.possystem.ui.components.AddProductBottomSheet
import com.example.possystem.ui.viewmodel.InventoryViewModel

@Composable
fun InventoryScreen(
    inventoryViewModel: InventoryViewModel
) {
    val products by inventoryViewModel.products.collectAsState()
    val searchQuery by inventoryViewModel.searchQuery.collectAsState()
    val selectedCategory by inventoryViewModel.selectedCategory.collectAsState()
    val showAddProductSheet by inventoryViewModel.showAddProductSheet.collectAsState()
    val editingProduct by inventoryViewModel.editingProduct.collectAsState()
    val isLoading by inventoryViewModel.isLoading.collectAsState()

    val categories = remember(products) {
        listOf("All") + products.mapNotNull { it.category }.distinct()
    }

    val filteredProducts = remember(products, searchQuery, selectedCategory) {
        products.filter { p ->
            val matchesQuery = searchQuery.isBlank() ||
                    p.name.contains(searchQuery, ignoreCase = true) ||
                    (p.sku?.contains(searchQuery, ignoreCase = true) == true)
            val matchesCategory = selectedCategory == "All" || p.category == selectedCategory
            matchesQuery && matchesCategory
        }
    }

    val lowStockCount = remember(products) { products.count { it.stockLevel <= 5 } }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { inventoryViewModel.openAddProductSheet() },
                containerColor = PrimaryBlue,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Product")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Inventory Stat Banner
            val bannerGradient = Brush.horizontalGradient(
                colors = listOf(
                    PrimaryBlue,
                    PrimaryBlueDark
                )
            )
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
            ) {
                Row(
                    modifier = Modifier
                        .background(bannerGradient)
                        .padding(20.dp)
                        .fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Inventory Stock Overview",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Total SKUs: ${products.size}  |  Low Stock: $lowStockCount",
                            fontSize = 13.sp,
                            color = Color.White.copy(alpha = 0.9f),
                            fontWeight = FontWeight.Medium
                        )
                    }
                    if (lowStockCount > 0) {
                        Surface(
                            color = StatusError,
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = "$lowStockCount Low Stock",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { inventoryViewModel.setSearchQuery(it) },
                placeholder = { Text("Search inventory by name or SKU...", color = TextLight) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryBlue) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = TextDark,
                    unfocusedTextColor = TextDark,
                    focusedBorderColor = PrimaryBlue,
                    unfocusedBorderColor = BorderSubtle
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Category Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(categories) { cat ->
                    val isSel = selectedCategory == cat
                    FilterChip(
                        selected = isSel,
                        onClick = { inventoryViewModel.setSelectedCategory(cat) },
                        label = { Text(cat, fontWeight = if (isSel) FontWeight.Bold else FontWeight.Normal) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryBlue,
                            selectedLabelColor = Color.White,
                            containerColor = Color.White,
                            labelColor = TextMuted
                        ),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Product List
            if (filteredProducts.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = "No products found in inventory.", color = TextMuted)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(filteredProducts) { item ->
                        InventoryItemCard(
                            product = item,
                            onEdit = { inventoryViewModel.openAddProductSheet(item) },
                            onDelete = { inventoryViewModel.deleteProduct(item.id) }
                        )
                    }
                }
            }
        }
    }

    if (showAddProductSheet) {
        AddProductBottomSheet(
            editingProduct = editingProduct,
            onSave = { n, s, p, st, c, d ->
                inventoryViewModel.saveProduct(n, s, p, st, c, d)
            },
            onDismiss = { inventoryViewModel.closeAddProductSheet() }
        )
    }
}

@Composable
fun InventoryItemCard(
    product: Product,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(14.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = product.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextDark)
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        color = if (product.stockLevel <= 5) StatusErrorBg else StatusSuccessBg,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = if (product.stockLevel <= 5) "Low (${product.stockLevel})" else "Stock: ${product.stockLevel}",
                            color = if (product.stockLevel <= 5) StatusError else StatusSuccess,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "SKU: ${product.sku ?: "N/A"} | Category: ${product.category ?: "General"}",
                    fontSize = 12.sp,
                    color = TextMuted
                )

                Text(
                    text = "Price: ₹${String.format("%.2f", product.price)}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black,
                    color = PrimaryBlue,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Row {
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit", tint = PrimaryBlue)
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = StatusError)
                }
            }
        }
    }
}

