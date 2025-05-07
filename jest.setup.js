// jest.setup.js
// This setup file helps configure Jest for Next.js testing

// Polyfill for TextEncoder/TextDecoder which Node might need
if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = require('util').TextEncoder;
  }
  if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = require('util').TextDecoder;
  }
  
  // For Next.js URL parsing
  if (typeof window === 'undefined') {
    global.URL = require('url').URL;
  }
  
  // Mock next/headers to prevent errors
  jest.mock('next/headers', () => ({
    headers: () => new Map(),
    cookies: () => new Map(),
  }));
  
  // Suppress specific console messages during tests
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args[0] && 
      typeof args[0] === 'string' && 
      (args[0].includes('Warning: ReactDOM.render') || 
       args[0].includes('Error: Uncaught [Error: expected')
      )
    ) {
      return;
    }
    originalConsoleError(...args);
  };
  
  // Clean up after tests
  afterEach(() => {
    jest.clearAllMocks();
  });