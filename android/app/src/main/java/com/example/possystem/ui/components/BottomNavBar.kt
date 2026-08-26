package com.example.possystem.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.possystem.theme.PrimaryBlue

enum class NavTab(
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    DASHBOARD("Dashboard", Icons.Filled.Speed, Icons.Outlined.Speed),
    SALES("Sales", Icons.Filled.PointOfSale, Icons.Outlined.PointOfSale),
    SCANNER("Scanner", Icons.Filled.QrCodeScanner, Icons.Outlined.QrCodeScanner),
    PURCHASES("Purchases", Icons.Filled.ShoppingBag, Icons.Outlined.ShoppingBag),
    MORE("More", Icons.Filled.MoreHoriz, Icons.Outlined.MoreHoriz)
}

@Composable
fun BottomNavBar(
    currentTab: NavTab,
    onTabSelected: (NavTab) -> Unit,
    cartItemCount: Int = 0
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(16.dp, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)),
        color = Color.White,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .height(68.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavTab.values().forEach { tab ->
                val isSelected = tab == currentTab

                if (tab == NavTab.SCANNER) {
                    // Central Elevated Floating Scanner Action Button
                    Box(
                        modifier = Modifier
                            .offset(y = (-14).dp)
                            .size(56.dp)
                            .shadow(6.dp, CircleShape)
                            .background(if (isSelected) PrimaryBlue else Color(0xFF1E40AF), CircleShape)
                            .clip(CircleShape)
                            .clickable { onTabSelected(tab) },
                        contentAlignment = Alignment.Center
                    ) {
                        if (cartItemCount > 0) {
                            Surface(
                                color = Color(0xFFDC2626),
                                contentColor = Color.White,
                                shape = CircleShape,
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(4.dp)
                                    .size(18.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = cartItemCount.toString(),
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = "Scanner",
                            tint = Color.White,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                } else {
                    // Standard Navigation Tabs
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onTabSelected(tab) }
                            .padding(vertical = 8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(contentAlignment = Alignment.TopEnd) {
                            Icon(
                                imageVector = if (isSelected) tab.selectedIcon else tab.unselectedIcon,
                                contentDescription = tab.title,
                                tint = if (isSelected) PrimaryBlue else Color.Gray,
                                modifier = Modifier.size(24.dp)
                            )
                            if (tab == NavTab.SALES && cartItemCount > 0) {
                                Surface(
                                    color = Color(0xFFDC2626),
                                    contentColor = Color.White,
                                    shape = CircleShape,
                                    modifier = Modifier
                                        .offset(x = 6.dp, y = (-4).dp)
                                        .size(14.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = cartItemCount.toString(),
                                            fontSize = 7.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = tab.title,
                            color = if (isSelected) PrimaryBlue else Color.Gray,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}
