package com.sbr.pos.ui.main

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.sbr.pos.ui.components.BottomNavBar
import com.sbr.pos.ui.components.NavTab
import com.sbr.pos.ui.components.CustomerSelectionDialog
import com.sbr.pos.ui.components.QuantityInputDialog
import com.sbr.pos.data.model.Customer
import com.sbr.pos.data.model.Product
import com.sbr.pos.ui.screens.*
import com.sbr.pos.ui.viewmodel.*
import com.sbr.pos.MainActivity

@Composable
fun MainScreen(
    onItemClick: (Any) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val authViewModel: AuthViewModel = viewModel()
    val posViewModel: PosViewModel = viewModel()
    val inventoryViewModel: InventoryViewModel = viewModel()
    val leadsViewModel: LeadsViewModel = viewModel()
    val projectsViewModel: ProjectsViewModel = viewModel()
    val customersViewModel: CustomersViewModel = viewModel()
    val purchasesViewModel: PurchasesViewModel = viewModel()
    val reportsViewModel: ReportsViewModel = viewModel()
    val usersSettingsViewModel: UsersSettingsViewModel = viewModel()
    val suppliersViewModel: SuppliersViewModel = viewModel()

    val currentUser by authViewModel.currentUser.collectAsState()
    var currentTab by remember { mutableStateOf(NavTab.DASHBOARD) }
    val cart by posViewModel.cart.collectAsState()
    val selectedCustomer by posViewModel.selectedCustomer.collectAsState()

    var showCustomerSelect by remember { mutableStateOf(false) }
    var scannedProductPending by remember { mutableStateOf<Product?>(null) }
    var showQuantityInput by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }

    val customers by customersViewModel.customers.collectAsState()
    val products by posViewModel.products.collectAsState()

    val triggerScanner = {
        MainActivity.startBarcodeScan { barcode ->
            val cleanBarcode = barcode.trim()
            val match = products.find { 
                it.sku?.trim()?.equals(cleanBarcode, ignoreCase = true) == true || 
                it.id.trim().equals(cleanBarcode, ignoreCase = true) 
            }
            if (match != null) {
                scannedProductPending = match
                showQuantityInput = true
            }
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Confirm Logout", fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to log out of SBR POS?") },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        authViewModel.logout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) {
                    Text("Logout", color = Color.White)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (currentUser == null) {
        LoginScreen(authViewModel = authViewModel)
    } else {
        Scaffold(
            topBar = {
                Surface(
                    color = Color.White,
                    shadowElevation = 3.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Sri Balaji Renewables",
                            fontWeight = FontWeight.Black,
                            fontSize = 17.sp,
                            color = Color(0xFF1E3A8A)
                        )

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = if (currentUser?.isAdmin == true) Color(0xFFDBEAFE) else Color(0xFFDCFCE7)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = currentUser?.displayName ?: "User",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = if (currentUser?.isAdmin == true) Color(0xFF1D4ED8) else Color(0xFF15803D)
                                    )
                                    Text(
                                        text = " (${(currentUser?.role ?: "User").replaceFirstChar { it.uppercase() }})",
                                        fontWeight = FontWeight.Medium,
                                        fontSize = 11.sp,
                                        color = Color(0xFF475569)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            IconButton(
                                onClick = { showLogoutDialog = true },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Logout,
                                    contentDescription = "Logout",
                                    tint = Color(0xFFEF4444),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            },
            bottomBar = {
                BottomNavBar(
                    currentTab = currentTab,
                    onTabSelected = { tab ->
                        currentTab = tab
                        if (tab == NavTab.SCANNER && selectedCustomer == null) {
                            showCustomerSelect = true
                        }
                    },
                    cartItemCount = cart.sumOf { it.quantity }
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (currentTab) {
                    NavTab.DASHBOARD -> InventoryScreen(inventoryViewModel = inventoryViewModel)
                    NavTab.SALES -> SalesHistoryScreen(reportsViewModel = reportsViewModel)
                    NavTab.SCANNER -> PosScreen(posViewModel = posViewModel)
                    NavTab.PURCHASES -> PurchasesScreen(purchasesViewModel = purchasesViewModel)
                    NavTab.MORE -> MoreScreen(
                        customersViewModel = customersViewModel,
                        purchasesViewModel = purchasesViewModel,
                        reportsViewModel = reportsViewModel,
                        usersSettingsViewModel = usersSettingsViewModel,
                        leadsViewModel = leadsViewModel,
                        projectsViewModel = projectsViewModel,
                        suppliersViewModel = suppliersViewModel,
                        authViewModel = authViewModel
                    )
                }
            }
        }

        if (showCustomerSelect) {
            CustomerSelectionDialog(
                customers = customers,
                onCustomerSelected = { customer ->
                    posViewModel.selectCustomer(customer)
                    showCustomerSelect = false
                },
                onAddNewCustomer = { name, phone, email, address, isGst, gstin ->
                    customersViewModel.addCustomer(name, phone, email, address, isGst, gstin)
                    val newCustomer = Customer(
                        id = "CUST-${System.currentTimeMillis() % 10000}",
                        name = name,
                        phone = phone,
                        email = email,
                        address = address,
                        isGstRegistered = isGst,
                        gstin = gstin
                    )
                    posViewModel.selectCustomer(newCustomer)
                    showCustomerSelect = false
                },
                onDismiss = { showCustomerSelect = false }
            )
        }

        if (showQuantityInput && scannedProductPending != null) {
            QuantityInputDialog(
                productName = scannedProductPending!!.name,
                onConfirm = { quantity ->
                    posViewModel.addToCart(scannedProductPending!!, quantity)
                    showQuantityInput = false
                    scannedProductPending = null
                },
                onDismiss = {
                    showQuantityInput = false
                    scannedProductPending = null
                }
            )
        }
    }
}
