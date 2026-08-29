package com.sbr.pos.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
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
import com.sbr.pos.ui.viewmodel.*

enum class MoreSubScreen {
    GRID, LEADS, CUSTOMERS, PURCHASES, REPORTS, SETTINGS, PROJECTS, SALES, SUPPLIERS
}

@Composable
fun MoreScreen(
    customersViewModel: CustomersViewModel,
    purchasesViewModel: PurchasesViewModel,
    reportsViewModel: ReportsViewModel,
    usersSettingsViewModel: UsersSettingsViewModel,
    leadsViewModel: LeadsViewModel? = null,
    projectsViewModel: ProjectsViewModel? = null,
    suppliersViewModel: SuppliersViewModel? = null,
    authViewModel: AuthViewModel
) {
    var subScreen by remember { mutableStateOf(MoreSubScreen.GRID) }
    var showLogoutConfirm by remember { mutableStateOf(false) }
    val currentUser by authViewModel.currentUser.collectAsState()

    if (showLogoutConfirm) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirm = false },
            title = { Text("Confirm Logout", fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to log out of SBR POS?") },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutConfirm = false
                        authViewModel.logout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                ) {
                    Text("Logout", color = Color.White)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showLogoutConfirm = false }) {
                    Text("Cancel")
                }
            }
        )
    }

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
                        MoreSubScreen.SUPPLIERS -> "Suppliers Directory"
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
                    MoreSubScreen.SUPPLIERS -> {
                        if (suppliersViewModel != null) {
                            SuppliersScreen(suppliersViewModel = suppliersViewModel)
                        }
                    }
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
            // Logged-in User Profile Header Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFF2563EB),
                            modifier = Modifier.size(46.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = (currentUser?.displayName?.take(1) ?: "U").uppercase(),
                                    color = Color.White,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Text(
                                text = currentUser?.displayName ?: "User",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = Color(0xFF0F172A)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = if (currentUser?.isAdmin == true) Color(0xFFDBEAFE) else Color(0xFFDCFCE7)
                            ) {
                                Text(
                                    text = (currentUser?.role ?: "User").replaceFirstChar { it.uppercase() },
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (currentUser?.isAdmin == true) Color(0xFF1D4ED8) else Color(0xFF15803D),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    // Direct Logout Action Button
                    FilledTonalButton(
                        onClick = { showLogoutConfirm = true },
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = Color(0xFFFEE2E2),
                            contentColor = Color(0xFFDC2626)
                        ),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Logout,
                            contentDescription = "Logout",
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = "Logout", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Modules & Management",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )

            Spacer(modifier = Modifier.height(10.dp))

            val allMenuItems = mutableListOf(
                MoreMenuItem("Sales History", "View past invoices & share", Icons.Default.ReceiptLong, Color(0xFF3B82F6), MoreSubScreen.SALES),
                MoreMenuItem("Purchases Orders", "Supplier restock & PO logs", Icons.Default.ShoppingBag, Color(0xFF10B981), MoreSubScreen.PURCHASES),
                MoreMenuItem("Customers Directory", "Manage customer profiles & debts", Icons.Default.People, Color(0xFF8B5CF6), MoreSubScreen.CUSTOMERS),
                MoreMenuItem("Suppliers List", "Manage vendor & factory details", Icons.Default.LocalShipping, Color(0xFF10B981), MoreSubScreen.SUPPLIERS),
                MoreMenuItem("Leads & Prospects", "Track sales leads & pipeline", Icons.Default.FilterList, Color(0xFFEC4899), MoreSubScreen.LEADS),
                MoreMenuItem("Projects & Sites", "Manage worksites & tasks", Icons.Default.Assignment, Color(0xFF06B6D4), MoreSubScreen.PROJECTS)
            )

            // Only show Reports and Settings if user is Admin
            if (currentUser?.isAdmin == true) {
                allMenuItems.add(MoreMenuItem("Reports & Charts", "Financial revenue & analytics", Icons.Default.BarChart, Color(0xFFF59E0B), MoreSubScreen.REPORTS))
                allMenuItems.add(MoreMenuItem("Settings & Users", "API setup & user roles", Icons.Default.Settings, Color(0xFF6B7280), MoreSubScreen.SETTINGS))
            }

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(allMenuItems) { item ->
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

