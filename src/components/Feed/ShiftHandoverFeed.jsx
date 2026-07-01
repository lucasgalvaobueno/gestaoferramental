import React, { useRef, useCallback, useState } from 'react';
import { PostItem } from './PostItem';
import { FeedSkeleton } from './FeedSkeleton';
import { useShiftHandover } from '../../hooks/useShiftHandover';
import { useAuth, ALL_PANELS } from '../../contexts/UserContext';
import { Image as ImageIcon, Send, X } from 'lucide-react';

export const ShiftHandoverFeed = () => {
  const { currentUser } = useAuth();
  const { posts, isLoading, hasMore, fetchPosts, page, toggleLike, addComment, addPost } = useShiftHandover();
  
  
  const availablePanels = currentUser?.nivel === 'admin' 
    ? ALL_PANELS 
    : ALL_PANELS.filter(p => (currentUser?.paineis || []).includes(p.key));

  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [selectedArea, setSelectedArea] = useState(availablePanels[0]?.key || 'geral');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const observerRef = useRef(null);
  
  const lastPostElementRef = useCallback((node) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPosts(page);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, hasMore, page, fetchPosts]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setIsSubmitting(true);
    try {
      await addPost({ content, imageFile, area: selectedArea });
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setShowImageInput(false);
    } catch (error) {
      console.error("Erro ao publicar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pb-20" style={{ maxWidth: '42rem', margin: '0 auto', width: '100%', paddingBottom: '5rem' }}>
      
      {/* Create Post Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleCreatePost}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {currentUser?.photo ? (
                <img src={currentUser.photo} alt={currentUser.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#64748b' }}>
                  {(currentUser?.nome || currentUser?.name || '?').charAt(0)}
                </span>
              )}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`No que você está pensando, ${currentUser?.nome?.split(' ')[0] || 'Usuário'}?`}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: 'none', resize: 'none', minHeight: '60px', fontSize: '1rem', outline: 'none', backgroundColor: '#f1f5f9' }}
              disabled={isSubmitting}
            />
          </div>

          {showImageInput && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '0.375rem', marginBottom: '1rem' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
                style={{ flex: 1, fontSize: '0.875rem' }}
                disabled={isSubmitting}
              />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setShowImageInput(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {imagePreview && (
            <div style={{ position: 'relative', width: 'fit-content', marginBottom: '1rem' }}>
              <img src={imagePreview} alt="Preview" style={{ maxHeight: '150px', borderRadius: '0.25rem' }} onError={(e) => e.target.style.display = 'none'} onLoad={(e) => e.target.style.display = 'block'} />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={12} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button type="button" onClick={() => setShowImageInput(!showImageInput)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: '500', padding: '0.5rem', borderRadius: '0.375rem' }}>
                <ImageIcon size={20} />
                <span className="hide-on-mobile">Foto/Anexo</span>
              </button>
              
              <select 
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#f8fafc' }}
                disabled={isSubmitting}
              >
                {availablePanels.map(area => (
                  <option key={area.key} value={area.key}>{area.label}</option>
                ))}
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || (!content.trim() && !imageFile)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} /> Publicar
            </button>
          </div>
        </form>
      </div>
      
      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts.map((post, index) => {
          const isLastItem = posts.length === index + 1;
          return (
            <div ref={isLastItem ? lastPostElementRef : null} key={post.id}>
              <PostItem 
                post={post} 
                onLike={() => toggleLike(post.id, post.hasLiked)}
                onAddComment={addComment}
              />
            </div>
          );
        })}
        
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FeedSkeleton />
            <FeedSkeleton />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '1rem 0', fontSize: '0.875rem' }}>
            Você já viu todas as publicações.
          </p>
        )}
        
        {!isLoading && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b', margin: 0 }}>Nenhuma publicação encontrada na sua área ainda.</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Seja o primeiro a publicar algo!</p>
          </div>
        )}
      </div>
    </div>
  );
};
