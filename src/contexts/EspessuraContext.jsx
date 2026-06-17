import React, { createContext, useState, useContext, useEffect } from 'react';

const EspessuraContext = createContext();

export function useEspessura() {
    return useContext(EspessuraContext);
}

export function EspessuraProvider({ children }) {
    const [produtos, setProdutos] = useState(() => {
        const saved = localStorage.getItem('@gestao-ferramental/espessuras_produtos');
        return saved ? JSON.parse(saved) : [];
    });

    const [lancamentos, setLancamentos] = useState(() => {
        const saved = localStorage.getItem('@gestao-ferramental/espessuras_lancamentos');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/espessuras_produtos', JSON.stringify(produtos));
    }, [produtos]);

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/espessuras_lancamentos', JSON.stringify(lancamentos));
    }, [lancamentos]);

    const addProduto = (produto) => {
        const newProduto = {
            id: crypto.randomUUID(),
            ...produto,
            createdAt: new Date().toISOString()
        };
        setProdutos(prev => [...prev, newProduto]);
    };

    const addProdutosEmMassa = (novosProdutos) => {
        const produtosComId = novosProdutos.map(p => ({
            id: crypto.randomUUID(),
            ...p,
            createdAt: new Date().toISOString()
        }));
        setProdutos(prev => [...prev, ...produtosComId]);
    };

    const updateProduto = (id, updates) => {
        setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProduto = (id) => {
        setProdutos(prev => prev.filter(p => p.id !== id));
    };

    const addLancamento = (lancamento) => {
        const newLancamento = {
            id: crypto.randomUUID(),
            ...lancamento
            // Lançamento form will provide createdAt and responsavel
        };
        setLancamentos(prev => [...prev, newLancamento]);
    };

    const updateLancamento = (id, updates) => {
        setLancamentos(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const deleteLancamento = (id) => {
        setLancamentos(prev => prev.filter(l => l.id !== id));
    };

    return (
        <EspessuraContext.Provider value={{
            produtos,
            addProduto,
            addProdutosEmMassa,
            updateProduto,
            deleteProduto,
            lancamentos,
            addLancamento,
            updateLancamento,
            deleteLancamento
        }}>
            {children}
        </EspessuraContext.Provider>
    );
}
