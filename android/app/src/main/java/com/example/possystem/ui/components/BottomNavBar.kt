package com.example.possystem.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector

enum class NavTab(
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    POS("POS", Icons.Filled.ShoppingCart, Icons.Outlined.ShoppingCart),
    INVENTORY("Inventory", Icons.Filled.Inventory, Icons.Outlined.Inventory2),
    SCANNER("Scanner", Icons.Filled.QrCodeScanner, Icons.Outlined.QrCodeScanner),
    LEADS("Leads", Icons.Filled.FilterList, Icons.Outlined.FilterList),
    PROJECTS("Projects", Icons.Filled.Assignment, Icons.Outlined.Assignment),
    MORE("More", Icons.Filled.Grid3x3, Icons.Outlined.Grid3x3)
}

@Composable
fun BottomNavBar(
    currentTab: NavTab,
    onTabSelected: (NavTab) -> Unit,
    cartItemCount: Int = 0
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.0.toDp()
    ) {
        NavTab.values().forEach { tab ->
            val isSelected = tab == currentTab
            NavigationBarItem(
                selected = isSelected,
                onClick = { onTabSelected(tab) },
                icon = {
                    if (tab == NavTab.POS && cartItemCount > 0) {
                        BadgedBox(
                            badge = { Badge { Text(cartItemCount.toString()) } }
                        ) {
                            Icon(
                                imageVector = if (isSelected) tab.selectedIcon else tab.unselectedIcon,
                                contentDescription = tab.title
                            )
                        }
                    } else {
                        Icon(
                            imageVector = if (isSelected) tab.selectedIcon else tab.unselectedIcon,
                            contentDescription = tab.title
                        )
                    }
                },
                label = { Text(tab.title) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    }
}
private fun Double.toDp() = androidx.compose.ui.unit.Dp(this.toFloat())
