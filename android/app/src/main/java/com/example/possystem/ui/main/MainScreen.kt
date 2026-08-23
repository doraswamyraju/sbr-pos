package com.example.possystem.ui.main

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.possystem.ui.components.BottomNavBar
import com.example.possystem.ui.components.NavTab
import com.example.possystem.ui.components.CustomerSelectionDialog
import com.example.possystem.ui.components.QuantityInputDialog
import com.example.possystem.data.model.Customer
import com.example.possystem.data.model.Product
import com.example.possystem.ui.screens.*
import com.example.possystem.ui.viewmodel.*
import com.example.possystem.MainActivity

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
                        if (tab == NavTab.SALES) {
                            currentTab = tab
                            if (selectedCustomer != null) {
                                triggerScanner()
                            } else {
                                showCustomerSelect = true
                            }
                        } else {
                            currentTab = tab
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
                    NavTab.LEADS -> LeadsScreen(leadsViewModel = leadsViewModel, customersViewModel = customersViewModel)
                    NavTab.SALES -> PosScreen(posViewModel = posViewModel)
                    NavTab.CUSTOMERS -> CustomersScreen(customersViewModel = customersViewModel)
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
                    triggerScanner()
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
                    triggerScanner()
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
                    currentTab = NavTab.SALES
                    triggerScanner()
                },
                onDismiss = {
                    showQuantityInput = false
                    scannedProductPending = null
                }
            )
        }
    }
}
