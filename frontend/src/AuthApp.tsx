import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';

const theme = createTheme();

const AuthApp: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div style={{ padding: '20px' }}>
            <h1>Auth App with Material-UI</h1>
            <Routes>
              <Route path="/" element={<div>Home Page with Auth</div>} />
              <Route path="/test" element={<div>Test Page with Auth</div>} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AuthApp;