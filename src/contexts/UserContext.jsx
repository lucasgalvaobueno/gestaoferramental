import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

// ── Painéis disponíveis ──────────────────────────────────────
export const ALL_PANELS = [
    { key: 'gestao-ferramental', label: 'Gestão Ferramental' },
    { key: 'manipulacao',        label: 'Manipulação'        },
    { key: 'compressao',         label: 'Compressão'         },
    { key: 'embalagem',          label: 'Embalagem'          },
    { key: 'nao-solidos',        label: 'Não Sólidos'        },
];

// ── Encoding simples (não é segurança real, apenas ofuscação) ─
const encode = (str) => {
    try { return btoa(unescape(encodeURIComponent(str))); }
    catch { return btoa(str); }
};

export function UserProvider({ children }) {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => {
        const stored = sessionStorage.getItem('@gestao/session');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(true);
    
    // Configuração de Inatividade (salva no localStorage da máquina)
    const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState(() => {
        const stored = localStorage.getItem('@gestao/inactivity_timeout');
        return stored ? parseInt(stored, 10) : 15; // 15 minutos padrão
    });

    const updateInactivityTimeout = (minutes) => {
        setInactivityTimeoutMinutes(minutes);
        localStorage.setItem('@gestao/inactivity_timeout', minutes.toString());
    };

    const fetchUsers = async () => {
        const { data, error } = await supabase.from('usuarios').select('*');
        if (error) {
            console.error('Erro ao buscar usuários:', error);
            return;
        }
        setUsers(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
        
        // Subscription para tempo real
        const subscription = supabase.channel('usuarios-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, payload => {
                fetchUsers();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    // ── Helpers ────────────────────────────────────────────────
    const saveSession = (user) => {
        setCurrentUser(user);
        sessionStorage.setItem('@gestao/session', JSON.stringify(user));
    };

    const clearSession = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('@gestao/session');
    };

    // ── Autenticação ───────────────────────────────────────────
    const login = async (email, senha) => {
        try {
            console.log("Tentando login com:", email);
            const { data, error } = await supabase.from('usuarios')
                .select('*')
                .ilike('email', email.trim())
                .single();

            if (error) {
                console.error("Erro Supabase na busca do usuário:", error);
                alert("Erro de conexão com o banco de dados: " + error.message);
                return { success: false, reason: 'invalid' };
            }
            
            if (!data) {
                console.warn("Usuário não encontrado.");
                return { success: false, reason: 'invalid' };
            }

            if (!data.ativo) {
                return { success: false, reason: 'inactive' };
            }

            if (data.senhahash !== encode(senha)) {
                console.warn("Senha não bate. Banco:", data.senhahash, "Digitado:", encode(senha));
                return { success: false, reason: 'invalid' };
            }

            saveSession(data);
            if (data.senhatemporaria) return { success: true, redirect: '/alterar-senha' };
            return { success: true, redirect: '/home' };
        } catch (err) {
            console.error("Erro inesperado no login:", err);
            alert("Erro inesperado: " + err.message);
            return { success: false, reason: 'invalid' };
        }
    };

    const logout = () => clearSession();

    const verifyAdminPassword = (senha) => {
        if (!currentUser) return false;
        return currentUser.senhahash === encode(senha);
    };

    // Mantém compatibilidade com updateUser(name, photo) do Navbar antigo
    const updateUser = async (name, photo) => {
        if (!currentUser) return;
        const updates = { nome: name, name, photo };
        const updated = { ...currentUser, ...updates };
        saveSession(updated);
        
        await supabase.from('usuarios').update({ nome: name }).eq('id', currentUser.id);
    };

    const updateCurrentUser = async (updates) => {
        if (!currentUser) return;
        const updated = { ...currentUser, ...updates };
        saveSession(updated);

        await supabase.from('usuarios').update(updates).eq('id', currentUser.id);
    };

    const changeOwnPassword = async (newPassword) => {
        if (!currentUser) return;
        const updates = { senhahash: encode(newPassword), senhatemporaria: false };
        const updated = { ...currentUser, ...updates };
        saveSession(updated);

        await supabase.from('usuarios').update(updates).eq('id', currentUser.id);
    };

    // ── Gestão de usuários (admin) ─────────────────────────────
    const addUser = async (userData) => {
        const newUser = {
            id: 'user-' + Date.now(),
            nome: userData.nome,
            matricula: userData.matricula,
            email: userData.email,
            senhahash: encode(userData.senha),
            cargo: userData.cargo,
            nivel: userData.nivel,
            paineis: userData.nivel === 'admin'
                ? ALL_PANELS.map(p => p.key)
                : (userData.paineis || []),
            ativo: true,
            senhatemporaria: false,
        };

        const { error } = await supabase.from('usuarios').insert([newUser]);
        if (error) {
            console.error('Erro ao adicionar usuário:', error);
            throw error;
        }
        
        setUsers(prev => [...prev, newUser]);
        return newUser;
    };

    const editUser = async (id, updates) => {
        const dbUpdates = { ...updates };
        if (updates.senha) {
            dbUpdates.senhahash = encode(updates.senha);
            delete dbUpdates.senha;
        }
        if (updates.nivel === 'admin') {
            dbUpdates.paineis = ALL_PANELS.map(p => p.key);
        }

        const { error } = await supabase.from('usuarios').update(dbUpdates).eq('id', id);
        if (error) {
            console.error('Erro ao editar usuário:', error);
            throw error;
        }

        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...dbUpdates } : u));

        // Atualiza sessão se for o usuário logado
        if (currentUser?.id === id) {
            setCurrentUser(prev => {
                const updated = { ...prev, ...dbUpdates };
                sessionStorage.setItem('@gestao/session', JSON.stringify(updated));
                return updated;
            });
        }
    };

    const resetUserPassword = async (id, novaSenha) => {
        await editUser(id, { senha: novaSenha, senhatemporaria: true });
    };

    const toggleUserStatus = async (id, isActive) => {
        await editUser(id, { ativo: isActive });
    };

    const deleteUser = async (id) => {
        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (error) {
            console.error('Erro ao deletar usuário:', error);
            throw error;
        }
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const value = {
        users,
        currentUser,
        loading,
        login,
        logout,
        updateUser,
        updateCurrentUser,
        changeOwnPassword,
        addUser,
        editUser,
        resetUserPassword,
        toggleUserStatus,
        deleteUser,
        inactivityTimeoutMinutes,
        updateInactivityTimeout,
        verifyAdminPassword,
        hasPanelAccess: (panelKey) => currentUser?.nivel === 'admin' || (currentUser?.paineis || []).includes(panelKey)
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useAuth() {
    const context = useContext(UserContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de UserProvider');
    return context;
}

export function useUsers() {
    return useContext(UserContext);
}
