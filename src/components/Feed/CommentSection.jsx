import React, { useState } from 'react';
import { Send, Image as ImageIcon, User, X } from 'lucide-react';
import { LazyImage } from './LazyImage';
import { ImageModal } from './ImageModal';

export const CommentSection = ({ postId, comments = [], onAddComment }) => {
  const [content, setContent] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageInput, setShowImageInput] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setIsSubmitting(true);
    try {
      await onAddComment(postId, { content, imageFile });
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setShowImageInput(false);
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
      {/* Lista de Comentários */}
      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
          {comments.map((comment) => (
            <div key={comment.id} style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {comment.author_photo ? (
                  <img src={comment.author_photo} alt={comment.author_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={16} color="#64748b" />
                )}
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{comment.author_name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(comment.created_at)}</span>
                </div>
                {comment.content && <p style={{ fontSize: '0.875rem', margin: 0, whiteSpace: 'pre-wrap' }}>{comment.content}</p>}
                {comment.image_url && (
                  <div style={{ marginTop: '0.5rem', cursor: 'zoom-in', width: '100%', maxWidth: '300px', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#f8fafc' }} onClick={() => setZoomedImage(comment.image_url)}>
                    <img 
                      src={comment.image_url} 
                      alt="Anexo do comentário" 
                      style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s' }} 
                      onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de Novo Comentário */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva um comentário..."
            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', resize: 'none', minHeight: '40px', fontSize: '0.875rem', outline: 'none' }}
            rows={1}
            disabled={isSubmitting}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = (e.target.scrollHeight) + 'px';
            }}
          />
          <button type="button" onClick={() => setShowImageInput(!showImageInput)} className="btn btn-secondary btn-icon" style={{ padding: '0.5rem' }} title="Anexar imagem">
            <ImageIcon size={18} />
          </button>
          <button type="submit" className="btn btn-primary btn-icon" style={{ padding: '0.5rem' }} disabled={isSubmitting || (!content.trim() && !imageFile)}>
            <Send size={18} />
          </button>
        </div>

        {showImageInput && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '0.375rem' }}>
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
        
        {/* Preview da imagem do comentário */}
        {imagePreview && (
          <div style={{ position: 'relative', width: 'fit-content', marginTop: '0.5rem' }}>
            <img src={imagePreview} alt="Preview" style={{ maxHeight: '100px', borderRadius: '0.25rem' }} onError={(e) => e.target.style.display = 'none'} onLoad={(e) => e.target.style.display = 'block'} />
            <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={12} />
            </button>
          </div>
        )}
      </form>

      {/* Modal de Imagem Ampliada para Comentários */}
      {zoomedImage && (
        <ImageModal imageUrl={zoomedImage} onClose={() => setZoomedImage(null)} />
      )}
    </div>
  );
};
