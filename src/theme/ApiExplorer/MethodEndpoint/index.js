import React from 'react';
import MethodEndpointOriginal from '@theme-original/ApiExplorer/MethodEndpoint';

// This is a pass-through component - the Redux provider is now at the ApiItem level
export default function MethodEndpoint(props) {
  return <MethodEndpointOriginal {...props} />;
}
