import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Experience from './pages/Experience';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/experience" element={<Experience />} />
    </Routes>
  );
}

export default App;
