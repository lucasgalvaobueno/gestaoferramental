import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

export const ImageModal = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleWheel = (e) => {
    // Stop event bubbling
    e.stopPropagation();
    
    // Calculate zoom delta based on wheel scroll
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const handleMouseDown = (e) => {
    // Only drag with left mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Use a passive event listener for the wheel event to avoid React warnings
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const handleNativeWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      setScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  return (
    <div 
      ref={modalRef}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <button 
        onClick={onClose} 
        style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10000 }}
      >
        <X size={24} />
      </button>

      <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', gap: '1rem', zIndex: 10000 }}>
        <button onClick={() => setScale(s => Math.min(s + 0.5, 5))} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Aproximar">
          <ZoomIn size={20} />
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.5, 0.5))} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Afastar">
          <ZoomOut size={20} />
        </button>
        <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '1rem', cursor: 'pointer', fontWeight: 'bold' }} title="Voltar ao tamanho normal">
          Resetar
        </button>
      </div>

      <div 
        style={{ 
          overflow: 'hidden', 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <img 
          src={imageUrl} 
          alt="Ampliada" 
          draggable={false}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
            transition: isDragging ? 'none' : 'transform 0.1s',
            maxHeight: '90vh',
            maxWidth: '90vw',
            objectFit: 'contain'
          }} 
        />
      </div>
    </div>
  );
};
