// src/components/common/Modal.jsx
import React from 'react';

const Modal = ({ children, onClose, maxWidth = 'max-w-2xl' }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-800 bg-opacity-75 flex p-4 sm:p-6">
      <div className={`relative p-6 sm:p-8 bg-white w-full ${maxWidth} m-auto flex-col flex rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <span className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl font-bold leading-none p-1 rounded-lg hover:bg-gray-100 transition-colors">&times;</button>
        </span>
        {children}
      </div>
    </div>
  );
};

export default Modal;