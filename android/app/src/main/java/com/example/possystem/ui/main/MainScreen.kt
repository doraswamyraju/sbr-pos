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

    val currentUser by authViewModel.currentUser.collectAsState()
    var currentTab by remember { mutableStateOf(NavTab.POS) }
    val cart by posViewModel.cart.collectAsState()

    if (currentUser == null) {
        LoginScreen(authViewModel = authViewModel)
    } else {
        Scaffold(
            bottomBar = {
                BottomNavBar(
                    currentTab = currentTab,
                    onTabSelected = { tab ->
                        if (tab == NavTab.SCANNER) {
                            MainActivity.startBarcodeScan { barcode ->
                                posViewModel.onBarcodeScanned(barcode)
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
                    NavTab.POS -> PosScreen(posViewModel = posViewModel)
                    NavTab.INVENTORY -> InventoryScreen(inventoryViewModel = inventoryViewModel)
                    NavTab.LEADS -> LeadsScreen(leadsViewModel = leadsViewModel, customersViewModel = customersViewModel)
                    NavTab.PROJECTS -> ProjectsScreen(projectsViewModel = projectsViewModel)
                    NavTab.MORE -> MoreScreen(
                        customersViewModel = customersViewModel,
                        purchasesViewModel = purchasesViewModel,
                        reportsViewModel = reportsViewModel,
                        usersSettingsViewModel = usersSettingsViewModel,
                        authViewModel = authViewModel
                    )
                }
            }
        }
    }
}
