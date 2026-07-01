import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/UserContext';
// import { useNotifications } from './useNotifications'; // We can use the existing hook or context

export const useShiftHandover = () => {
  const { currentUser } = useAuth();
  // const { sendNotification } = useNotifications(); // Assuming this is available, or we might need to rely on the notification context/hook as imported in Home.jsx

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 10;

  const fetchPosts = useCallback(async (pageIndex, refresh = false) => {
    if (!currentUser || (isLoading && !refresh) || (!hasMore && !refresh)) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          post_comentarios (*),
          post_likes (user_id)
        `)
        .order('created_at', { ascending: false })
        .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1);

      // RBAC: Se não for admin, filtra pelas áreas do usuário
      if (currentUser.nivel !== 'admin') {
        const userAreas = currentUser.paineis || [];
        // Se a base usar "paineis" como indicativo de área (ex: 'embalagem', 'compressao')
        // Vamos formatar adequadamente.
        if (userAreas.length > 0) {
          query = query.in('area', userAreas);
        } else {
          // Usuário sem painéis = não vê nada (ou vê painel default)
          query = query.in('area', ['__NONE__']); 
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformando os dados para o formato que o frontend espera
      const formattedPosts = data.map(post => ({
        ...post,
        likesCount: post.post_likes?.length || 0,
        hasLiked: post.post_likes?.some(like => like.user_id === currentUser.id) || false,
        commentsCount: post.post_comentarios?.length || 0,
        comments: post.post_comentarios?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) || []
      }));

      if (refresh) {
        setPosts(formattedPosts);
      } else {
        setPosts(prev => {
          // Prevenindo duplicatas caso o fetch seja chamado múltiplas vezes
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = formattedPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }

      setHasMore(data.length === PAGE_SIZE);
      setPage(refresh ? 1 : pageIndex + 1);
    } catch (error) {
      console.error("Erro ao carregar posts do feed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isLoading, hasMore]);

  // Carregamento inicial
  useEffect(() => {
    if (currentUser) {
      fetchPosts(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const toggleLike = async (postId, currentState) => {
    // 1. Optimistic Update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          hasLiked: !currentState,
          likesCount: currentState ? post.likesCount - 1 : post.likesCount + 1
        };
      }
      return post;
    }));

    try {
      if (currentState) {
        // Remove like
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
      } else {
        // Add like
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: currentUser.id }]);
          
        // Lógica de notificação poderia ir aqui (ex: inserir na tabela de notificações)
      }
    } catch (error) {
      console.error("Erro ao processar like:", error);
      // Rollback
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            hasLiked: currentState,
            likesCount: currentState ? post.likesCount + 1 : post.likesCount - 1
          };
        }
        return post;
      }));
    }
  };

  const addComment = async (postId, { content, imageUrl }) => {
    try {
      const newComment = {
        post_id: postId,
        author_id: currentUser.id,
        author_name: currentUser.nome || currentUser.name,
        author_photo: currentUser.photo || null,
        content,
        image_url: imageUrl || null
      };

      const { data, error } = await supabase
        .from('post_comentarios')
        .insert([newComment])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...(post.comments || []), data]
          };
        }
        return post;
      }));

    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      throw error;
    }
  };

  const addPost = async ({ content, imageUrl, area }) => {
    try {
      const newPost = {
        author_id: currentUser.id,
        author_name: currentUser.nome || currentUser.name,
        author_photo: currentUser.photo || null,
        area: area || (currentUser.paineis?.[0] || 'Geral'), // Default to first area if none selected
        content,
        image_url: imageUrl || null
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select()
        .single();

      if (error) throw error;

      // Format for UI
      const formattedPost = {
        ...data,
        likesCount: 0,
        hasLiked: false,
        commentsCount: 0,
        comments: []
      };

      // Unshift to top
      setPosts(prev => [formattedPost, ...prev]);

    } catch (error) {
      console.error("Erro ao criar post:", error);
      throw error;
    }
  };

  return {
    posts,
    isLoading,
    hasMore,
    fetchPosts,
    page,
    toggleLike,
    addComment,
    addPost
  };
};
