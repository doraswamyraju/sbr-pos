import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaEdit, FaChartLine, FaClipboardList, FaUserFriends, FaCalendar, FaDollarSign, FaSpinner } from 'react-icons/fa';
import Modal from '../components/common/Modal';
import ProjectFormModal from '../components/ProjectFormModal';
import axios from 'axios';

const ProjectDetails = () => {
    const { project } = useOutletContext();
    const [showFormModal, setShowFormModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [taskData, setTaskData] = useState({
        total: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0
    });
    const [financialData, setFinancialData] = useState([]);
    const [expenseData, setExpenseData] = useState([]);
    const [tasks, setTasks] = useState([]);

    const fetchProjectData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch task progress counts
            const taskProgressResponse = await axios.get(`http://localhost/pos-system/server/api/project_data.php?action=getTaskProgress&projectId=${project.id}`);
            const progressData = taskProgressResponse.data;
            setTaskData({
                total: progressData.total_tasks || 0,
                notStarted: progressData.not_started || 0,
                inProgress: progressData.in_progress || 0,
                completed: progressData.completed || 0,
            });

            // Fetch financial data
            const financialResponse = await axios.get(`http://localhost/pos-system/server/api/project_data.php?action=getFinancialData&projectId=${project.id}`);
            const financeData = financialResponse.data;
            setFinancialData([
                { name: 'Project Value', value: project.projectValue || 0, color: 'bg-indigo-500' },
                { name: 'Total Expense', value: financeData.totalExpense || 0, color: 'bg-green-500' },
                { name: 'Total Sales Invoice', value: financeData.totalSalesInvoice || 0, color: 'bg-blue-500' },
                { name: 'Total BOQ Value', value: financeData.totalBOQValue || 0, color: 'bg-purple-500' },
            ]);

            // Fetch expense analysis data
            const expenseResponse = await axios.get(`http://localhost/pos-system/server/api/project_data.php?action=getExpenseData&projectId=${project.id}`);
            const expenses = expenseResponse.data;
            setExpenseData([
                { label: 'Material', value: expenses.material || 0, color: 'bg-blue-600' },
                { label: 'Salary', value: expenses.salary || 0, color: 'bg-gray-400' },
                { label: 'Debt Note', value: expenses.debtNote || 0, color: 'bg-gray-400' },
                { label: 'Site Expenses', value: expenses.siteExpenses || 0, color: 'bg-red-600' },
                { label: 'Subcon Expenses', value: expenses.subconExpenses || 0, color: 'bg-gray-400' },
            ]);

            // Fetch recent tasks for the table
            const tasksResponse = await axios.get(`http://localhost/pos-system/server/api/tasks.php?projectId=${project.id}&limit=5`);
            setTasks(tasksResponse.data);

        } catch (err) {
            console.error('Failed to fetch project data:', err);
            setError('Failed to load project details. Please check the backend connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (project && project.id) {
            fetchProjectData();
        }
    }, [project]);

    const onFormSave = async (data) => {
        try {
            await axios.put(`http://localhost/pos-system/server/api/projects.php?id=${project.id}`, data, { headers: { 'Content-Type': 'application/json' } });
            setShowFormModal(false);
            fetchProjectData(); // Re-fetch data after update
        } catch (err) {
            console.error('Failed to update project:', err);
            alert('Failed to update project.');
        }
    };

    if (loading) {
        return <div className="p-4 md:p-8 text-center">
            <FaSpinner className="animate-spin inline-block mr-2" />
            Loading project details...
        </div>;
    }

    if (error) {
        return <div className="p-4 md:p-8 text-center text-red-600">{error}</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
            {/* Top overview row */}
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 md:space-x-8">
                {/* Completion Circle */}
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 border-blue-600 flex items-center justify-center font-bold text-blue-600 text-lg">
                        {project.progress || 0}%
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Completed</p>
                </div>

                {/* Date Details */}
                <div className="flex-1 text-center md:text-left">
                    <p className="text-gray-500">Start Date: <span className="font-semibold text-gray-800">{project.start_date || 'N/A'}</span></p>
                    <p className="text-gray-500">End Date: <span className="font-semibold text-gray-800">{project.end_date || 'N/A'}</span></p>
                </div>

                {/* Tasks Chart */}
                <div className="flex flex-col items-center flex-1">
                    <div className="flex items-end h-24 w-full justify-center space-x-2">
                        <div style={{ height: `${(taskData.completed / (taskData.total || 1)) * 100}%` }} className="bg-green-500 w-1/3 rounded-md transition-all duration-300"></div>
                        <div style={{ height: `${(taskData.inProgress / (taskData.total || 1)) * 100}%` }} className="bg-blue-500 w-1/3 rounded-md transition-all duration-300"></div>
                        <div style={{ height: `${(taskData.notStarted / (taskData.total || 1)) * 100}%` }} className="bg-yellow-500 w-1/3 rounded-md transition-all duration-300"></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 flex justify-between w-full">
                        <span className="text-yellow-600">Not Started {taskData.notStarted}</span>
                        <span className="text-blue-600">In Progress {taskData.inProgress}</span>
                        <span className="text-green-600">Completed {taskData.completed}</span>
                    </div>
                    <p className="font-bold text-gray-800 mt-2">Tasks {taskData.total}</p>
                </div>

                <p className="flex-1 text-right text-sm text-gray-500 mt-4 md:mt-0">Client: N/A</p>
            </div>

            {/* Dashboard Widgets Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Financial Health Card */}
                <div className="bg-white p-6 rounded-lg shadow-md col-span-1 md:col-span-1 lg:col-span-1">
                    <h3 className="font-semibold text-lg mb-4">Financial Health</h3>
                    <div className="flex items-end h-48 w-full justify-between space-x-2">
                        {financialData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className={`w-full ${data.color} rounded-t-md transition-all duration-300`} style={{ height: `${(data.value / Math.max(...financialData.map(d => d.value))) * 100}%` }}></div>
                                <div className="text-xs mt-1 text-gray-600 text-center">{data.name.split(' ')[0]}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-xs">
                        {financialData.map(data => (
                            <p key={data.name} className="flex items-center space-x-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${data.color}`}></span>
                                <span>{data.name}: <span className="font-bold text-gray-800">₹{data.value.toLocaleString('en-IN')}</span></span>
                            </p>
                        ))}
                    </div>
                </div>

                {/* Total Expense Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Total Expense</h3>
                    <div className="flex items-end h-48 w-full justify-between space-x-2">
                        {expenseData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className={`w-full ${data.color} rounded-t-md transition-all duration-300`} style={{ height: `${(data.value / Math.max(...expenseData.map(d => d.value))) * 100}%`}}></div>
                                <div className="text-xs mt-1 text-gray-600 text-center">{data.label.split(' ')[0]}</div>
                            </div>
                        ))}
                    </div>
                    <p className="text-center mt-2 text-xs text-gray-500">Data represents expenses from the database</p>
                </div>

                {/* Expense Analysis Card */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Expense Analysis by cost code</h3>
                    <div className="text-center text-gray-400 py-16">
                    </div>
                </div>
            </div>

            {/* Task Schedule Table */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h3 className="font-bold text-xl mb-4">Task Schedule</h3>
                {tasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FaClipboardList className="mx-auto h-16 w-16 text-gray-400" />
                        <p className="mt-1">No tasks found for this project.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table view */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tasks.map((task, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.start_date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.end_date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                                                </div>
                                                <span className="ml-2 text-xs text-gray-500">{task.progress}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile card view */}
                        <div className="md:hidden space-y-4">
                            {tasks.map((task, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg shadow-md border-t-4 border-blue-600">
                                    <h4 className="font-semibold text-lg">{task.name}</h4>
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p><span className="font-medium text-gray-800">Start:</span> {task.start_date}</p>
                                        <p><span className="font-medium text-gray-800">End:</span> {task.end_date}</p>
                                        <p className="mt-2"><span className="font-medium text-gray-800">Progress:</span> {task.progress}%</p>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Row of Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Sales Invoices Card */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Total Sales Invoices</h3>
                    <div className="h-24 bg-gray-100 flex items-center justify-center rounded-lg">
                        <div className="w-full bg-blue-600 h-4 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <p className="text-sm mt-2">Paid: <span className="font-bold">₹{financialData[2]?.value.toLocaleString('en-IN')}</span> | Total: <span className="font-bold">₹{financialData[2]?.value.toLocaleString('en-IN')}</span></p>
                </div>

                {/* Labour Attendance Card */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Labour Attendance (last 7 days)</h3>
                    <div className="text-center text-gray-400 py-16">
                    </div>
                </div>
            </div>

            {showFormModal && (
                <Modal onClose={() => setShowFormModal(false)}>
                    <ProjectFormModal initialData={project} onSave={onFormSave} onClose={() => setShowFormModal(false)} />
                </Modal>
            )}
        </div>
    );
};

export default ProjectDetails;