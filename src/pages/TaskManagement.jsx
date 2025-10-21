// src/pages/TaskManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaEllipsisV, FaChevronDown, FaDownload, FaChartLine, FaCommentAlt, FaProjectDiagram, FaChevronRight, FaLongArrowAltRight, FaSpinner, FaClipboardList } from 'react-icons/fa';
import Modal from '../components/common/Modal';
import TaskFormModal from '../components/TaskFormModal';
import AddSubtaskFormModal from '../components/AddSubtaskFormModal';

const TaskManagement = () => {
    const { id: projectId } = useParams();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTaskFormModal, setShowTaskFormModal] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef(null);
    const [expandedTasks, setExpandedTasks] = useState([]);
    const [showSubtaskModal, setShowSubtaskModal] = useState(false);
    const [parentTask, setParentTask] = useState(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [statuses, setStatuses] = useState([]); // New state to hold statuses

    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`http://localhost/pos-system/server/api/tasks.php?projectId=${projectId}`);
            const normalizedTasks = response.data.map(task => ({
                ...task,
                subtasks: task.subtasks || []
            }));
            setTasks(normalizedTasks);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError('Failed to fetch tasks. Please check the backend server and endpoint.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatuses = async () => {
        try {
            const response = await axios.get('http://localhost/pos-system/server/api/tasks.php?statuses=true');
            setStatuses(response.data);
        } catch (err) {
            console.error('Failed to fetch statuses:', err);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchTasks();
            fetchStatuses(); // Fetch statuses when component mounts
        }
    }, [projectId]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
                setShowStatusDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    const handleAddTask = () => {
        setCurrentTask(null);
        setShowTaskFormModal(true);
    };

    const handleEditTask = (task) => {
        setCurrentTask(task);
        setShowTaskFormModal(true);
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await axios.delete(`http://localhost/pos-system/server/api/tasks.php?id=${id}`);
            fetchTasks();
        } catch (err) {
            console.error('Error deleting task:', err);
            alert('Failed to delete task.');
        }
    };

    const handleDuplicateTask = async (task) => {
        const { id, ...dataToDuplicate } = task;
        if (dataToDuplicate.subtasks) {
            delete dataToDuplicate.subtasks;
        }

        try {
            const response = await axios.post('http://localhost/pos-system/server/api/tasks.php', { ...dataToDuplicate, projectId, name: `${dataToDuplicate.name} (Copy)` }, { headers: { 'Content-Type': 'application/json' } });
            const newTaskId = response.data.id;

            if (task.subtasks && task.subtasks.length > 0) {
                await duplicateSubtasks(task.subtasks, newTaskId, projectId);
            }

            fetchTasks();
        } catch (err) {
            console.error('Failed to duplicate task:', err);
            alert('Failed to duplicate task.');
        }
    };

    const duplicateSubtasks = async (subtasks, parentId, projectId) => {
        for (const subtask of subtasks) {
            const { id, ...subtaskData } = subtask;
            const response = await axios.post('http://localhost/pos-system/server/api/tasks.php', { ...subtaskData, projectId, parentId, name: `${subtaskData.name} (Copy)` }, { headers: { 'Content-Type': 'application/json' } });
            const newSubtaskId = response.data.id;

            if (subtask.subtasks && subtask.subtasks.length > 0) {
                await duplicateSubtasks(subtask.subtasks, newSubtaskId, projectId);
            }
        }
    };

    const handleMoveTaskDown = async (taskId) => {
        try {
            await axios.put(`http://localhost/pos-system/server/api/tasks.php?id=${taskId}`, { action: 'move_down' }, { headers: { 'Content-Type': 'application/json' } });
            fetchTasks();
        } catch (err) {
            console.error('Failed to move task down:', err);
            alert('Failed to move task down. Please check backend logic.');
        }
    };

    const onFormSave = async (taskData) => {
        try {
            if (currentTask) {
                await axios.put(`http://localhost/pos-system/server/api/tasks.php?id=${currentTask.id}`, taskData, { headers: { 'Content-Type': 'application/json' } });
            } else {
                await axios.post('http://localhost/pos-system/server/api/tasks.php', { ...taskData, projectId, progress: 0 }, { headers: { 'Content-Type': 'application/json' } });
            }
            setShowTaskFormModal(false);
            fetchTasks();
        } catch (err) {
            console.error('Failed to save task:', err);
            alert('Failed to save task. Please check your form data and network connection.');
        }
    };

    const onSubtaskSave = async (subtaskData) => {
        try {
            await axios.post('http://localhost/pos-system/server/api/tasks.php', { ...subtaskData, projectId, parentId: parentTask.id, progress: 0 }, { headers: { 'Content-Type': 'application/json' } });
            setShowSubtaskModal(false);
            fetchTasks();
        } catch (err) {
            console.error('Failed to save subtask:', err);
            alert('Failed to save subtask. Please check your form data and network connection.');
        }
    };

    const handleStatusFilter = (status) => {
        console.log("Filtering by status:", status);
        setShowStatusDropdown(false);
    };

    const handleAddSubtask = (task) => {
        setParentTask(task);
        setShowSubtaskModal(true);
    };

    const handleAddDependency = (taskId) => {
        alert(`Add Dependency for task ${taskId}`);
        setActiveDropdown(null);
    };

    const toggleDropdown = (dropdownName, event) => {
        if (activeDropdown === dropdownName) {
            setActiveDropdown(null);
        } else {
            const rect = event.currentTarget.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
            });
            setActiveDropdown(dropdownName);
        }
    };

    const toggleExpand = (taskId) => {
        setExpandedTasks(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleRowAction = (action, taskId) => {
        const findTask = (list) => {
            for (let task of list) {
                if (task.id == taskId) return task;
                if (task.subtasks && task.subtasks.length > 0) {
                    const subTask = findTask(task.subtasks);
                    if (subTask) return subTask;
                }
            }
            return null;
        };

        const task = findTask(tasks);

        if (!task) {
            console.error(`Task with ID ${taskId} not found.`);
            setActiveDropdown(null);
            return;
        }

        switch(action) {
            case 'Edit':
                handleEditTask(task);
                break;
            case 'Add Subtask':
                handleAddSubtask(task);
                break;
            case 'Move Down':
                handleMoveTaskDown(task.id);
                break;
            case 'Delete':
                handleDeleteTask(task.id);
                break;
            case 'Duplicate':
                handleDuplicateTask(task);
                break;
            case 'Add Dependency':
                handleAddDependency(task.id);
                break;
            default:
                console.log(`Unknown action: ${action}`);
        }
        setActiveDropdown(null);
    };

    const renderTaskRow = (task, isSubtask = false) => {
        const isExpanded = expandedTasks.includes(task.id);

        return (
            <React.Fragment key={task.id}>
                <tr className={`group hover:bg-gray-50 ${isSubtask ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center space-x-2 relative">
                            {task.subtasks && task.subtasks.length > 0 && (
                                <button onClick={() => toggleExpand(task.id)} className="transition-transform duration-200">
                                    <FaChevronRight className={`text-gray-400 transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                            )}
                            {isSubtask && <span className="ml-4 mr-2 text-gray-400">↳</span>}
                            <span className="cursor-pointer">{task.name}</span>
                            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 hidden group-hover:flex items-center space-x-1 bg-black text-white px-2 py-1 rounded-md text-xs whitespace-nowrap z-20">
                                <button onClick={() => handleAddSubtask(task)} className="flex items-center space-x-1">
                                    <FaLongArrowAltRight className="text-white" /> <span>Add Subtask</span>
                                </button>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.duration}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.start_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.end_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{task.progress}%</span>
                            <FaCommentAlt className="text-gray-400 cursor-pointer hover:text-blue-500" />
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.start_date || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.end_date || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.dependencies && task.dependencies.length > 0 ? <FaProjectDiagram /> : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={(e) => toggleDropdown(`task-${task.id}`, e)} className="text-gray-500 hover:text-gray-700 p-2">
                            <FaEllipsisV />
                        </button>
                    </td>
                </tr>
                {isExpanded && task.subtasks && task.subtasks.map(subtask => renderTaskRow(subtask, true))}
            </React.Fragment>
        );
    };

    const renderTaskCard = (task) => {
        return (
            <div key={task.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-600 space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base text-gray-800">{task.name}</h4>
                    <button onClick={(e) => toggleDropdown(`task-${task.id}`, e)} className="text-gray-500 hover:text-gray-700 p-2">
                        <FaEllipsisV />
                    </button>
                </div>
                <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">Duration:</span> {task.duration}
                </p>
                <div className="flex justify-between text-sm text-gray-600">
                    <p><span className="font-medium text-gray-800">Start:</span> {task.start_date}</p>
                    <p><span className="font-medium text-gray-800">End:</span> {task.end_date}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <p><span className="font-medium text-gray-800">Status:</span>
                        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full ml-2">{task.progress}%</span>
                    </p>
                    {task.dependencies && task.dependencies.length > 0 && (
                        <FaProjectDiagram className="text-gray-500" />
                    )}
                </div>
                {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-2 text-sm text-blue-600 cursor-pointer" onClick={() => toggleExpand(task.id)}>
                        <FaChevronRight className={`inline-block mr-1 transition-transform duration-200 transform ${expandedTasks.includes(task.id) ? 'rotate-90' : ''}`} />
                        {expandedTasks.includes(task.id) ? 'Hide Subtasks' : `Show ${task.subtasks.length} Subtask${task.subtasks.length > 1 ? 's' : ''}`}
                    </div>
                )}
                {expandedTasks.includes(task.id) && task.subtasks && task.subtasks.map(subtask => renderTaskCard(subtask))}
            </div>
        );
    };

    if (loading) {
        return <div className="text-center p-4">
            <FaSpinner className="animate-spin inline-block mr-2" />
            Loading tasks...
        </div>;
    }

    if (error) {
        return <div className="text-center p-4 text-red-600">{error}</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between mb-6 space-y-3 md:space-y-0">
                    <div className="flex flex-wrap items-center space-x-2 space-y-2 md:space-y-0">
                        <div className="relative">
                            <button onClick={() => setShowStatusDropdown(!showStatusDropdown)} className="flex items-center px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                All Status <FaChevronDown className="ml-2 text-xs" />
                            </button>
                            {showStatusDropdown && (
                                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10" ref={dropdownRef}>
                                    <a href="#" onClick={() => handleStatusFilter('All')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">All <span className="float-right text-gray-500">{tasks.length}</span></a>
                                    {statuses.map(status => (
                                        <a key={status} href="#" onClick={() => handleStatusFilter(status)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            {status === 0 ? 'Not Started' : (status === 100 ? 'Completed' : 'Ongoing')}
                                            <span className="float-right text-gray-500">
                                                {tasks.filter(task => task.progress === status).length}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="flex items-center px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Assignee <FaChevronDown className="ml-2 text-xs" />
                        </button>
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                            Create Baseline
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center space-x-2 space-y-2 md:space-y-0">
                        <button className="flex items-center px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            S-curve <FaChartLine className="ml-2 text-blue-600" />
                        </button>
                        <button className="flex items-center px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            Download <FaDownload className="ml-2 text-gray-600" />
                        </button>
                        <button onClick={handleAddTask} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">
                            <FaPlus className="mr-2" /> Add Task
                        </button>
                    </div>
                </div>

                {tasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FaClipboardList className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-2 text-xl font-medium">No tasks found.</h3>
                        <p className="mt-1">Get started by creating a new task.</p>
                        <button onClick={handleAddTask} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                            <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                            Create New Task
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Start Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned End Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dependencies</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tasks.map(task => renderTaskRow(task))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {tasks.map(task => renderTaskCard(task))}
                        </div>
                    </>
                )}
            </div>

            {activeDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200"
                    style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                    <a href="#" onClick={() => handleRowAction('Edit', activeDropdown.split('-')[1])} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit</a>
                    <a href="#" onClick={() => handleRowAction('Add Subtask', activeDropdown.split('-')[1])} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Add Subtask</a>
                    <a href="#" onClick={() => handleRowAction('Move Down', activeDropdown.split('-')[1])} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Move Down</a>
                    <a href="#" onClick={() => handleRowAction('Delete', activeDropdown.split('-')[1])} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Delete</a>
                    <a href="#" onClick={() => handleRowAction('Duplicate', activeDropdown.split('-')[1])} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Duplicate</a>
                    <a href="#" onClick={() => handleRowAction('Add Dependency', activeDropdown.split('-')[1])} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Add Dependency</a>
                </div>
            )}

            {showTaskFormModal && (
                <Modal onClose={() => setShowTaskFormModal(false)}>
                    <TaskFormModal initialData={currentTask} onSave={onFormSave} onClose={() => setShowTaskFormModal(false)} />
                </Modal>
            )}

            {showSubtaskModal && (
                <Modal onClose={() => setShowSubtaskModal(false)}>
                    <AddSubtaskFormModal parentTask={parentTask} onSave={onSubtaskSave} onClose={() => setShowSubtaskModal(false)} />
                </Modal>
            )}
        </div>
    );
};

export default TaskManagement;