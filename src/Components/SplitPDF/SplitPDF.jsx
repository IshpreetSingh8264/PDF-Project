import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import './SplitPDF.css';
import Breadcrumbs from '../Breadcrumb/Breadcrumb';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const SplitPDF = () => {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [fixedRange, setFixedRange] = useState(1);
  const [ranges, setRanges] = useState([{ from: 1, to: 1 }]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [splitOption, setSplitOption] = useState("range");
  const [rangeType, setRangeType] = useState("custom");
  const [pageThumbnails, setPageThumbnails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file) {
      document.querySelector('.right-panel').classList.add('visible');
    }
  }, [file]);

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    const arrayBuffer = await selectedFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    setPdfDoc(pdfDoc);
    setPageCount(pdfDoc.getPageCount());
    await generateThumbnails(arrayBuffer);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    handleFileSelect({ target: { files: [droppedFile] } });
  };

  const handleAddRange = () => {
    setRanges([...ranges, { from: 1, to: 1 }]);
  };

  const handleRemoveRange = (index) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  const handleRangeChange = (index, key, value) => {
    const newRanges = [...ranges];
    newRanges[index][key] = value;
    setRanges(newRanges);
  };

  const handlePageSelect = (pageIndex) => {
    setSelectedPages((prevSelected) =>
      prevSelected.includes(pageIndex)
        ? prevSelected.filter((page) => page !== pageIndex)
        : [...prevSelected, pageIndex]
    );
  };

  const generateThumbnails = async (arrayBuffer) => {
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;

    const thumbnails = [];
    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const viewport = page.getViewport({ scale: 0.2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;

      thumbnails.push(canvas.toDataURL());
    }
    setPageThumbnails(thumbnails);
  };

  const splitByFixedRange = async () => {
    const pdfsToDownload = [];
    const totalPages = pageCount;
    let startPage = 0;

    console.log(`Starting split by fixed range. Total pages: ${totalPages}, Fixed range: ${fixedRange}`);

    while (startPage < totalPages) {
      const endPage = Math.min(startPage + fixedRange, totalPages);
      const pageIndices = Array.from({ length: endPage - startPage }, (_, k) => startPage + k);

      console.log(`Creating new PDF for pages ${startPage + 1} to ${endPage}`);

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      pdfsToDownload.push(newPdf);

      startPage += fixedRange;
    }

    console.log(`Total PDFs generated for fixed range: ${pdfsToDownload.length}`);
    return pdfsToDownload;
  };

  const splitByCustomRange = async () => {
    const pdfsToDownload = [];

    for (const range of ranges) {
      if (range.from <= range.to && range.from > 0 && range.to <= pageCount) {
        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from({ length: range.to - range.from + 1 }, (_, i) => i + range.from - 1);

        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        pdfsToDownload.push(newPdf);
      } else {
        console.error(`Invalid range: from ${range.from} to ${range.to}`);
      }
    }

    return pdfsToDownload;
  };

  const splitBySelectedPages = async () => {
    if (selectedPages.length === 0) {
      console.error("No pages selected");
      return [];
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, selectedPages);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return [newPdf];
  };

  const handleSplitPDF = async () => {
    if (!pdfDoc) return;

    setLoading(true); // Show the loader

    console.log("Starting PDF splitting...");
    console.log(`Current split option: ${splitOption}`);
    console.log(`Current range type: ${rangeType}`);

    let pdfsToDownload = [];

    try {
      switch (splitOption) {
        case "range":
          if (rangeType === "fixed") {
            console.log("Splitting by fixed range...");
            pdfsToDownload = await splitByFixedRange();
          } else if (rangeType === "custom") {
            console.log("Splitting by custom range...");
            pdfsToDownload = await splitByCustomRange();
          } else {
            console.error("Invalid range type for range split option");
          }
          break;

        case "selectPages":
          console.log("Splitting by selected pages...");
          pdfsToDownload = await splitBySelectedPages();
          break;

        default:
          console.error("Invalid split option");
          return;
      }

      console.log(`Number of PDFs to download: ${pdfsToDownload.length}`);

      // Ensure PDFs are saved and downloaded correctly
      for (let i = 0; i < pdfsToDownload.length; i++) {
        console.log(`Saving and downloading PDF part ${i + 1}`);
        const pdfBytes = await pdfsToDownload[i].save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Split_Part_${i + 1}.pdf`;
        link.click();
        // Add a delay to avoid multiple rapid clicks
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log("PDF splitting complete.");
    } catch (error) {
      console.error("Error during PDF splitting:", error);
    } finally {
      setLoading(false); // Hide the loader
    }
  };

  const handleFixedRangeChange = (value) => {
    setFixedRange(parseInt(value, 10));
  };

  const handleAnotherPDF = () => {
    setFile(null);
    setPdfDoc(null);
    setPageCount(0);
    setRanges([{ from: 1, to: 1 }]);
    setFixedRange(1);
    setSelectedPages([]);
    setSplitOption("range");
    setRangeType("custom");
    setPageThumbnails([]);
    document.querySelector('.right-panel').classList.remove('visible');
  };

  const breadcrumbPaths = [
    { label: 'Home', href: '/' },
    { label: 'Split PDF', href: '/split-pdf' }
  ];

  return (
    <div className="split-container">
      <Breadcrumbs paths={breadcrumbPaths} />

      {/* Loader */}
      {loading && (
        <div className="disabled-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className={`left-panel ${file ? 'hide' : ''}`}>
        <h2>Split PDF Tool</h2>
        <div
          className="upload-area"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">Drag & drop a PDF file here or click to select a file</div>
          <input
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button
            className="upload-button"
            onClick={() => document.querySelector('input[type="file"]').click()}
          >
            Select PDF File
          </button>
        </div>
      </div>

      {file && (
        <div className="centered-content">
          <div className="left-panel">
            <button className="small-button" onClick={handleAnotherPDF}>
              Select Another PDF
            </button>
            {splitOption === "selectPages" && (
              <div className="thumbnail-container">
                <h4>Select Pages:</h4>
                <div className="thumbnails">
                  {pageThumbnails.map((thumbnail, index) => (
                    <div
                      key={index}
                      className={`thumbnail-item ${selectedPages.includes(index) ? 'selected' : ''}`}
                      onClick={() => handlePageSelect(index)}
                    >
                      <img src={thumbnail} alt={`Page ${index + 1}`} />
                      <span>Page {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="right-panel">
            <div className="split-options">
              <h3>Select Split Option:</h3>
              <label>
                <input
                  type="radio"
                  name="splitOption"
                  value="range"
                  checked={splitOption === "range"}
                  onChange={() => setSplitOption("range")}
                />
                Split by Range
              </label>
              <label>
                <input
                  type="radio"
                  name="splitOption"
                  value="selectPages"
                  checked={splitOption === "selectPages"}
                  onChange={() => setSplitOption("selectPages")}
                />
                Select Pages
              </label>
            </div>

            {splitOption === "range" && (
              <div className="range-options">
                <h4>Choose Range Type:</h4>
                <label>
                  <input
                    type="radio"
                    name="rangeType"
                    value="custom"
                    checked={rangeType === "custom"}
                    onChange={() => setRangeType("custom")}
                  />
                  Custom Range
                </label>
                <label>
                  <input
                    type="radio"
                    name="rangeType"
                    value="fixed"
                    checked={rangeType === "fixed"}
                    onChange={() => setRangeType("fixed")}
                  />
                  Fixed Range
                </label>
                {rangeType === "custom" && (
                  <div className="custom-ranges">
                    {ranges.map((range, index) => (
                      <div key={index} className="range-item">
                        <label>
                          From:
                          <input
                            type="number"
                            value={range.from}
                            min={1}
                            max={pageCount}
                            onChange={(e) =>
                              handleRangeChange(index, "from", e.target.value)
                            }
                          />
                        </label>
                        <label>
                          To:
                          <input
                            type="number"
                            value={range.to}
                            min={1}
                            max={pageCount}
                            onChange={(e) =>
                              handleRangeChange(index, "to", e.target.value)
                            }
                          />
                        </label>
                        {ranges.length > 1 && (
                          <button
                            className="small-button"
                            onClick={() => handleRemoveRange(index)}
                          >
                            Remove Range
                          </button>
                        )}
                      </div>
                    ))}
                    <button className="small-button" onClick={handleAddRange}>
                      Add Another Range
                    </button>
                  </div>
                )}

                {rangeType === "fixed" && (
                  <div className="fixed-range">
                    <label>
                      Pages per PDF:
                      <input
                        type="number"
                        value={fixedRange}
                        min={1}
                        max={pageCount}
                        onChange={(e) => handleFixedRangeChange(e.target.value)}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            <button className="split-button" onClick={handleSplitPDF}>
              Split PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitPDF;
