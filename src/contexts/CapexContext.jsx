import React, { createContext, useState, useContext, useEffect } from 'react';

const CapexContext = createContext();

export function useCapex() {
    return useContext(CapexContext);
}

export function CapexProvider({ children }) {
    // capexItems now represent the Budget lines directly
    const [capexItems, setCapexItems] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/capex_items');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.map(item => ({ ...item, status: item.status || 'aprovado' }));
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/capex_items', JSON.stringify(capexItems));
    }, [capexItems]);

    const addCapexItem = (item) => {
        const newItem = {
            id: Date.now().toString(),
            status: item.status || 'aprovado',
            ...item
        };
        setCapexItems(prev => [newItem, ...prev]);
    };

    const updateCapexItem = (id, updates) => {
        setCapexItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const deleteCapexItem = (id) => {
        setCapexItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <CapexContext.Provider value={{
            capexItems,
            addCapexItem,
            updateCapexItem,
            deleteCapexItem
        }}>
            {children}
        </CapexContext.Provider>
    );
}
