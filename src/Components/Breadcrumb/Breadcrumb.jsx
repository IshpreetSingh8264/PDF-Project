// src/components/Breadcrumbs.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Breadcrumb.css';

const Breadcrumbs = ({ paths }) => {
    return (
        <nav className="breadcrumbs">
            {paths.map((path, index) => (
                <span key={index}>
                    {index > 0 && ' > '}
                    <Link to={path.href}>{path.label}</Link>
                </span>
            ))}
        </nav>
    );
};

export default Breadcrumbs;

