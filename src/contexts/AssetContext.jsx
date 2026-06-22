import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const AssetContext = createContext();

export function AssetProvider({ children }) {
    const { currentUser } = useAuth();
    const [assets, setAssets] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAssets = async () => {
        const { data, error } = await supabase.from('ativos').select('*').eq('tipo', 'ativo');
        if (error) {
            console.error('Erro ao buscar ativos:', error);
            return;
        }
        
        // Reconstrói a estrutura de array de assets e logs
        const loadedAssets = [];
        const loadedLogs = [];
        
        for (const row of data) {
            loadedAssets.push({ id: row.id, ...row.dados });
            if (row.dados && row.dados.logs) {
                loadedLogs.push(...row.dados.logs);
            }
        }
        
        setAssets(loadedAssets);
        setLogs(loadedLogs);
        setLoading(false);
    };

    useEffect(() => {
        fetchAssets();

        const subscription = supabase.channel('ativos-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ativos', filter: "tipo=eq.ativo" }, payload => {
                fetchAssets();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const addAsset = async (assetData) => {
        const newId = Date.now().toString();
        const actionLog = {
            id: newId + '_log',
            assetId: newId,
            action: 'Cadastro Inicial',
            date: new Date().toISOString(),
            userId: currentUser?.id,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const dbRow = {
            id: newId,
            tipo: 'ativo',
            dados: { ...assetData, status: 'ativo', logs: [actionLog] }
        };

        const { error } = await supabase.from('ativos').insert([dbRow]);
        if (error) {
            console.error('Erro ao adicionar ativo:', error);
            return;
        }
        
        setAssets(prev => [...prev, { id: newId, status: 'ativo', ...assetData }]);
        setLogs(prev => [...prev, actionLog]);
    };

    const _updateInDb = async (id, newAsset, newLogsList) => {
        const { id: _id, ...restData } = newAsset;
        const dbRow = {
            dados: { ...restData, logs: newLogsList }
        };
        await supabase.from('ativos').update(dbRow).eq('id', id);
    };

    const updateAsset = async (id, assetData, customLog = 'Edição de Ativo') => {
        const asset = assets.find(a => a.id === id);
        if (!asset) return;
        
        const actionLog = {
            id: Date.now().toString() + '_log',
            assetId: id,
            action: customLog,
            date: new Date().toISOString(),
            userId: currentUser?.id,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const newAsset = { ...asset, ...assetData };
        const assetLogs = logs.filter(l => l.assetId === id);
        const newLogsList = [...assetLogs, actionLog];

        await _updateInDb(id, newAsset, newLogsList);

        setAssets(prev => prev.map(a => a.id === id ? newAsset : a));
        setLogs(prev => [...prev, actionLog]);
    };

    const moveAsset = async (id, newStatus, extraLogDesc = '', extraUpdates = {}) => {
        const asset = assets.find(a => a.id === id);
        if (!asset) return;

        const actionLog = {
            id: Date.now().toString() + '_log',
            assetId: id,
            action: `Movimentado para ${newStatus}. ${extraLogDesc}`,
            date: new Date().toISOString(),
            userId: currentUser?.id,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const newAsset = { ...asset, ...extraUpdates, status: newStatus };
        const assetLogs = logs.filter(l => l.assetId === id);
        const newLogsList = [...assetLogs, actionLog];

        await _updateInDb(id, newAsset, newLogsList);

        setAssets(prev => prev.map(a => a.id === id ? newAsset : a));
        setLogs(prev => [...prev, actionLog]);
    };

    const addLog = async (assetId, action) => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return;

        const actionLog = {
            id: Date.now().toString() + '_log',
            assetId,
            action,
            date: new Date().toISOString(),
            userId: currentUser?.id,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const assetLogs = logs.filter(l => l.assetId === assetId);
        const newLogsList = [...assetLogs, actionLog];

        await _updateInDb(assetId, asset, newLogsList);
        setLogs(prev => [...prev, actionLog]);
    };

    const getAssetsByStatus = (status) => {
        return assets.filter(a => a.status === status);
    };

    return (
        <AssetContext.Provider value={{ assets, logs, loading, addAsset, updateAsset, moveAsset, getAssetsByStatus, addLog }}>
            {children}
        </AssetContext.Provider>
    );
}

export const useAssets = () => useContext(AssetContext);
