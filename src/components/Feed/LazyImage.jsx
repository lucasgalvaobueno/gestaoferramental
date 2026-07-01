import React, { useState } from 'react';

export const LazyImage = ({ src, alt, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gray-200 rounded-lg ${className}`} style={{ minHeight: '200px' }}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-300" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#e2e8f0', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
      )}
      
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s', opacity: isLoaded ? 1 : 0 }}
      />
    </div>
  );
};
