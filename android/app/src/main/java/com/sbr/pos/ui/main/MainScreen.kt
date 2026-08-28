package com.sbr.pos.ui.main

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
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

    if (currentUser == null) {
        LoginScreen(authViewModel = authViewModel)
    } else {
        Scaffold(
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
