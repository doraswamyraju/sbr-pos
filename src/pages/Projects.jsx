// src/pages/Projects.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaBuilding, FaEllipsisH } from 'react-icons/fa';
import Modal from '../components/common/Modal';
import ProjectFormModal from '../components/ProjectFormModal';
import { Link } from 'react-router-dom';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost/pos-system/server/api/projects.php');
            setProjects(response.data);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
            setError('Failed to fetch projects. Please check the backend server and endpoint.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleNewProject = () => {
        setCurrentProject(null);
        setShowFormModal(true);
    };

    const handleEditProject = (project) => {
        setCurrentProject(project);
        setShowFormModal(true);
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await axios.delete(`http://localhost/pos-system/server/api/projects.php?id=${id}`);
            fetchProjects();
        } catch (err) {
            console.error('Error deleting project:', err);
            alert('Failed to delete project.');
        }
    };
    
    const onFormSave = async (data) => {
        try {
            if (currentProject) {
                await axios.put(`http://localhost/pos-system/server/api/projects.php?id=${currentProject.id}`, data, { headers: { 'Content-Type': 'application/json' } });
            } else {
                await axios.post('http://localhost/pos-system/server/api/projects.php', data, { headers: { 'Content-Type': 'application/json' } });
            }
            setShowFormModal(false);
            fetchProjects();
        } catch (err) {
            console.error('Failed to save project:', err);
            alert('Failed to save project. Please check your form data and network connection.');
        }
    };

    if (loading) return <div className="text-center p-4">Loading projects...</div>;
    if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

    return (
        <div className="bg-gray-100 min-h-screen p-4 md:p-8">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                
                {/* Responsive Header Section: Heading and Button */}
                <div className="flex justify-between items-center mb-6 flex-wrap">
                    <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
                    <button onClick={handleNewProject} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        <FaPlus className="mr-2 sm:mr-1" /> 
                        <span className="hidden sm:inline">New Project</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FaBuilding className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-2 text-xl font-medium">No projects found.</h3>
                        <p className="mt-1">Get started by creating a new project.</p>
                        <button onClick={handleNewProject} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                            <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                            Create New Project
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {projects.map((project) => (
                                        <tr key={project.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <Link to={`/projects/${project.id}`} className="hover:text-blue-600 transition-colors">
                                                    {project.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.address}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                                                </div>
                                                <span className="ml-2 text-xs text-gray-500">{project.progress || 0}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => handleEditProject(project)} className="text-indigo-600 hover:text-indigo-800">
                                                    <FaEdit />
                                                </button>
                                                <button onClick={() => handleDeleteProject(project.id)} className="text-red-600 hover:text-red-800">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {projects.map((project) => (
                                <div key={project.id} className="bg-white p-4 rounded-lg shadow-md border-t-4 border-blue-600">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900">
                                                <Link to={`/projects/${project.id}`} className="hover:text-blue-600">{project.name}</Link>
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">Address: {project.address}</p>
                                        </div>
                                        <div className="text-sm text-right">
                                            <p className="font-semibold text-gray-900">{project.progress || 0}%</p>
                                            <div className="w-16 bg-gray-200 rounded-full h-2.5 mt-1">
                                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end space-x-2 border-t pt-4">
                                        <button
                                            onClick={() => handleEditProject(project)}
                                            className="inline-flex items-center px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                                        >
                                            <FaEdit className="mr-1" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProject(project.id)}
                                            className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                                        >
                                            <FaTrash className="mr-1" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {showFormModal && (
                    <Modal onClose={() => setShowFormModal(false)}>
                        <ProjectFormModal initialData={currentProject} onSave={onFormSave} onClose={() => setShowFormModal(false)} />
                    </Modal>
                )}
            </div>
        </div>
    );
};

export default Projects;