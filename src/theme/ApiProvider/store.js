import { configureStore, createSlice } from '@reduxjs/toolkit';

// Create a slice with initial state for OpenAPI components
const apiSlice = createSlice({
  name: 'api',
  initialState: {
    // Default state needed for OpenAPI components
    serverUrl: '',
    endpointConfig: {},
    requestHeaders: {},
    requestBodyContent: {},
    responseBodyContent: {},
    responseStatusCode: 0,
  },
  reducers: {
    // Add any actions that might be needed
    setServerUrl: (state, action) => {
      state.serverUrl = action.payload;
    },
    setEndpointConfig: (state, action) => {
      state.endpointConfig = action.payload;
    },
    setRequestHeaders: (state, action) => {
      state.requestHeaders = action.payload;
    },
    setRequestBodyContent: (state, action) => {
      state.requestBodyContent = action.payload;
    },
    setResponseBodyContent: (state, action) => {
      state.responseBodyContent = action.payload;
    },
    setResponseStatusCode: (state, action) => {
      state.responseStatusCode = action.payload;
    },
  },
});

// Export actions
export const {
  setServerUrl,
  setEndpointConfig,
  setRequestHeaders,
  setRequestBodyContent,
  setResponseBodyContent,
  setResponseStatusCode,
} = apiSlice.actions;

// Configure the store
export const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
  },
});