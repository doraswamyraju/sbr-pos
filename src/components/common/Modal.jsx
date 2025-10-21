// src/components/common/Modal.jsx
import React from 'react';

const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-800 bg-opacity-75 flex">
      <div className="relative p-8 bg-white w-full max-w-2xl m-auto flex-col flex rounded-lg shadow-xl">
        <span className="absolute top-0 right-0 p-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold leading-none">&times;</button>
        </span>
        {children}
      </div>
    </div>
  );
};

export default Modal;