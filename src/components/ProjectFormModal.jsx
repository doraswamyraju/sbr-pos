// src/components/ProjectFormModal.jsx
import React, { useState, useEffect } from 'react';

const ProjectFormModal = ({ initialData, onSave, onClose }) => {
    const [projectData, setProjectData] = useState({
        name: '',
        projectCode: '',
        address: '',
        startDate: '',
        endDate: '',
        projectValue: 0,
        // Add more fields as needed, e.g., team members
    });

    useEffect(() => {
        if (initialData) {
            setProjectData({
                name: initialData.name || '',
                projectCode: initialData.projectCode || '',
                address: initialData.address || '',
                startDate: initialData.startDate || '',
                endDate: initialData.endDate || '',
                projectValue: initialData.projectValue || 0,
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProjectData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(projectData);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
                {initialData ? 'Edit Project' : 'Create Project'}
            </h2>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Project Name</label>
                        <input
                            type="text"
                            name="name"
                            value={projectData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Project Code</label>
                        <input
                            type="text"
                            name="projectCode"
                            value={projectData.projectCode}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={projectData.startDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={projectData.endDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Project Address</label>
                    <textarea
                        name="address"
                        value={projectData.address}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        rows="2"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Project Value (₹)</label>
                    <input
                        type="number"
                        name="projectValue"
                        value={projectData.projectValue}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                        {initialData ? 'Save Changes' : 'Create Project'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectFormModal;
