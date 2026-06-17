import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './UserContext';
import { supabase } from '../lib/supabase';

const ColaboradoresCompressaoContext = createContext();

export function ColaboradoresCompressaoProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [colaboradores, setColaboradores] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchColaboradores = async () => {
        const { data, error } = await supabase.from('colaboradores').select('*').eq('setor', 'compressao');
        if (error) {
            console.error('Erro ao buscar colaboradores da compressão:', error);
            return;
        }

        const loaded = data.map(row => ({
            id: row.id,
            nome: row.nome,
            cracha: row.cracha,
            cargo: row.cargo,
            dataCriacao: row.data_criacao,
            historico: row.historico || []
        }));

        setColaboradores(loaded);
        setLoading(false);
    };

    useEffect(() => {
        fetchColaboradores();

        const subscription = supabase.channel('colab-compressao-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'colaboradores', filter: "setor=eq.compressao" }, payload => {
                fetchColaboradores();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const addColaborador = async (dados) => {
        const newId = 'colab-' + Date.now().toString();
        const dataCriacao = new Date().toISOString();
        const initialLog = {
            data: dataCriacao,
            usuario: currentUser?.nome || 'Sistema',
            acao: 'Cadastro Inicial'
        };

        const dbRow = {
            id: newId,
            setor: 'compressao',
            nome: dados.nome || 'Sem Nome',
            cracha: dados.cracha || '',
            cargo: dados.cargo || '',
            data_criacao: dataCriacao,
            historico: [initialLog]
        };

        const { error } = await supabase.from('colaboradores').insert([dbRow]);
        if (error) {
            console.error('Erro ao adicionar colaborador:', error);
            return;
        }

        const novo = {
            id: newId,
            dataCriacao: dataCriacao,
            ...dados,
            historico: [initialLog]
        };
        setColaboradores(prev => [...prev, novo]);
    };

    const editColaborador = async (id, updates) => {
        const c = colaboradores.find(x => x.id === id);
        if (!c) return;

        const mudancas = [];
        for (let k in updates) {
            if (c[k] !== updates[k]) mudancas.push(`${k}: ${c[k]} -> ${updates[k]}`);
        }

        const newLog = {
            data: new Date().toISOString(),
            usuario: currentUser?.nome || 'Sistema',
            acao: `Edição: ${mudancas.join(', ')}`
        };

        const newHistorico = [newLog, ...(c.historico || [])];

        const dbUpdates = {
            nome: updates.nome !== undefined ? updates.nome : c.nome,
            cracha: updates.cracha !== undefined ? updates.cracha : c.cracha,
            cargo: updates.cargo !== undefined ? updates.cargo : c.cargo,
            historico: newHistorico
        };

        const { error } = await supabase.from('colaboradores').update(dbUpdates).eq('id', id);
        if (error) {
            console.error('Erro ao atualizar colaborador:', error);
            return;
        }

        setColaboradores(prev => prev.map(colab => colab.id === id ? { ...colab, ...updates, historico: newHistorico } : colab));
    };

    const deleteColaborador = async (id) => {
        const { error } = await supabase.from('colaboradores').delete().eq('id', id);
        if (error) {
            console.error('Erro ao deletar colaborador:', error);
            return;
        }
        setColaboradores(prev => prev.filter(c => c.id !== id));
    };

    const getColaboradorByCracha = (cracha) => {
        return colaboradores.find(c => c.cracha === cracha);
    };

    return (
        <ColaboradoresCompressaoContext.Provider value={{
            colaboradores,
            loading,
            addColaborador,
            editColaborador,
            deleteColaborador,
            getColaboradorByCracha
        }}>
            {children}
        </ColaboradoresCompressaoContext.Provider>
    );
}

export const useColaboradoresCompressao = () => useContext(ColaboradoresCompressaoContext);
