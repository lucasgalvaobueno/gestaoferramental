import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CapexContext = createContext();

export function useCapex() {
    return useContext(CapexContext);
}

export function CapexProvider({ children }) {
    const [capexItems, setCapexItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCapex = async () => {
        const { data, error } = await supabase.from('ativos').select('*').eq('tipo', 'capex');
        if (error) {
            console.error('Erro ao buscar capex:', error);
            return;
        }
        
        const loaded = data.map(row => ({
            id: row.id,
            status: row.status,
            ...row.dados
        }));
        
        setCapexItems(loaded);
        setLoading(false);
    };

    useEffect(() => {
        fetchCapex();

        const subscription = supabase.channel('capex-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ativos', filter: "tipo=eq.capex" }, payload => {
                fetchCapex();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const addCapexItem = async (item) => {
        const newId = Date.now().toString();
        const status = item.status || 'aprovado';
        
        const dbRow = {
            id: newId,
            tipo: 'capex',
            nome: item.numero || item.descricao || 'Capex',
            status: status,
            dados: item
        };

        const { error } = await supabase.from('ativos').insert([dbRow]);
        if (error) {
            console.error('Erro ao adicionar capex:', error);
            return;
        }

        const newItem = { id: newId, status, ...item };
        setCapexItems(prev => [newItem, ...prev]);
    };

    const updateCapexItem = async (id, updates) => {
        const item = capexItems.find(i => i.id === id);
        if (!item) return;

        const newItem = { ...item, ...updates };
        const { id: _id, status, ...restData } = newItem;
        
        const dbRow = {
            nome: newItem.numero || newItem.descricao || 'Capex',
            status: newItem.status,
            dados: restData
        };

        const { error } = await supabase.from('ativos').update(dbRow).eq('id', id);
        if (error) {
            console.error('Erro ao atualizar capex:', error);
            return;
        }

        setCapexItems(prev => prev.map(i => i.id === id ? newItem : i));
    };

    const deleteCapexItem = async (id) => {
        const { error } = await supabase.from('ativos').delete().eq('id', id);
        if (error) {
            console.error('Erro ao deletar capex:', error);
            return;
        }

        setCapexItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <CapexContext.Provider value={{
            capexItems,
            loading,
            addCapexItem,
            updateCapexItem,
            deleteCapexItem
        }}>
            {children}
        </CapexContext.Provider>
    );
}
