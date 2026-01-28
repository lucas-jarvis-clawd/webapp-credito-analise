import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme();

const SimpleApp: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ padding: '20px' }}>
        <h1>Simple App with Material-UI</h1>
        <p>Testing Material-UI basic setup...</p>
      </div>
    </ThemeProvider>
  );
};

export default SimpleApp;