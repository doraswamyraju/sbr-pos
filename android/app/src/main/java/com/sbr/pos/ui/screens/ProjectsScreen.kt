package com.sbr.pos.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sbr.pos.data.model.Project
import com.sbr.pos.data.model.Task
import com.sbr.pos.theme.*
import com.sbr.pos.ui.components.AddTaskBottomSheet
import com.sbr.pos.ui.viewmodel.ProjectsViewModel

@Composable
fun ProjectsScreen(
    projectsViewModel: ProjectsViewModel
) {
    val projects by projectsViewModel.projects.collectAsState()
    val selectedProject by projectsViewModel.selectedProject.collectAsState()
    val showAddTaskSheet by projectsViewModel.showAddTaskSheet.collectAsState()
    val showAddProjectSheet by projectsViewModel.showAddProjectSheet.collectAsState()

    LaunchedEffect(projects) {
        if (selectedProject == null && projects.isNotEmpty()) {
            projectsViewModel.selectProject(projects.first())
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    if (selectedProject != null) {
                        projectsViewModel.setShowAddTaskSheet(true)
                    } else {
                        projectsViewModel.setShowAddProjectSheet(true)
                    }
                },
                containerColor = PrimaryBlue,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Task")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Project Selector Header
            Text(
                text = "Projects & Solar Installation Tasks",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = PrimaryBlueDark
            )
            Text(
                text = "Track site progress, sub-tasks, and timelines",
                fontSize = 12.sp,
                color = TextMuted
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Project Cards List
            if (projects.isNotEmpty()) {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(projects) { proj ->
                        val isSelected = selectedProject?.id == proj.id
                        ProjectCardItem(
                            project = proj,
                            isSelected = isSelected,
                            onSelect = { projectsViewModel.selectProject(proj) },
                            onToggleTask = { taskId -> projectsViewModel.toggleTaskStatus(taskId) },
                            onToggleSubtask = { taskId, subtaskId -> projectsViewModel.toggleSubtask(taskId, subtaskId) }
                        )
                    }
                }
            } else {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = "No active projects found.", color = TextMuted)
                }
            }
        }
    }

    if (showAddTaskSheet && selectedProject != null) {
        AddTaskBottomSheet(
            projectName = selectedProject!!.name,
            onSave = { t, d, p, a, dl ->
                projectsViewModel.addTask(t, d, p, a, dl)
            },
            onDismiss = { projectsViewModel.setShowAddTaskSheet(false) }
        )
    }
}

@Composable
fun ProjectCardItem(
    project: Project,
    isSelected: Boolean,
    onSelect: () -> Unit,
    onToggleTask: (String) -> Unit,
    onToggleSubtask: (String, String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onSelect),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) PrimaryBlueLight else Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isSelected) 4.dp else 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = project.name, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextDark)
                    if (!project.clientName.isNullOrBlank()) {
                        Text(text = "Client: ${project.clientName}", fontSize = 12.sp, color = TextMuted)
                    }
                }
                Surface(
                    color = PrimaryBlue,
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text(
                        text = "${project.progress}% Complete",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            LinearProgressIndicator(
                progress = { project.progress / 100f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = PrimaryBlue,
                trackColor = BorderSubtle
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Expandable tasks section
            AnimatedVisibility(visible = isSelected) {
                Column {
                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = BorderSubtle)
                    Text(
                        text = "Task Checklist (${project.tasks.count { it.status == "Completed" }}/${project.tasks.size})",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                        color = TextDark
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    if (project.tasks.isEmpty()) {
                        Text(text = "No tasks added yet. Tap + to add task.", fontSize = 12.sp, color = TextMuted)
                    } else {
                        project.tasks.forEach { task ->
                            TaskItemRow(
                                task = task,
                                onToggleTask = { onToggleTask(task.id) },
                                onToggleSubtask = { stId -> onToggleSubtask(task.id, stId) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TaskItemRow(
    task: Task,
    onToggleTask: () -> Unit,
    onToggleSubtask: (String) -> Unit
) {
    val isDone = task.status == "Completed"
    val priorityColor = when (task.priority) {
        "High" -> StatusError
        "Medium" -> AccentAmber
        else -> StatusSuccess
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = isDone,
                onCheckedChange = { onToggleTask() },
                colors = CheckboxDefaults.colors(checkedColor = PrimaryBlue)
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    fontWeight = FontWeight.Medium,
                    fontSize = 14.sp,
                    color = if (isDone) TextLight else TextDark
                )
                if (!task.assignedTo.isNullOrBlank()) {
                    Text(text = "Assigned to: ${task.assignedTo}", fontSize = 11.sp, color = TextMuted)
                }
            }
            Surface(
                color = priorityColor.copy(alpha = 0.15f),
                shape = RoundedCornerShape(4.dp)
            ) {
                Text(
                    text = task.priority,
                    color = priorityColor,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }

        // Render subtasks if present
        if (task.subtasks.isNotEmpty()) {
            Column(modifier = Modifier.padding(start = 32.dp)) {
                task.subtasks.forEach { st ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(vertical = 2.dp)
                    ) {
                        Checkbox(
                            checked = st.isCompleted,
                            onCheckedChange = { onToggleSubtask(st.id) },
                            modifier = Modifier.size(24.dp),
                            colors = CheckboxDefaults.colors(checkedColor = PrimaryBlue)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = st.title,
                            fontSize = 12.sp,
                            color = if (st.isCompleted) TextLight else TextDark
                        )
                    }
                }
            }
        }
    }
}

