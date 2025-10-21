// src/pages/ProjectDetailsLayout.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import axios from 'axios';
import ProjectHeader from '../components/ProjectHeader';

const ProjectDetailsLayout = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProject = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost/pos-system/server/api/projects.php?id=${id}`);
            const fetchedProject = response.data;
            if (fetchedProject) {
                const normalizedProject = {
                    ...fetchedProject,
                    projectCode: fetchedProject.project_code,
                    projectValue: fetchedProject.project_value,
                    startDate: fetchedProject.start_date,
                    endDate: fetchedProject.end_date,
                    progress: fetchedProject.progress || 0,
                };
                setProject(normalizedProject);
            } else {
                setProject(null);
            }
        } catch (err) {
            console.error('Failed to fetch project details:', err);
            setError('Failed to load project details. Please check the backend.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchProject();
        }
    }, [id]);

    if (loading) return <div className="text-center p-4">Loading project details...</div>;
    if (error) return <div className="text-center p-4 text-red-600">{error}</div>;
    if (!project) return <div className="text-center p-4">Project not found.</div>;

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="sticky top-0 z-50">
                <ProjectHeader projectName={project.name} projectStatus="Complete" projectId={id} />
            </div>
            
            <div className="p-4 md:p-8">
                <Outlet context={{ project }} />
            </div>
        </div>
    );
};

export default ProjectDetailsLayout;