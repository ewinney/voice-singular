import React from 'react';

const ProcessingIndicator = () => (
  <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
    <p className="mt-2">Processing audio...</p>
  </div>
);

export default ProcessingIndicator;