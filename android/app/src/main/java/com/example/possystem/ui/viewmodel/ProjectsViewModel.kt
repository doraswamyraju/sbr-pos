package com.example.possystem.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.possystem.data.api.MockDataProvider
import com.example.possystem.data.api.RetrofitClient
import com.example.possystem.data.model.Project
import com.example.possystem.data.model.Subtask
import com.example.possystem.data.model.Task
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ProjectsViewModel : ViewModel() {

    private val _projects = MutableStateFlow<List<Project>>(emptyList())
    val projects: StateFlow<List<Project>> = _projects.asStateFlow()

    private val _selectedProject = MutableStateFlow<Project?>(null)
    val selectedProject: StateFlow<Project?> = _selectedProject.asStateFlow()

    private val _showAddTaskSheet = MutableStateFlow(false)
    val showAddTaskSheet: StateFlow<Boolean> = _showAddTaskSheet.asStateFlow()

    private val _showAddProjectSheet = MutableStateFlow(false)
    val showAddProjectSheet: StateFlow<Boolean> = _showAddProjectSheet.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadProjects()
    }

    fun loadProjects() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = RetrofitClient.apiService.getProjects()
                if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                    _projects.value = response.body()!!
                } else {
                    _projects.value = MockDataProvider.getSampleProjects()
                }
            } catch (e: Exception) {
                _projects.value = MockDataProvider.getSampleProjects()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun selectProject(project: Project?) {
        _selectedProject.value = project
    }

    fun setShowAddTaskSheet(show: Boolean) {
        _showAddTaskSheet.value = show
    }

    fun setShowAddProjectSheet(show: Boolean) {
        _showAddProjectSheet.value = show
    }

    fun toggleSubtask(taskId: String, subtaskId: String) {
        val proj = _selectedProject.value ?: return
        val updatedTasks = proj.tasks.map { task ->
            if (task.id == taskId) {
                val updatedSubtasks = task.subtasks.map { st ->
                    if (st.id == subtaskId) st.copy(isCompleted = !st.isCompleted) else st
                }
                task.copy(subtasks = updatedSubtasks)
            } else task
        }

        val updatedProj = proj.copy(tasks = updatedTasks)
        _selectedProject.value = updatedProj

        val allProjs = _projects.value.map { if (it.id == proj.id) updatedProj else it }
        _projects.value = allProjs
    }

    fun toggleTaskStatus(taskId: String) {
        val proj = _selectedProject.value ?: return
        val updatedTasks = proj.tasks.map { task ->
            if (task.id == taskId) {
                val newStatus = if (task.status == "Completed") "In Progress" else "Completed"
                task.copy(status = newStatus)
            } else task
        }

        val completedCount = updatedTasks.count { it.status == "Completed" }
        val newProgress = if (updatedTasks.isNotEmpty()) (completedCount * 100) / updatedTasks.size else 0
        val updatedProj = proj.copy(tasks = updatedTasks, progress = newProgress)

        _selectedProject.value = updatedProj

        val allProjs = _projects.value.map { if (it.id == proj.id) updatedProj else it }
        _projects.value = allProjs
    }

    fun addTask(title: String, description: String, priority: String, assignedTo: String, deadline: String) {
        val proj = _selectedProject.value ?: return
        val newTask = Task(
            id = "TSK-${System.currentTimeMillis() % 10000}",
            projectId = proj.id,
            title = title,
            description = description,
            priority = priority,
            status = "Pending",
            assignedTo = assignedTo,
            deadline = deadline
        )

        val updatedTasks = proj.tasks + newTask
        val updatedProj = proj.copy(tasks = updatedTasks)
        _selectedProject.value = updatedProj

        val allProjs = _projects.value.map { if (it.id == proj.id) updatedProj else it }
        _projects.value = allProjs
        setShowAddTaskSheet(false)

        viewModelScope.launch {
            try {
                RetrofitClient.apiService.addTask(newTask)
            } catch (e: Exception) {}
        }
    }

    fun addProject(name: String, clientName: String, budget: Double, deadline: String) {
        val newProj = Project(
            id = "PRJ-${System.currentTimeMillis() % 10000}",
            name = name,
            clientName = clientName,
            status = "Active",
            progress = 0,
            budget = budget,
            deadline = deadline,
            tasks = emptyList()
        )

        _projects.value = listOf(newProj) + _projects.value
        selectProject(newProj)
        setShowAddProjectSheet(false)

        viewModelScope.launch {
            try {
                RetrofitClient.apiService.createProject(newProj)
            } catch (e: Exception) {}
        }
    }
}
