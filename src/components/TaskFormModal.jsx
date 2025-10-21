// src/components/TaskFormModal.jsx
import React, { useState, useEffect } from 'react';

const TaskFormModal = ({ initialData, onSave, onClose }) => {
    const [taskData, setTaskData] = useState({
        name: '', // Changed from taskName to name
        duration: '',
        startDate: '',
        endDate: '',
        estQuantity: '',
        unit: '',
        assignedTo: '', // Changed from assignTo to assignedTo
    });

    useEffect(() => {
        if (initialData) {
            setTaskData({
                name: initialData.name || '',
                duration: initialData.duration || '',
                startDate: initialData.startDate || '',
                endDate: initialData.endDate || '',
                estQuantity: initialData.estQuantity || '',
                unit: initialData.unit || '',
                assignedTo: initialData.assignedTo || '', // Changed from assignTo to assignedTo
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // The `onSave` function is called with the correct data keys
        onSave(taskData);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                    {initialData?.isSubtask ? 'Adding Sub Task' : (initialData ? 'Editing Task' : 'Adding New Task')}
                </h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Task Name *</label>
                    <input
                        type="text"
                        name="name" // Changed from taskName to name
                        id="name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={taskData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (days)*</label>
                    <input
                        type="number"
                        name="duration"
                        id="duration"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={taskData.duration}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            id="startDate"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={taskData.startDate}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            id="endDate"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={taskData.endDate}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="estQuantity" className="block text-sm font-medium text-gray-700">Est Quantity</label>
                        <input
                            type="number"
                            name="estQuantity"
                            id="estQuantity"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={taskData.estQuantity}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                        <input
                            type="text"
                            name="unit"
                            id="unit"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={taskData.unit}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assign to</label>
                    <input
                        type="text"
                        name="assignedTo" // Changed from assignTo to assignedTo
                        id="assignedTo"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={taskData.assignedTo}
                        onChange={handleChange}
                    />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaskFormModal;