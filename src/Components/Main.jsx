import React from 'react';
import { Link } from 'react-router-dom';

const Main = () => {
    return (
        <>
            <header>
                <div className="container">
                    <div className="logo">MyPDFTools</div>
                </div>
            </header>

            <section className="hero">
                <h1>Every tool you need to work with PDFs in one place</h1>
                <p>Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, convert. More tools coming up soon.</p>
            </section>

            <section className="tools">
                <div className="container">
                    <Link to="/merge-pdf" className="tool">
                        <div className="icon">🔗</div>
                        <h3>Merge PDF</h3>
                        <p>Combine PDFs in the order you want with the easiest PDF merger available.</p>
                    </Link>
                    <Link to="/split-pdf" className="tool">
                        <div className="icon">✂️</div>
                        <h3>Split PDF</h3>
                        <p>Separate one page or a whole set for easy conversion into independent PDF files.</p>
                    </Link>
                    <Link to="/jpg-to-pdf" className="tool">
                        <div className="icon">🖼️</div>
                        <h3>JPG to PDF</h3>
                        <p>Convert your JPG images into PDFs quickly and easily.</p>
                    </Link>
                 
                </div>
            </section>
        </>
    );
};

export default Main;
