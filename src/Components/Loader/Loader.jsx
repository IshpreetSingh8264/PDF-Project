import React from 'react';
import './Loader.css'; // Ensure this CSS file is updated as well

const Loader = () => {
    return (
        <div className="loader-overlay">
            <div className="loader"></div>
            <div className="loader-text">
                Please wait while we process your files, this might take some time depending on your system.
            </div>
        </div>
    );
};

export default Loader;
