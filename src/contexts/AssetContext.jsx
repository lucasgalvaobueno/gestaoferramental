import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AssetContext = createContext();

export function AssetProvider({ children }) {
    const { currentUser } = useAuth();
    const [assets, setAssets] = useState(() => {
        const stored = localStorage.getItem('gestao_assets');
        return stored ? JSON.parse(stored) : [];
    });
    
    const [logs, setLogs] = useState(() => {
        const stored = localStorage.getItem('gestao_logs');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('gestao_assets', JSON.stringify(assets));
        localStorage.setItem('gestao_logs', JSON.stringify(logs));
    }, [assets, logs]);

    const addAsset = (assetData) => {
        const newAsset = { ...assetData, id: Date.now().toString(), status: 'ativo' };
        setAssets(prev => [...prev, newAsset]);
        addLog(newAsset.id, 'Cadastro Inicial');
    };

    const updateAsset = (id, assetData, customLog = 'Edição de Ativo') => {
        setAssets(prev => prev.map(a => a.id === id ? { ...a, ...assetData } : a));
        addLog(id, customLog);
    };

    const moveAsset = (id, newStatus, extraLogDesc = '', extraUpdates = {}) => {
        setAssets(prev => prev.map(a => a.id === id ? { ...a, ...extraUpdates, status: newStatus } : a));
        addLog(id, `Movimentado para ${newStatus}. ${extraLogDesc}`);
    };

    const addLog = (assetId, action) => {
        if (!currentUser) return;
        setLogs(prev => [...prev, {
            id: Date.now().toString() + '_log',
            assetId,
            action,
            date: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.nome || currentUser.name || 'Usuário Desconhecido'
        }]);
    };

    const getAssetsByStatus = (status) => {
        return assets.filter(a => a.status === status);
    };

    return (
        <AssetContext.Provider value={{ assets, logs, addAsset, updateAsset, moveAsset, getAssetsByStatus, addLog }}>
            {children}
        </AssetContext.Provider>
    );
}

export const useAssets = () => useContext(AssetContext);
