import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

// This is a wrapper component that provides the Redux store to OpenAPI components
export default function ApiProvider({ children }) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}
