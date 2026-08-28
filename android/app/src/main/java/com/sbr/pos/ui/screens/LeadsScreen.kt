package com.sbr.pos.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sbr.pos.data.model.Lead
import com.sbr.pos.ui.components.AddLeadBottomSheet
import com.sbr.pos.ui.components.ConvertLeadBottomSheet
import com.sbr.pos.ui.viewmodel.CustomersViewModel
import com.sbr.pos.ui.viewmodel.LeadsViewModel

@Composable
fun LeadsScreen(
    leadsViewModel: LeadsViewModel,
    customersViewModel: CustomersViewModel
) {
    val leads by leadsViewModel.leads.collectAsState()
    val selectedStage by leadsViewModel.selectedStage.collectAsState()
    val showAddLeadSheet by leadsViewModel.showAddLeadSheet.collectAsState()
    val editingLead by leadsViewModel.editingLead.collectAsState()
    val showConvertSheet by leadsViewModel.showConvertSheet.collectAsState()
    val leadToConvert by leadsViewModel.leadToConvert.collectAsState()

    val stages = listOf("All", "New", "Contacted", "Qualified", "Proposal", "Won", "Lost")

    val filteredLeads = remember(leads, selectedStage) {
        if (selectedStage == "All") leads else leads.filter { it.status == selectedStage }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { leadsViewModel.openAddLeadSheet() },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Lead", tint = MaterialTheme.colorScheme.onPrimary)
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // CRM Header Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Leads & CRM Pipeline",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Total Active Deals: ${leads.count { it.status != "Won" && it.status != "Lost" }} | Value: ₹${String.format("%.0f", leads.sumOf { it.value })}",
                            fontSize = 12.sp,
                            color = Color.DarkGray
                        )
                    }
                    Icon(Icons.Default.FilterList, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondaryContainer)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Stage Filter Chips
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(stages) { st ->
                    val isSel = selectedStage == st
                    FilterChip(
                        selected = isSel,
                        onClick = { leadsViewModel.setSelectedStage(st) },
                        label = { Text(st) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Leads List
            if (filteredLeads.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = "No leads in this stage.", color = Color.Gray)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(filteredLeads) { lead ->
                        LeadCardItem(
                            lead = lead,
                            onEdit = { leadsViewModel.openAddLeadSheet(lead) },
                            onConvert = { leadsViewModel.openConvertSheet(lead) }
                        )
                    }
                }
            }
        }
    }

    if (showAddLeadSheet) {
        AddLeadBottomSheet(
            editingLead = editingLead,
            onSave = { n, e, p, c, s, v, nt ->
                leadsViewModel.saveLead(n, e, p, c, s, v, nt)
            },
            onDismiss = { leadsViewModel.closeAddLeadSheet() }
        )
    }

    if (showConvertSheet && leadToConvert != null) {
        ConvertLeadBottomSheet(
            lead = leadToConvert!!,
            onConvert = {
                leadsViewModel.convertLeadToCustomer { newCust ->
                    customersViewModel.addCustomer(newCust.name, newCust.phone ?: "", newCust.email ?: "", newCust.address ?: "")
                }
            },
            onDismiss = { leadsViewModel.closeConvertSheet() }
        )
    }
}

@Composable
fun LeadCardItem(
    lead: Lead,
    onEdit: () -> Unit,
    onConvert: () -> Unit
) {
    val stageColor = when (lead.status) {
        "Won" -> Color(0xFF10B981)
        "Lost" -> Color(0xFFEF4444)
        "Proposal" -> Color(0xFF8B5CF6)
        "Qualified" -> Color(0xFF3B82F6)
        else -> Color(0xFFF59E0B)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = lead.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    if (!lead.company.isNullOrBlank()) {
                        Text(text = lead.company, fontSize = 12.sp, color = Color.Gray)
                    }
                }
                Surface(
                    color = stageColor.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text(
                        text = lead.status,
                        color = stageColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Deal Value: ₹${String.format("%.2f", lead.value)}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = lead.phone ?: lead.email ?: "No Contact",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }

            if (!lead.notes.isNullOrBlank()) {
                Text(
                    text = lead.notes,
                    fontSize = 12.sp,
                    color = Color.DarkGray,
                    modifier = Modifier.padding(top = 6.dp)
                )
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit", modifier = Modifier.size(20.dp))
                }
                if (lead.status != "Won") {
                    Spacer(modifier = Modifier.width(6.dp))
                    OutlinedButton(
                        onClick = onConvert,
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Icon(Icons.Default.SwapHoriz, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Convert to Customer", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
