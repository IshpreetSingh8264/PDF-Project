import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import './JpgToPdf.css';
import Breadcrumbs from '../Breadcrumb/Breadcrumb';
import html2canvas from 'html2canvas';
import Loader from '../Loader/Loader'; // Import the Loader component

const ItemTypes = {
    IMAGE: 'image',
};

const ImageItem = ({ file, index, moveImage, removeImage }) => {
    const [, ref] = useDrag({
        type: ItemTypes.IMAGE,
        item: { index },
    });

    const [, drop] = useDrop({
        accept: ItemTypes.IMAGE,
        hover: (item) => {
            if (item.index !== index) {
                moveImage(item.index, index);
                item.index = index;
            }
        },
    });

    return (
        <div ref={(node) => ref(drop(node))} className="image-item">
            <img src={URL.createObjectURL(file)} alt={file.name} />
            <button onClick={() => removeImage(index)} className="delete-button" aria-label="Remove image">
                <FontAwesomeIcon icon={faTrash} />
            </button>
        </div>
    );
};

const JpgToPdf = () => {
    const [files, setFiles] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const validFiles = selectedFiles.filter(file => ['image/jpeg', 'image/png'].includes(file.type));
        if (validFiles.length !== selectedFiles.length) {
            alert('Some files are not valid images.');
        }
        setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    };

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        setDragging(false);
        const droppedFiles = Array.from(event.dataTransfer.files);
        const validFiles = droppedFiles.filter(file => ['image/jpeg', 'image/png'].includes(file.type));
        if (validFiles.length !== droppedFiles.length) {
            alert('Some files are not valid images.');
        }
        setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    }, []);

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleRemoveImage = (index) => {
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const moveImage = (fromIndex, toIndex) => {
        const updatedFiles = [...files];
        const [movedImage] = updatedFiles.splice(fromIndex, 1);
        updatedFiles.splice(toIndex, 0, movedImage);
        setFiles(updatedFiles);
    };

    const convertImageToPng = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const img = new Image();
                    img.src = reader.result;
                    img.onload = async () => {
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        context.drawImage(img, 0, 0);
                        const pngDataUrl = canvas.toDataURL('image/png');
                        const response = await fetch(pngDataUrl);
                        const blob = await response.blob();
                        resolve(blob);
                    };
                    img.onerror = reject;
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleConvert = async () => {
        setIsConverting(true);

        try {
            const pdfDoc = await PDFDocument.create();

            for (const file of files) {
                const fileType = file.type;
                if (fileType !== 'image/jpeg' && fileType !== 'image/png') {
                    throw new Error(`Unsupported image format: ${fileType}`);
                }

                try {
                    const pngBlob = await convertImageToPng(file);
                    const pngArrayBuffer = await pngBlob.arrayBuffer();
                    const image = await pdfDoc.embedPng(pngArrayBuffer);

                    if (!image) {
                        throw new Error(`Unable to embed image: ${file.name}`);
                    }

                    const page = pdfDoc.addPage([image.width, image.height]);
                    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                } catch (imageError) {
                    console.error(`Error processing file ${file.name}:`, imageError.message);
                    alert(`Failed to process image: ${file.name}. ${imageError.message}`);
                    // Optionally continue processing other images
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'converted.pdf';
            link.click();
        } catch (error) {
            console.error("Error converting images to PDF:", error.message);
            alert(`Failed to convert images to PDF: ${error.message}`);
        } finally {
            setIsConverting(false);
        }
    };

    const breadcrumbPaths = [
        { label: 'Home', href: '/' },
        { label: 'JPG to PDF', href: '/jpg-to-pdf' }
    ];

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="jpg-to-pdf-container">
                <Breadcrumbs paths={breadcrumbPaths} />

                <div
                    className={`upload-area ${dragging ? 'dragover' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <div className="upload-icon">🖼️</div>
                    <div className="upload-text">Drag & drop images here or click to select files</div>
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                    <button
                        className="upload-button"
                        onClick={() => document.querySelector('input[type="file"]').click()}
                    >
                        Select Images
                    </button>
                </div>

                {files.length > 0 && (
                    <div className="image-list">
                        {files.map((file, index) => (
                            <ImageItem
                                key={file.name + index}
                                file={file}
                                index={index}
                                moveImage={moveImage}
                                removeImage={handleRemoveImage}
                            />
                        ))}
                    </div>
                )}

                {files.length > 0 && (
                    <div className="conversion-area">
                        <button className="small-button" onClick={() => setFiles([])}>
                            Clear                        </button>
                        <button className="upload-button" onClick={handleConvert} disabled={isConverting}>
                            {isConverting ? 'Converting...' : 'Convert to PDF'}
                        </button>
                    </div>
                )}

                {isConverting && <Loader />} {/* Show the loader when converting */}
            </div>
        </DndProvider>
    );
};

export default JpgToPdf;
