import React, { useState, useCallback, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import Loader from '../Loader/Loader';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './MergePDF.css';

const ItemTypes = {
    FILE: 'file',
};

const FileItem = ({ file, index, moveFile, removeFile }) => {
    const [, ref] = useDrag({
        type: ItemTypes.FILE,
        item: { index },
    });

    const [, drop] = useDrop({
        accept: ItemTypes.FILE,
        hover: (item) => {
            if (item.index !== index) {
                moveFile(item.index, index);
                item.index = index;
            }
        },
    });

    return (
        <div ref={(node) => ref(drop(node))} className="file-item">
            {file.name}
            <button onClick={() => removeFile(index)} className="remove-button">Remove</button>
        </div>
    );
};

const MergePDF = () => {
    const [files, setFiles] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [authToken, setAuthToken] = useState('');

    useEffect(() => {

        window.google.accounts.id.initialize({
            client_id: '826586389397-ohce3239dgjllc242h119bj3ecjn77mp.apps.googleusercontent.com',
            callback: handleCredentialResponse,
        });

        window.gapi.load('auth', () => {
            window.gapi.load('picker', () => {
                console.log('Google Picker API loaded');
            });
        });
    }, []);

    const handleCredentialResponse = (response) => {
        setAuthToken(response.credential);
    };

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    };

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        setDragging(false);
        const droppedFiles = Array.from(event.dataTransfer.files);
        setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
    }, []);

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleRemoveFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const moveFile = (fromIndex, toIndex) => {
        const updatedFiles = [...files];
        const [movedFile] = updatedFiles.splice(fromIndex, 1);
        updatedFiles.splice(toIndex, 0, movedFile);
        setFiles(updatedFiles);
    };

    const handleGoogleDriveImport = async () => {
        if (!authToken) {
            setError('You need to sign in with Google first.');
            return;
        }

        try {
            if (!window.google || !window.google.picker) {
                throw new Error('Google Picker API is not loaded.');
            }

            console.log('Initializing Google Picker...');
            const picker = new window.google.picker.PickerBuilder()
                .addView(window.google.picker.ViewId.DOCS)
                .setOAuthToken(authToken)
                .setDeveloperKey('AIzaSyANQx_ZaksvT_v4nbdFXHNqSI5B1kXTWK8')
                .setCallback(pickerCallback)
                .build();

            console.log('Showing Google Picker...');
            picker.setVisible(true);
        } catch (error) {
            console.error('Error importing from Google Drive:', error);
            setError(`Failed to import files from Google Drive: ${error.message}`);
        }
    };


    const pickerCallback = async (data) => {
        console.log("called")
        if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
            const fileId = data[window.google.picker.Response.DOCS][0].id;
            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                });
                const blob = await response.blob();
                const fileName = data[window.google.picker.Response.DOCS][0].name;
                const importedFile = new File([blob], fileName, { type: 'application/pdf' });
                setFiles((prevFiles) => [...prevFiles, importedFile]);
            } catch (error) {
                console.error('Error loading selected file:', error);
                setError('Failed to load selected file from Google Drive');
            }
        }
    };

    const mergePDFs = async () => {
        setIsMerging(true);
        setLoadingMessage('Merging PDFs...');
        setError('');

        try {
            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                try {
                    const pdfBytes = await file.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                } catch (error) {
                    console.error('Error loading PDF file:', error);
                    setError(`Failed to load PDF file: ${file.name} - ${error.message}`);
                    continue;
                }
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'merged.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error merging PDFs:', error);
            setError('Failed to merge PDFs: ' + error.message);
        } finally {
            setIsMerging(false);
            setLoadingMessage('');
        }
    };

    return (
        <GoogleOAuthProvider clientId={'826586389397-ohce3239dgjllc242h119bj3ecjn77mp.apps.googleusercontent.com'}>
            <DndProvider backend={HTML5Backend}>
                <div className="merge-container">
                    <Breadcrumb
                        paths={[
                            { href: '/', label: 'Home' },
                            { href: '/merge-pdf', label: 'Merge PDF Tool' },
                        ]}
                    />
                    <h2>Merge PDF Tool</h2>

                    <div
                        className={`upload-area ${dragging ? 'dragover' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <div className="upload-icon">📁</div>
                        <div className="upload-text">Drag & drop PDF files here or click to select files</div>
                        <input
                            type="file"
                            accept=".pdf"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                        <button
                            className="upload-button"
                            onClick={() => document.querySelector('input[type="file"]').click()}
                        >
                            Select PDF Files
                        </button>
                    </div>

                    <div className="google-login">
                        {!authToken ? (
                            <GoogleLogin
                                onSuccess={handleCredentialResponse}
                            />
                        ) : (
                            <button
                                className="upload-button"
                                onClick={() => setAuthToken('')}
                            >
                                Logout
                            </button>
                        )}
                    </div>

                    <button onClick={handleGoogleDriveImport} className="upload-button" disabled={!authToken}>
                        Import from Google Drive
                    </button>

                    <div className="file-list">
                        {files.map((file, index) => (
                            <FileItem
                                key={index}
                                file={file}
                                index={index}
                                moveFile={moveFile}
                                removeFile={handleRemoveFile}
                            />
                        ))}
                    </div>

                    <div className="actions">
                        {files.length > 0 && (
                            <button onClick={mergePDFs} className="upload-button" disabled={isMerging}>
                                {isMerging ? 'Merging...' : 'Merge PDFs'}
                            </button>
                        )}
                        {error && <div className="error">{error}</div>}
                    </div>

                    {isMerging && <Loader message={loadingMessage} />}
                </div>
            </DndProvider>
        </GoogleOAuthProvider>
    );
};

export default MergePDF;
