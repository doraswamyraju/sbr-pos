package com.example.possystem.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import com.example.possystem.ui.viewmodel.*

enum class MoreSubScreen {
    GRID, LEADS, CUSTOMERS, PURCHASES, REPORTS, SETTINGS, PROJECTS, SALES
}

@Composable
fun MoreScreen(
    customersViewModel: CustomersViewModel,
    purchasesViewModel: PurchasesViewModel,
    reportsViewModel: ReportsViewModel,
    usersSettingsViewModel: UsersSettingsViewModel,
    leadsViewModel: LeadsViewModel? = null,
    projectsViewModel: ProjectsViewModel? = null,
    authViewModel: AuthViewModel
) {
    var subScreen by remember { mutableStateOf(MoreSubScreen.GRID) }

    if (subScreen != MoreSubScreen.GRID) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { subScreen = MoreSubScreen.GRID }) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back to More")
                }
                Text(
                    text = when (subScreen) {
                        MoreSubScreen.LEADS -> "Leads & Prospects"
                        MoreSubScreen.CUSTOMERS -> "Customers Directory"
                        MoreSubScreen.PURCHASES -> "Purchases & Restock"
                        MoreSubScreen.REPORTS -> "Reports & Analytics"
                        MoreSubScreen.SETTINGS -> "Settings & Users"
                        MoreSubScreen.PROJECTS -> "Projects & Worksites"
                        MoreSubScreen.SALES -> "Sales & Invoices"
                        else -> ""
                    },
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            }

            Box(modifier = Modifier.weight(1f)) {
                when (subScreen) {
                    MoreSubScreen.LEADS -> {
                        if (leadsViewModel != null) {
                            LeadsScreen(leadsViewModel = leadsViewModel, customersViewModel = customersViewModel)
                        }
                    }
                    MoreSubScreen.CUSTOMERS -> CustomersScreen(customersViewModel = customersViewModel)
                    MoreSubScreen.PURCHASES -> PurchasesScreen(purchasesViewModel = purchasesViewModel)
                    MoreSubScreen.REPORTS -> ReportsScreen(reportsViewModel = reportsViewModel)
                    MoreSubScreen.SETTINGS -> UsersSettingsScreen(usersSettingsViewModel = usersSettingsViewModel, authViewModel = authViewModel)
                    MoreSubScreen.PROJECTS -> {
                        if (projectsViewModel != null) {
                            ProjectsScreen(projectsViewModel = projectsViewModel)
                        }
                    }
                    MoreSubScreen.SALES -> SalesHistoryScreen(reportsViewModel = reportsViewModel)
                    else -> {}
                }
            }
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Text(
                text = "More Modules & Tools",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = "Select a module to view records & manage setup",
                fontSize = 12.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(16.dp))

            val menuItems = listOf(
                MoreMenuItem("Sales History", "View past invoices & share", Icons.Default.ReceiptLong, Color(0xFF3B82F6), MoreSubScreen.SALES),
                MoreMenuItem("Purchases Orders", "Supplier restock & PO logs", Icons.Default.ShoppingBag, Color(0xFF10B981), MoreSubScreen.PURCHASES),
                MoreMenuItem("Leads & Prospects", "Track sales leads & pipeline", Icons.Default.FilterList, Color(0xFFEC4899), MoreSubScreen.LEADS),
                MoreMenuItem("Customers Directory", "Manage customer profiles & debts", Icons.Default.People, Color(0xFF8B5CF6), MoreSubScreen.CUSTOMERS),
                MoreMenuItem("Projects & Sites", "Manage worksites & tasks", Icons.Default.Assignment, Color(0xFF06B6D4), MoreSubScreen.PROJECTS),
                MoreMenuItem("Reports & Charts", "Financial revenue & analytics", Icons.Default.BarChart, Color(0xFFF59E0B), MoreSubScreen.REPORTS),
                MoreMenuItem("Settings & Users", "API setup & user roles", Icons.Default.Settings, Color(0xFF6B7280), MoreSubScreen.SETTINGS)
            )

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(menuItems) { item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { subScreen = item.targetScreen },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.Start
                        ) {
                            Surface(
                                color = item.color.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.size(44.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(imageVector = item.icon, contentDescription = null, tint = item.color)
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(text = item.title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text(text = item.subtitle, fontSize = 11.sp, color = Color.Gray, maxLines = 2)
                        }
                    }
                }
            }
        }
    }
}

data class MoreMenuItem(
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val color: Color,
    val targetScreen: MoreSubScreen
)

