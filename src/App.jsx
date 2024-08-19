// src/App.jsx
import { Route, Routes, Link } from 'react-router-dom';
import './App.css';
import Main from './Components/Main';
import MergePDF from './Components/MergePDF/MergePDF';
import SplitPDF from './Components/SplitPDF/SplitPDF';
import JpgToPdf from './Components/JpgToPdf/JpgToPdf';
import GoogleImport from './Components/ImportFromGoogle/GoogleImport';

function App() {
  return (
    <>

      <Routes>
        <Route path="/merge-pdf" element={<MergePDF />} />
        <Route path="/split-pdf" element={<SplitPDF />} />
        <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
        <Route path="/google" element={<GoogleImport />} />
        <Route path="/" element={<Main />} />

      </Routes>
    </>
  );
}

export default App;
