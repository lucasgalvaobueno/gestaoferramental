import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const EspessuraContext = createContext();

export function useEspessura() {
    return useContext(EspessuraContext);
}

export function EspessuraProvider({ children }) {
    const [produtos, setProdutos] = useState([]);
    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDados = async () => {
        const { data, error } = await supabase.from('espessuras').select('*');
        if (error) {
            console.error('Erro ao buscar espessuras:', error);
            return;
        }

        const prods = [];
        const lancs = [];

        data.forEach(row => {
            if (row.tipo === 'produto') {
                prods.push({ id: row.id, ...row.dados });
            } else if (row.tipo === 'lancamento') {
                lancs.push({ id: row.id, ...row.dados });
            }
        });

        setProdutos(prods);
        setLancamentos(lancs);
        setLoading(false);
    };

    useEffect(() => {
        fetchDados();

        const subscription = supabase.channel('espessuras-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'espessuras' }, payload => {
                fetchDados();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const addProduto = async (produto) => {
        const newId = crypto.randomUUID();
        const newProduto = {
            id: newId,
            ...produto,
            createdAt: new Date().toISOString()
        };

        const { error } = await supabase.from('espessuras').insert([{
            id: newId,
            tipo: 'produto',
            dados: newProduto
        }]);

        if (error) console.error(error);
        else setProdutos(prev => [...prev, newProduto]);
    };

    const addProdutosEmMassa = async (novosProdutos) => {
        const rows = novosProdutos.map(p => {
            const id = crypto.randomUUID();
            return {
                id,
                tipo: 'produto',
                dados: { id, ...p, createdAt: new Date().toISOString() }
            };
        });

        const { error } = await supabase.from('espessuras').insert(rows);
        if (error) console.error(error);
        else setProdutos(prev => [...prev, ...rows.map(r => r.dados)]);
    };

    const updateProduto = async (id, updates) => {
        const p = produtos.find(x => x.id === id);
        if (!p) return;
        
        const updated = { ...p, ...updates };
        const { error } = await supabase.from('espessuras').update({ dados: updated }).eq('id', id);
        
        if (error) console.error(error);
        else setProdutos(prev => prev.map(x => x.id === id ? updated : x));
    };

    const deleteProduto = async (id) => {
        const { error } = await supabase.from('espessuras').delete().eq('id', id);
        if (error) console.error(error);
        else setProdutos(prev => prev.filter(p => p.id !== id));
    };

    const addLancamento = async (lancamento) => {
        const newId = crypto.randomUUID();
        const newLancamento = { id: newId, ...lancamento };

        const { error } = await supabase.from('espessuras').insert([{
            id: newId,
            tipo: 'lancamento',
            dados: newLancamento
        }]);

        if (error) console.error(error);
        else setLancamentos(prev => [...prev, newLancamento]);
    };

    const updateLancamento = async (id, updates) => {
        const l = lancamentos.find(x => x.id === id);
        if (!l) return;
        
        const updated = { ...l, ...updates };
        const { error } = await supabase.from('espessuras').update({ dados: updated }).eq('id', id);
        
        if (error) console.error(error);
        else setLancamentos(prev => prev.map(x => x.id === id ? updated : x));
    };

    const deleteLancamento = async (id) => {
        const { error } = await supabase.from('espessuras').delete().eq('id', id);
        if (error) console.error(error);
        else setLancamentos(prev => prev.filter(l => l.id !== id));
    };

    return (
        <EspessuraContext.Provider value={{
            produtos,
            loading,
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
