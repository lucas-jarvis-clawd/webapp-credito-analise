import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './components/Login/LoginPage';

const theme = createTheme();

const LoginTest: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <LoginPage />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default LoginTest;