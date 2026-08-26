package com.example.possystem.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.res.painterResource
import com.example.possystem.R
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.possystem.data.model.Customer
import com.example.possystem.data.model.Product
import com.example.possystem.ui.components.CheckoutBottomSheet
import com.example.possystem.ui.components.InvoiceDialog
import com.example.possystem.ui.components.AddCustomerBottomSheet
import com.example.possystem.ui.viewmodel.PosViewModel
import com.example.possystem.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PosScreen(
    posViewModel: PosViewModel
) {
    val products by posViewModel.products.collectAsState()
    val customers by posViewModel.customers.collectAsState()
    val cart by posViewModel.cart.collectAsState()
    val showCheckoutSheet by posViewModel.showCheckoutSheet.collectAsState()
    val showInvoiceModal by posViewModel.showInvoiceModal.collectAsState()
    val lastCompletedSale by posViewModel.lastCompletedSale.collectAsState()
    val selectedCustomer by posViewModel.selectedCustomer.collectAsState()
    val discount by posViewModel.discount.collectAsState()
    val paymentMethod by posViewModel.paymentMethod.collectAsState()

    var customerSearchQuery by remember { mutableStateOf("") }
    var showAddCustomerSheet by remember { mutableStateOf(false) }
    var productOverlayOpen by remember { mutableStateOf(false) }
    var productSearchQuery by remember { mutableStateOf("") }
    var overlayTab by remember { mutableStateOf("search") } // "search" | "scan"

    val filteredCustomers = remember(customers, customerSearchQuery) {
        if (customerSearchQuery.isBlank()) emptyList()
        else customers.filter { c ->
            c.name.contains(customerSearchQuery, ignoreCase = true) ||
            (c.phone?.contains(customerSearchQuery) == true)
        }
    }

    val filteredProducts = remember(products, productSearchQuery) {
        if (productSearchQuery.isBlank()) products
        else products.filter { p ->
            p.name.contains(productSearchQuery, ignoreCase = true) ||
            (p.sku?.contains(productSearchQuery, ignoreCase = true) == true)
        }
    }

    val itemsCount = remember(cart) { cart.sumOf { it.quantity } }
    val payableDisplay = posViewModel.finalTotal

    val textFieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = TextDark,
        unfocusedTextColor = TextDark,
        focusedBorderColor = PrimaryBlue,
        unfocusedBorderColor = BorderSubtle,
        cursorColor = PrimaryBlue,
        focusedLabelColor = PrimaryBlue,
        unfocusedLabelColor = Color.Gray
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF3F4F6))
    ) {
        // Logo Header Bar (Matches Web Mobile View)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color.White,
            shadowElevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Image(
                    painter = painterResource(id = R.drawable.logo),
                    contentDescription = "Logo",
                    modifier = Modifier.size(36.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Sri Balaji Renewables",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = TextDark
                    )
                    Text(
                        text = "POS",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = PrimaryBlue
                    )
                }
                Column(
                    horizontalAlignment = Alignment.End,
                    modifier = Modifier.padding(end = 8.dp)
                ) {
                    Text("Admin User", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = TextDark)
                    Text("admin", fontSize = 10.sp, color = TextMuted)
                }
                Surface(
                    color = PrimaryBlue,
                    shape = CircleShape,
                    modifier = Modifier.size(32.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text("A", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    Icons.Default.ExitToApp,
                    contentDescription = "Logout",
                    tint = Color.Gray,
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .padding(bottom = 80.dp), // Spacing for bottom complete bar
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // STEP 1: Select Customer
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Step 1: Select Customer",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = TextDark
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = customerSearchQuery,
                                onValueChange = { customerSearchQuery = it },
                                placeholder = { Text("Search customer by name or phone...", color = TextLight, fontSize = 13.sp) },
                                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryBlue) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                singleLine = true,
                                colors = textFieldColors
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            IconButton(
                                onClick = { showAddCustomerSheet = true },
                                modifier = Modifier
                                    .size(52.dp)
                                    .background(PrimaryBlue, RoundedCornerShape(10.dp))
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Add Customer", tint = Color.White)
                            }
                        }

                        // Customer Search Dropdown Results
                        if (filteredCustomers.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, BorderSubtle, RoundedCornerShape(8.dp))
                                    .background(Color.White)
                            ) {
                                filteredCustomers.forEach { customer ->
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                posViewModel.selectCustomer(customer)
                                                customerSearchQuery = ""
                                            }
                                            .padding(12.dp)
                                    ) {
                                        Text(customer.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextDark)
                                        if (!customer.phone.isNullOrBlank()) {
                                            Text(customer.phone, fontSize = 12.sp, color = TextMuted)
                                        }
                                    }
                                }
                            }
                        }

                        // Selected Customer Card
                        Spacer(modifier = Modifier.height(12.dp))
                        if (selectedCustomer != null) {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                border = BorderStroke(1.dp, PrimaryBlue.copy(alpha = 0.5f)),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0F7FF))
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryBlue)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(selectedCustomer!!.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextDark)
                                        if (!selectedCustomer!!.phone.isNullOrBlank()) {
                                            Text(selectedCustomer!!.phone!!, fontSize = 12.sp, color = TextMuted)
                                        }
                                        if (selectedCustomer!!.isGstRegistered == 1 && !selectedCustomer!!.gstin.isNullOrBlank()) {
                                            Text("GST: ${selectedCustomer!!.gstin!!}", fontSize = 11.sp, color = SecondaryTeal, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    IconButton(onClick = { posViewModel.selectCustomer(null) }) {
                                        Icon(Icons.Default.Close, contentDescription = "Clear", tint = Color.Gray)
                                    }
                                }
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(BorderStroke(1.dp, BorderSubtle), RoundedCornerShape(8.dp))
                                    .background(Color(0xFFF9FAFB))
                                    .padding(16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Select a customer to begin the sale.", color = TextMuted, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }

            // STEP 2: Add Products
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Step 2: Add Products",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = TextDark
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Action Buttons: Search Product & Scan Barcode
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Button(
                                onClick = { 
                                    overlayTab = "search"
                                    productOverlayOpen = true 
                                },
                                enabled = selectedCustomer != null,
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f).height(46.dp)
                            ) {
                                Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Search Product", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }

                            OutlinedButton(
                                onClick = {
                                    com.example.possystem.MainActivity.startBarcodeScan { barcode ->
                                        posViewModel.onBarcodeScanned(barcode)
                                    }
                                },
                                enabled = selectedCustomer != null,
                                shape = RoundedCornerShape(10.dp),
                                border = BorderStroke(1.5.dp, if (selectedCustomer != null) PrimaryBlue else Color.LightGray),
                                modifier = Modifier.weight(1f).height(46.dp)
                            ) {
                                Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = if (selectedCustomer != null) PrimaryBlue else Color.Gray, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Scan Barcode", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = if (selectedCustomer != null) PrimaryBlue else Color.Gray)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Cart items list
                        if (cart.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(100.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No products added yet", color = TextLight, fontSize = 13.sp)
                            }
                        } else {
                            cart.forEach { item ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 6.dp)
                                        .background(Color(0xFFF9FAFB), RoundedCornerShape(8.dp))
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(item.product.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextDark, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                        Text("₹${String.format("%.2f", item.unitPrice)} each", fontSize = 12.sp, color = TextMuted)
                                    }
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        // Quantity adjusts
                                        IconButton(
                                            onClick = { posViewModel.updateCartQuantity(item.product.id, item.quantity - 1) },
                                            modifier = Modifier.size(28.dp).background(Color(0xFFE5E7EB), RoundedCornerShape(6.dp))
                                        ) {
                                            Text("-", fontWeight = FontWeight.Bold, color = TextDark)
                                        }
                                        Text(item.quantity.toString(), fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextDark)
                                        IconButton(
                                            onClick = { posViewModel.updateCartQuantity(item.product.id, item.quantity + 1) },
                                            modifier = Modifier.size(28.dp).background(Color(0xFFE5E7EB), RoundedCornerShape(6.dp))
                                        ) {
                                            Text("+", fontWeight = FontWeight.Bold, color = TextDark)
                                        }
                                        Spacer(modifier = Modifier.width(4.dp))
                                        IconButton(
                                            onClick = { posViewModel.removeFromCart(item.product.id) },
                                            modifier = Modifier.size(28.dp)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = StatusError, modifier = Modifier.size(20.dp))
                                        }
                                    }
                                }
                            }
                        }

                        // Flat Discount
                        Spacer(modifier = Modifier.height(14.dp))
                        Divider(color = BorderSubtle)
                        Spacer(modifier = Modifier.height(10.dp))
                        
                        OutlinedTextField(
                            value = if (discount == 0.0) "" else discount.toString(),
                            onValueChange = { 
                                val parsed = it.toDoubleOrNull() ?: 0.0
                                posViewModel.setDiscount(parsed)
                            },
                            label = { Text("Discount (Flat ₹)", fontSize = 12.sp) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = textFieldColors
                        )

                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Payable", fontWeight = FontWeight.Bold, color = TextDark, fontSize = 15.sp)
                            Text("₹${String.format("%.2f", payableDisplay)}", fontWeight = FontWeight.Black, color = PrimaryBlue, fontSize = 16.sp)
                        }
                    }
                }
            }
        }

        // Fixed Bottom Bar
        if (selectedCustomer != null) {
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth(),
                color = Color.White,
                tonalElevation = 8.dp,
                shadowElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier
                        .padding(12.dp)
                        .fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Surface(
                            color = PrimaryBlueLight,
                            shape = RoundedCornerShape(100.dp),
                            modifier = Modifier.size(44.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = PrimaryBlue)
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Items Summary", fontSize = 10.sp, color = TextMuted)
                            Text("$itemsCount items • ₹${String.format("%.2f", payableDisplay)}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextDark)
                        }
                    }
                    Button(
                        onClick = { posViewModel.setShowCheckoutSheet(true) },
                        enabled = cart.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.height(44.dp)
                    ) {
                        Text("Complete Sale", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Add New Customer Bottom Sheet
    if (showAddCustomerSheet) {
        AddCustomerBottomSheet(
            onSave = { n, p, e, a, g, gstin ->
                posViewModel.selectCustomer(
                    Customer(
                        id = "CUST-${System.currentTimeMillis() % 10000}",
                        name = n,
                        phone = p,
                        email = e,
                        address = a,
                        isGstRegistered = g,
                        gstin = gstin
                    )
                )
                showAddCustomerSheet = false
            },
            onDismiss = { showAddCustomerSheet = false }
        )
    }

    // Full Screen Product Overlay Dialog (Step-by-Step match)
    if (productOverlayOpen) {
        Dialog(onDismissRequest = { productOverlayOpen = false }) {
            Surface(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(vertical = 24.dp),
                shape = RoundedCornerShape(16.dp),
                color = Color.White
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(
                                selected = overlayTab == "search",
                                onClick = { overlayTab = "search" },
                                label = { Text("Search Products", fontWeight = FontWeight.Bold) },
                                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(16.dp)) }
                            )
                            FilterChip(
                                selected = overlayTab == "scan",
                                onClick = { overlayTab = "scan" },
                                label = { Text("Scan Barcode", fontWeight = FontWeight.Bold) },
                                leadingIcon = { Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(16.dp)) }
                            )
                        }
                        IconButton(onClick = { productOverlayOpen = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))

                    if (overlayTab == "search") {
                        OutlinedTextField(
                            value = productSearchQuery,
                            onValueChange = { productSearchQuery = it },
                            placeholder = { Text("Search by product name or SKU...", color = TextLight, fontSize = 13.sp) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryBlue) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = textFieldColors,
                            shape = RoundedCornerShape(10.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        LazyColumn(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(filteredProducts) { product ->
                                val cartItem = cart.find { it.product.id == product.id }
                                val quantityInCart = cartItem?.quantity ?: 0

                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF9FAFB))
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(product.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextDark, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                            Text("₹${String.format("%.2f", product.price)} • Stock: ${product.stockLevel}", fontSize = 12.sp, color = TextMuted)
                                        }
                                        
                                        if (quantityInCart == 0) {
                                            Button(
                                                onClick = { 
                                                    posViewModel.addToCart(product, 1)
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                                                shape = RoundedCornerShape(8.dp),
                                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                                            ) {
                                                Text("Add", fontWeight = FontWeight.Bold)
                                            }
                                        } else {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                                modifier = Modifier
                                                    .background(Color(0xFFEFF6FF), RoundedCornerShape(8.dp))
                                                    .border(1.dp, PrimaryBlue.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                                            ) {
                                                IconButton(
                                                    onClick = { posViewModel.updateCartQuantity(product.id, quantityInCart - 1) },
                                                    modifier = Modifier.size(32.dp)
                                                ) {
                                                    Text("-", fontWeight = FontWeight.Bold, color = PrimaryBlue, fontSize = 18.sp)
                                                }
                                                Text(
                                                    text = "$quantityInCart",
                                                    fontWeight = FontWeight.Bold,
                                                    color = PrimaryBlue,
                                                    fontSize = 14.sp,
                                                    modifier = Modifier.padding(horizontal = 6.dp)
                                                )
                                                IconButton(
                                                    onClick = { posViewModel.updateCartQuantity(product.id, quantityInCart + 1) },
                                                    modifier = Modifier.size(32.dp)
                                                ) {
                                                    Text("+", fontWeight = FontWeight.Bold, color = PrimaryBlue, fontSize = 18.sp)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // Scan Tab
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                Icons.Default.QrCodeScanner,
                                contentDescription = null,
                                tint = PrimaryBlue,
                                modifier = Modifier.size(64.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "Scan Product Barcode",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = TextDark
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Tap below to open camera scanner.",
                                fontSize = 13.sp,
                                color = TextMuted,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(24.dp))
                            Button(
                                onClick = {
                                    com.example.possystem.MainActivity.startBarcodeScan { barcode ->
                                        posViewModel.onBarcodeScanned(barcode)
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth(0.8f)
                                    .height(48.dp)
                            ) {
                                Icon(Icons.Default.QrCodeScanner, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Open Camera Scanner", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { productOverlayOpen = false },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)
                    ) {
                        Text("Continue to Cart")
                    }
                }
            }
        }
    }

    // Checkout Bottom Sheet
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

    // Success Invoice Modal
    if (showInvoiceModal && lastCompletedSale != null) {
        InvoiceDialog(
            sale = lastCompletedSale!!,
            onDismiss = { posViewModel.setShowInvoiceModal(false) }
        )
    }
    }
}
