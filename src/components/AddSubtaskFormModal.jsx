// src/components/AddSubtaskFormModal.jsx
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const AddSubtaskFormModal = ({ parentTask, onSave, onClose }) => {
    const [taskData, setTaskData] = useState({
        name: '',
        duration: '',
        startDate: '',
        endDate: '',
        estQuantity: '',
        unit: 'days',
        assignedTo: 'Vigneshmoorthy'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...taskData, parentTaskId: parentTask.id });
    };

    return (
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl flex flex-col h-full md:h-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-xl font-bold text-gray-800">Adding Sub Task {parentTask ? `for "${parentTask.name}"` : ''}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <FaTimes />
                </button>
            </div>

            {/* Body - Scrollable content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="space-y-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Task Name*</label>
                        <input
                            type="text"
                            name="name"
                            value={taskData.name}
                            onChange={handleChange}
                            className="p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Duration (Days)*</label>
                        <input
                            type="text"
                            name="duration"
                            value={taskData.duration}
                            onChange={handleChange}
                            className="p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={taskData.startDate}
                                onChange={handleChange}
                                className="p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={taskData.endDate}
                                onChange={handleChange}
                                className="p-2 border rounded-md"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">EST Quantity</label>
                            <input
                                type="number"
                                name="estQuantity"
                                value={taskData.estQuantity}
                                onChange={handleChange}
                                className="p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">Unit</label>
                            <select
                                name="unit"
                                value={taskData.unit}
                                onChange={handleChange}
                                className="p-2 border rounded-md"
                            >
                                <option value="days">Days</option>
                                <option value="items">Items</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Assign to</label>
                        <input
                            type="text"
                            name="assignedTo"
                            value={taskData.assignedTo}
                            onChange={handleChange}
                            className="p-2 border rounded-md"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Upload Files</label>
                        <div className="p-4 border border-dashed rounded-md text-gray-500 text-center">
                            Drag and drop files here or click to upload
                        </div>
                    </div>
                </div>
            </form>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end">
                <button type="submit" onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium">Save</button>
            </div>
        </div>
    );
};

export default AddSubtaskFormModal;