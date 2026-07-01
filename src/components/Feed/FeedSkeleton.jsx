import React from 'react';

export const FeedSkeleton = () => {
  return (
    <div className="card animate-pulse" style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', marginRight: '1rem' }}></div>
        <div style={{ flex: 1 }}>
          <div style={{ width: '120px', height: '16px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
          <div style={{ width: '80px', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}></div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ width: '100%', height: '16px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
      <div style={{ width: '90%', height: '16px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
      <div style={{ width: '60%', height: '16px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '16px' }}></div>
      
      {/* Image Skeleton */}
      <div style={{ width: '100%', height: '200px', backgroundColor: '#e2e8f0', borderRadius: '8px', marginBottom: '1rem' }}></div>
      
      {/* Footer (Actions) */}
      <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
        <div style={{ width: '60px', height: '16px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}></div>
        <div style={{ width: '80px', height: '16px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}></div>
      </div>
    </div>
  );
};
