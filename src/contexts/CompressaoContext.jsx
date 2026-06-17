import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './UserContext';
import { supabase } from '../lib/supabase';

const CompressaoContext = createContext();

export function useCompressao() {
    return useContext(CompressaoContext);
}

export function CompressaoProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [items, setItems] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        const { data, error } = await supabase.from('itens').select('*').eq('setor', 'compressao');
        if (error) {
            console.error('Erro ao buscar itens de compressão:', error);
            return;
        }

        const loadedItems = [];
        const loadedLogs = [];

        data.forEach(row => {
            loadedItems.push({
                id: row.id,
                categoria: row.categoria,
                status: row.status,
                statusDanificado: row.status_danificado,
                ...row.dados
            });
            if (row.historico) {
                loadedLogs.push(...row.historico);
            }
        });

        setItems(loadedItems);
        setLogs(loadedLogs);
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();

        const subscription = supabase.channel('itens-compressao-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'itens', filter: "setor=eq.compressao" }, payload => {
                fetchItems();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const _updateInDb = async (id, newItem, newLogsList) => {
        const { id: _id, categoria, status, statusDanificado, ...restData } = newItem;
        
        const dbRow = {
            categoria: categoria || '',
            status: status || 'Operacional',
            status_danificado: statusDanificado || false,
            historico: newLogsList,
            dados: restData
        };

        await supabase.from('itens').update(dbRow).eq('id', id);
    };

    const addLog = async (itemId, action) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const newLog = {
            id: 'log-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
            itemId,
            action,
            date: new Date().toISOString(),
            userId: currentUser?.id || currentUser?.email,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const itemLogs = logs.filter(l => l.itemId === itemId);
        const newLogsList = [...itemLogs, newLog];

        await _updateInDb(itemId, item, newLogsList);

        setLogs(prev => [...prev, newLog]);
    };

    const addItem = async (itemData) => {
        const newId = 'comp-' + Date.now().toString();
        const initialLog = {
            id: 'log-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
            itemId: newId,
            action: `Cadastro Inicial da categoria: ${itemData.categoria}`,
            date: new Date().toISOString(),
            userId: currentUser?.id || currentUser?.email,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const newItem = {
            id: newId,
            dataCriacao: new Date().toISOString(),
            ...itemData
        };

        const { id: _id, categoria, status, statusDanificado, ...restData } = newItem;

        const dbRow = {
            id: newId,
            setor: 'compressao',
            categoria: categoria || '',
            status: status || 'Operacional',
            status_danificado: statusDanificado || false,
            historico: [initialLog],
            dados: restData
        };

        const { error } = await supabase.from('itens').insert([dbRow]);
        if (error) {
            console.error('Erro ao adicionar item de compressão:', error);
            return;
        }

        setItems(prev => [...prev, newItem]);
        setLogs(prev => [...prev, initialLog]);
    };

    const updateItem = async (id, updates) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        const changes = [];
        for (let key in updates) {
            if (updates[key] !== item[key] && key !== 'dataAtualizacao') {
                changes.push(`${key}: de '${item[key]}' para '${updates[key]}'`);
            }
        }

        const newLog = {
            id: 'log-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
            itemId: id,
            action: changes.length > 0 ? `Atualização: ${changes.join(' | ')}` : 'Atualização de dados',
            date: new Date().toISOString(),
            userId: currentUser?.id || currentUser?.email,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const newItem = { ...item, ...updates, dataAtualizacao: new Date().toISOString() };
        const itemLogs = logs.filter(l => l.itemId === id);
        const newLogsList = [...itemLogs, newLog];

        await _updateInDb(id, newItem, newLogsList);

        setItems(prev => prev.map(i => i.id === id ? newItem : i));
        setLogs(prev => [...prev, newLog]);
    };

    const itemParaObsoleto = async (id, motivo) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        const newLog = {
            id: 'log-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
            itemId: id,
            action: `Movido para Obsoleto. Motivo: ${motivo}`,
            date: new Date().toISOString(),
            userId: currentUser?.id || currentUser?.email,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const newItem = { ...item, status: 'Obsoleto', motivoObsoleto: motivo, dataObsoleto: new Date().toISOString() };
        const itemLogs = logs.filter(l => l.itemId === id);
        const newLogsList = [...itemLogs, newLog];

        await _updateInDb(id, newItem, newLogsList);

        setItems(prev => prev.map(i => i.id === id ? newItem : i));
        setLogs(prev => [...prev, newLog]);
    };

    const getLogsForItem = (itemId) => {
        return logs.filter(log => log.itemId === itemId).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    return (
        <CompressaoContext.Provider value={{
            items,
            loading,
            addItem,
            updateItem,
            itemParaObsoleto,
            getLogsForItem
        }}>
            {children}
        </CompressaoContext.Provider>
    );
}
