import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ManipulacaoContext = createContext();

export function useManipulacao() {
    return useContext(ManipulacaoContext);
}

export function ManipulacaoProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [items, setItems] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/manipulacao_items');
        return stored ? JSON.parse(stored) : [];
    });

    const [logs, setLogs] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/manipulacao_logs');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/manipulacao_items', JSON.stringify(items));
        localStorage.setItem('@gestao-ferramental/manipulacao_logs', JSON.stringify(logs));
    }, [items, logs]);

    const addLog = (itemId, action) => {
        if (!currentUser) return;
        setLogs(prev => [...prev, {
            id: 'log-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
            itemId,
            action,
            date: new Date().toISOString(),
            userId: currentUser.id || currentUser.email,
            userName: currentUser.nome || currentUser.name || 'Usuário'
        }]);
    };

    const addItem = (itemData) => {
        const newItem = {
            id: 'man-' + Date.now().toString(),
            dataCriacao: new Date().toISOString(),
            ...itemData
        };
        setItems(prev => [...prev, newItem]);
        addLog(newItem.id, `Cadastro Inicial da categoria: ${itemData.categoria}`);
    };

    const updateItem = (id, updates) => {
        setItems(prev => {
            const index = prev.findIndex(item => item.id === id);
            if (index === -1) return prev;
            
            const oldItem = prev[index];
            const newItem = { ...oldItem, ...updates };
            
            // Generate detailed log
            const changes = [];
            for (let key in updates) {
                if (JSON.stringify(oldItem[key]) !== JSON.stringify(updates[key])) {
                    changes.push(`Alterou '${key}'`);
                }
            }
            if (changes.length > 0) {
                addLog(id, `Edição de cadastro: ${changes.join(', ')}`);
            }
            
            const newArray = [...prev];
            newArray[index] = newItem;
            return newArray;
        });
    };

    const deleteItem = (id) => {
        setItems(prev => prev.filter(t => t.id !== id));
        // Note: Em produção real isso não deletaria fisicamente ou pelo menos manteria os logs órfãos.
    };

    return (
        <ManipulacaoContext.Provider value={{
            items,
            logs,
            addItem,
            updateItem,
            deleteItem
        }}>
            {children}
        </ManipulacaoContext.Provider>
    );
}
