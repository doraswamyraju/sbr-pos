// src/components/ProjectHeader.jsx
import React from 'react';
import { FaCog, FaTimes, FaBuilding, FaChevronLeft } from 'react-icons/fa';
import { NavLink, Link } from 'react-router-dom';

const ProjectHeader = ({ projectName, projectStatus, projectId }) => {
    const baseUrl = `/projects/${projectId}`;

    const tabs = [
        { name: 'Overview', to: baseUrl },
        { name: 'Estimate', to: `${baseUrl}/estimate` },
        { name: 'Party', to: `${baseUrl}/party` },
        { name: 'Transaction', to: `${baseUrl}/transaction` },
        { name: 'To Do', to: `${baseUrl}/todo` },
        { name: 'Attendance', to: `${baseUrl}/attendance` },
        { name: 'Material', to: `${baseUrl}/material` },
        { name: 'Subcon', to: `${baseUrl}/subcon` },
        { name: 'Files', to: `${baseUrl}/files` },
        { name: 'MOM', to: `${baseUrl}/mom` },
    ];

    return (
        <div className="bg-white shadow-md fixed top-0 w-full z-50">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                    <Link to="/projects" className="text-gray-500 hover:text-gray-700 mr-4">
                        <FaChevronLeft size={20} />
                    </Link>
                    <div className="flex items-center space-x-2">
                        <FaBuilding className="text-blue-600 text-2xl" />
                        <span className="text-xl font-bold text-gray-800">{projectName}</span>
                        <div className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full hidden sm:inline-block">{projectStatus}</div>
                    </div>
                    {/* The X icon is moved here */}
                    <Link to="/projects" className="text-gray-400 hover:text-red-600 ml-4">
                        <FaTimes className="text-2xl" />
                    </Link>
                </div>

                <div className="flex items-center space-x-2">
                    <FaCog className="text-gray-400 text-2xl cursor-pointer" />
                </div>
            </div>

            {/* Sticky Tabs Navbar (for desktop & mobile) */}
            <nav className="flex items-center justify-start overflow-x-auto p-2 border-b whitespace-nowrap scrollbar-hide">
                {tabs.map(tab => (
                    <NavLink
                        key={tab.name}
                        to={tab.to}
                        className={({ isActive }) =>
                            `text-sm font-medium px-4 py-2 mx-1 rounded-md transition-colors duration-200
                            ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
                        }
                    >
                        {tab.name}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default ProjectHeader;