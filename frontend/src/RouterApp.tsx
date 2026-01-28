import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme();

const RouterApp: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ padding: '20px' }}>
          <h1>Router App with Material-UI</h1>
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/test" element={<div>Test Page</div>} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default RouterApp;