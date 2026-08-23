package com.example.possystem.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.possystem.data.model.Product
import com.example.possystem.theme.*
import com.example.possystem.ui.components.BarcodeBottomSheet
import com.example.possystem.ui.components.CheckoutBottomSheet
import com.example.possystem.ui.components.InvoiceDialog
import com.example.possystem.ui.viewmodel.PosViewModel

@Composable
fun PosScreen(
    posViewModel: PosViewModel
) {
    val products by posViewModel.products.collectAsState()
    val customers by posViewModel.customers.collectAsState()
    val cart by posViewModel.cart.collectAsState()
    val searchQuery by posViewModel.searchQuery.collectAsState()
    val selectedCategory by posViewModel.selectedCategory.collectAsState()
    val showCheckoutSheet by posViewModel.showCheckoutSheet.collectAsState()
    val showBarcodeSheet by posViewModel.showBarcodeSheet.collectAsState()
    val showInvoiceModal by posViewModel.showInvoiceModal.collectAsState()
    val lastCompletedSale by posViewModel.lastCompletedSale.collectAsState()
    val selectedCustomer by posViewModel.selectedCustomer.collectAsState()
    val discount by posViewModel.discount.collectAsState()
    val paymentMethod by posViewModel.paymentMethod.collectAsState()

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

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Customer Header Indicator Card
            Surface(
                color = PrimaryBlueLight,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            tint = PrimaryBlue,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (selectedCustomer != null) "Customer: ${selectedCustomer!!.name}" else "Walk-in Customer",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryBlueDark
                        )
                    }
                    if (selectedCustomer?.gstin?.isNotBlank() == true) {
                        Surface(
                            color = PrimaryBlue,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "GST",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }

            // Header Search & Barcode
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { posViewModel.setSearchQuery(it) },
                    placeholder = { Text("Search products or SKU...", color = TextLight) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryBlue) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { posViewModel.setSearchQuery("") }) {
                                Icon(Icons.Default.Close, contentDescription = "Clear", tint = TextMuted)
                            }
                        }
                    },
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextDark,
                        unfocusedTextColor = TextDark,
                        focusedBorderColor = PrimaryBlue,
                        unfocusedBorderColor = BorderSubtle
                    ),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.width(8.dp))

                IconButton(
                    onClick = {
                        com.example.possystem.MainActivity.startBarcodeScan { barcode ->
                            posViewModel.onBarcodeScanned(barcode)
                        }
                    },
                    modifier = Modifier
                        .size(52.dp)
                        .background(PrimaryBlue, RoundedCornerShape(12.dp))
                ) {
                    Icon(
                        Icons.Default.QrCodeScanner,
                        contentDescription = "Barcode Scanner",
                        tint = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Category Chips Row
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(categories) { cat ->
                    val isSel = selectedCategory == cat
                    FilterChip(
                        selected = isSel,
                        onClick = { posViewModel.setSelectedCategory(cat) },
                        label = {
                            Text(
                                text = cat,
                                fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryBlue,
                            selectedLabelColor = Color.White,
                            containerColor = Color.White,
                            labelColor = TextMuted
                        ),
                        shape = RoundedCornerShape(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Product Grid
            if (filteredProducts.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.SearchOff,
                            contentDescription = null,
                            tint = TextLight,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = "No matching products found", color = TextMuted, fontSize = 14.sp)
                    }
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredProducts) { product ->
                        ProductCard(
                            product = product,
                            onAddToCart = { posViewModel.addToCart(product) }
                        )
                    }
                }
            }
        }

        // Floating Cart Summary Bar
        val cartItemsCount = remember(cart) { cart.sumOf { it.quantity } }
        val cartSubtotal = remember(cart) { cart.sumOf { it.totalPrice } }
        val cartFinalTotal = remember(cartSubtotal, discount) { (cartSubtotal - discount).coerceAtLeast(0.0) }
        
        if (cartItemsCount > 0) {
            FloatingCartBar(
                itemCount = cartItemsCount,
                finalTotal = cartFinalTotal,
                onCheckoutClick = { posViewModel.setShowCheckoutSheet(true) },
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            )
        }
    }

    // Bottom Sheets & Dialogs
    if (showCheckoutSheet) {
        CheckoutBottomSheet(
            cartItems = cart,
            subtotal = posViewModel.subtotal,
            discount = discount,
            finalTotal = posViewModel.finalTotal,
            selectedCustomer = selectedCustomer,
            customers = customers,
            paymentMethod = paymentMethod,
            onQuantityChange = { id, q -> posViewModel.updateCartQuantity(id, q) },
            onRemoveItem = { id -> posViewModel.removeFromCart(id) },
            onDiscountChange = { d -> posViewModel.setDiscount(d) },
            onCustomerSelect = { c -> posViewModel.selectCustomer(c) },
            onPaymentMethodSelect = { m -> posViewModel.setPaymentMethod(m) },
            onProcessCheckout = { posViewModel.processCheckout() },
            onDismiss = { posViewModel.setShowCheckoutSheet(false) }
        )
    }

    if (showBarcodeSheet) {
        BarcodeBottomSheet(
            products = products,
            onScanProduct = { prod -> posViewModel.addToCart(prod) },
            onDismiss = { posViewModel.setShowBarcodeSheet(false) }
        )
    }

    if (showInvoiceModal && lastCompletedSale != null) {
        InvoiceDialog(
            sale = lastCompletedSale!!,
            onDismiss = { posViewModel.setShowInvoiceModal(false) }
        )
    }
}

@Composable
fun ProductCard(
    product: Product,
    onAddToCart: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = SecondaryTealLight,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = product.category ?: "General",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = SecondaryTeal,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                Text(
                    text = "Stock: ${product.stockLevel}",
                    fontSize = 11.sp,
                    color = if (product.stockLevel <= 5) StatusError else StatusSuccess,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = product.name,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = TextDark,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            if (!product.sku.isNullOrBlank()) {
                Text(
                    text = "SKU: ${product.sku}",
                    fontSize = 11.sp,
                    color = TextLight
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "₹${String.format("%.2f", product.price)}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                    color = PrimaryBlue
                )

                IconButton(
                    onClick = onAddToCart,
                    modifier = Modifier
                        .size(36.dp)
                        .background(PrimaryBlue, RoundedCornerShape(10.dp))
                ) {
                    Icon(
                        Icons.Default.Add,
                        contentDescription = "Add to Cart",
                        tint = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun FloatingCartBar(
    itemCount: Int,
    finalTotal: Double,
    onCheckoutClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = PrimaryBlue),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "$itemCount item(s) selected",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 12.sp
                )
                Text(
                    text = "₹${String.format("%.2f", finalTotal)}",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black
                )
            }

            Button(
                onClick = onCheckoutClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = PrimaryBlue
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("CHECKOUT", fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(6.dp))
                Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
            }
        }
    }
}

