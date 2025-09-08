import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ApiItemOriginal from '@theme-original/ApiItem';

// Create a minimal Redux store for OpenAPI components
const store = configureStore({
  reducer: {
    // These reducers are required by the OpenAPI components
    server: (state = { urls: [], selected: '' }, action) => {
      switch (action.type) {
        case 'SET_SERVER_URLS':
          return { ...state, urls: action.payload };
        case 'SELECT_SERVER_URL':
          return { ...state, selected: action.payload };
        default:
          return state;
      }
    },
    authorization: (state = { security: [], authorized: {} }, action) => {
      return state; // Not implementing auth logic for simplicity
    },
    apis: (state = {}, action) => {
      return state; // Basic state for API operations
    },
    playground: (state = { 
      requests: {},
      responses: {},
      contentType: { request: "", response: "" }
    }, action) => {
      return state; // State for request/response playground
    }
  }
});

// Wrapper component for ApiItem
export default function ApiItem(props) {
  return (
    <Provider store={store}>
      <ApiItemOriginal {...props} />
    </Provider>
  );
}