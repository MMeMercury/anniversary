// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* 你也可以在这里添加更多页面，比如：
        <Route path="/about" element={<AboutPage />} />
        */}
      </Routes>
    </Router>
  );
}

export default App;
