import React, { createContext, useState, useContext, useEffect } from 'react';

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

// ── Usuário admin padrão (seed) ──────────────────────────────
const DEFAULT_ADMIN = {
    id: 'admin-seed',
    nome: 'Administrador',
    matricula: '00001',
    email: 'admin@sistema.com',
    senhaHash: encode('admin123'),
    cargo: 'Administrador de Sistema',
    nivel: 'admin',
    paineis: ALL_PANELS.map(p => p.key),
    ativo: true,
    senhaTemporaria: false,
};

// ── Provider ─────────────────────────────────────────────────
export function UserProvider({ children }) {
    const [users, setUsers] = useState(() => {
        const stored = localStorage.getItem('@gestao/users');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Garante que o admin seed sempre existe
            if (!parsed.some(u => u.id === 'admin-seed')) {
                return [DEFAULT_ADMIN, ...parsed];
            }
            return parsed;
        }
        return [DEFAULT_ADMIN];
    });

    const [currentUser, setCurrentUser] = useState(() => {
        const stored = localStorage.getItem('@gestao/session');
        return stored ? JSON.parse(stored) : null;
    });

    // Persiste usuários
    useEffect(() => {
        localStorage.setItem('@gestao/users', JSON.stringify(users));
    }, [users]);

    // ── Helpers ────────────────────────────────────────────────
    const saveSession = (user) => {
        setCurrentUser(user);
        localStorage.setItem('@gestao/session', JSON.stringify(user));
    };

    const clearSession = () => {
        setCurrentUser(null);
        localStorage.removeItem('@gestao/session');
    };

    // ── Autenticação ───────────────────────────────────────────
    const login = (email, senha) => {
        const user = users.find(u =>
            u.email.toLowerCase() === email.trim().toLowerCase() &&
            u.senhaHash === encode(senha) &&
            u.ativo
        );
        if (!user) {
            const exists = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
            if (exists && !exists.ativo) return { success: false, reason: 'inactive' };
            return { success: false, reason: 'invalid' };
        }
        saveSession(user);
        if (user.senhaTemporaria) return { success: true, redirect: '/alterar-senha' };
        return { success: true, redirect: '/home' };
    };

    const logout = () => clearSession();

    // Mantém compatibilidade com updateUser(name, photo) do Navbar antigo
    const updateUser = (name, photo) => {
        if (!currentUser) return;
        const updates = { nome: name, name, photo };
        const updated = { ...currentUser, ...updates };
        saveSession(updated);
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updates } : u));
    };

    const updateCurrentUser = (updates) => {
        if (!currentUser) return;
        const updated = { ...currentUser, ...updates };
        saveSession(updated);
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updates } : u));
    };

    const changeOwnPassword = (newPassword) => {
        if (!currentUser) return;
        const updates = { senhaHash: encode(newPassword), senhaTemporaria: false };
        const updated = { ...currentUser, ...updates };
        saveSession(updated);
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updates } : u));
    };

    // ── Gestão de usuários (admin) ─────────────────────────────
    const addUser = (userData) => {
        const newUser = {
            id: 'user-' + Date.now(),
            nome: userData.nome,
            matricula: userData.matricula,
            email: userData.email,
            senhaHash: encode(userData.senha),
            cargo: userData.cargo,
            nivel: userData.nivel,
            paineis: userData.nivel === 'admin'
                ? ALL_PANELS.map(p => p.key)
                : (userData.paineis || []),
            ativo: true,
            senhaTemporaria: false,
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
    };

    const editUser = (id, updates) => {
        setUsers(prev => prev.map(u => {
            if (u.id !== id) return u;
            const updated = { ...u, ...updates };
            if (updates.senha) {
                updated.senhaHash = encode(updates.senha);
                delete updated.senha;
            }
            if (updates.nivel === 'admin') {
                updated.paineis = ALL_PANELS.map(p => p.key);
            }
            return updated;
        }));
        // Atualiza sessão se for o usuário logado
        if (currentUser?.id === id) {
            setCurrentUser(prev => {
                const updated = { ...prev, ...updates };
                localStorage.setItem('@gestao/session', JSON.stringify(updated));
                return updated;
            });
        }
    };

    const toggleUserActive = (id) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u));
    };

    const setTemporaryPassword = (id, tempPassword) => {
        setUsers(prev => prev.map(u =>
            u.id === id
                ? { ...u, senhaHash: encode(tempPassword), senhaTemporaria: true }
                : u
        ));
    };

    // ── Controle de acesso ─────────────────────────────────────
    const hasAccess = (panelKey) => {
        if (!currentUser) return false;
        if (currentUser.nivel === 'admin') return true;
        return Array.isArray(currentUser.paineis) && currentUser.paineis.includes(panelKey);
    };

    return (
        <UserContext.Provider value={{
            // Sessão / auth (compatibilidade)
            currentUser,
            login,
            logout,
            updateUser,       // compat com Navbar antigo
            updateCurrentUser,
            changeOwnPassword,
            // Gestão de usuários
            users,
            addUser,
            editUser,
            toggleUserActive,
            setTemporaryPassword,
            // Helpers
            hasAccess,
            ALL_PANELS,
            encode,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUsers = () => useContext(UserContext);
export const useAuth  = () => useContext(UserContext); // compatibilidade total
