import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, User, Clock, MapPin } from 'lucide-react';
import { LazyImage } from './LazyImage';
import { CommentSection } from './CommentSection';
import { ImageModal } from './ImageModal';

export const PostItem = ({ post, onLike, onAddComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      if (diffHours < 24) return `Há ${diffHours} h`;
      if (diffDays === 1) return 'Ontem';
      if (diffDays < 7) return `Há ${diffDays} dias`;
      
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: '0.75rem', flexShrink: 0 }}>
          {post.author_photo ? (
            <img src={post.author_photo} alt={post.author_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={20} color="#64748b" />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>{post.author_name}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} /> {formatDate(post.created_at)}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '1rem', color: '#475569', fontWeight: '500' }}>
              <MapPin size={10} /> {post.area}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
          {post.content}
        </p>
      </div>

      {post.image_url && (
        <div style={{ marginBottom: '1rem', width: '100%', borderRadius: '0.5rem', cursor: 'zoom-in', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center' }} onClick={() => setZoomedImage(post.image_url)}>
          <img 
            src={post.image_url} 
            alt="Anexo da publicação" 
            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block', transition: 'opacity 0.2s', borderRadius: '0.5rem' }} 
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          />
        </div>
      )}

      {/* Stats */}
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: '#64748b', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
          <span>{post.likesCount > 0 ? `${post.likesCount} curtida${post.likesCount !== 1 ? 's' : ''}` : ''}</span>
          <span>{post.commentsCount > 0 ? `${post.commentsCount} comentário${post.commentsCount !== 1 ? 's' : ''}` : ''}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button 
          onClick={onLike}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: 'transparent', cursor: 'pointer', color: post.hasLiked ? '#3b82f6' : '#64748b', fontWeight: '500', transition: 'background-color 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ThumbsUp size={18} fill={post.hasLiked ? 'currentColor' : 'none'} />
          Curtir
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontWeight: '500', transition: 'background-color 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <MessageSquare size={18} />
          Comentários
        </button>
      </div>

      {/* Comments Area */}
      {showComments && (
        <CommentSection 
          postId={post.id} 
          comments={post.comments || []} 
          onAddComment={onAddComment} 
        />
      )}
    </div>
  );
};
