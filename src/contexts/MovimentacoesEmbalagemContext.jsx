import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './UserContext';
import { useEmbalagem } from './EmbalagemContext';
import { supabase } from '../lib/supabase';

const MovimentacoesEmbalagemContext = createContext();

export function MovimentacoesEmbalagemProvider({ children }) {
    const { currentUser } = useAuth();
    const { updateItem } = useEmbalagem();
    
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMovimentacoes = async () => {
        const { data, error } = await supabase.from('movimentacoes').select('*').eq('setor', 'embalagem');
        if (error) {
            console.error('Erro ao buscar movimentações da embalagem:', error);
            return;
        }

        const loaded = data.map(row => ({
            id: row.id,
            itemId: row.item_id,
            colaboradorId: row.colaborador_id,
            dataSaida: row.data_saida,
            dataDevolucao: row.data_devolucao,
            status: row.status,
            ...row.dados
        }));

        loaded.sort((a, b) => new Date(b.dataSaida) - new Date(a.dataSaida));
        setMovimentacoes(loaded);
        setLoading(false);
    };

    useEffect(() => {
        fetchMovimentacoes();

        const subscription = supabase.channel('mov-embalagem-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'movimentacoes', filter: "setor=eq.embalagem" }, payload => {
                fetchMovimentacoes();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const addSaida = async (dados) => {
        const newId = 'mov-' + Date.now().toString();
        const dataSaida = new Date().toISOString();

        const dbRow = {
            id: newId,
            setor: 'embalagem',
            item_id: dados.itemId,
            colaborador_id: dados.colaboradorId || null,
            tipo: 'Saída',
            data_saida: dataSaida,
            status: 'Em Uso',
            dados: {
                responsavelSaida: currentUser?.nome || 'Sistema',
                ...dados
            }
        };

        const { error } = await supabase.from('movimentacoes').insert([dbRow]);
        if (error) {
            console.error('Erro ao registrar saída:', error);
            return;
        }

        const novo = {
            id: newId,
            dataSaida,
            status: 'Em Uso',
            ...dbRow.dados
        };

        setMovimentacoes(prev => [novo, ...prev]);
    };

    const registrarDevolucao = async (idMovimentacao, dadosDevolucao) => {
        const m = movimentacoes.find(x => x.id === idMovimentacao);
        if (!m) return;

        const dataDevolucao = new Date().toISOString();
        const responsavelRecebimento = currentUser?.nome || 'Sistema';

        const updatedDados = {
            ...m,
            responsavelRecebimento,
            ...dadosDevolucao
        };

        const dbRow = {
            status: 'Devolvido',
            data_devolucao: dataDevolucao,
            dados: updatedDados
        };

        const { error } = await supabase.from('movimentacoes').update(dbRow).eq('id', idMovimentacao);
        if (error) {
            console.error('Erro ao registrar devolução:', error);
            return;
        }

        const movimentacaoModificada = {
            ...m,
            status: 'Devolvido',
            dataDevolucao,
            responsavelRecebimento,
            ...dadosDevolucao
        };

        setMovimentacoes(prev => prev.map(mov => mov.id === idMovimentacao ? movimentacaoModificada : mov));

        if (dadosDevolucao.condicao === 'Com avarias' && movimentacaoModificada.itemId) {
            updateItem(movimentacaoModificada.itemId, {
                statusDanificado: true,
                historicoDanos: `Danificado na devolução em ${new Date().toLocaleDateString()}. Motivo: ${dadosDevolucao.observacoesDevolucao || 'Não informado'}`
            });
        }
    };

    return (
        <MovimentacoesEmbalagemContext.Provider value={{
            movimentacoes,
            loading,
            addSaida,
            registrarDevolucao
        }}>
            {children}
        </MovimentacoesEmbalagemContext.Provider>
    );
}

export const useMovimentacoesEmbalagem = () => useContext(MovimentacoesEmbalagemContext);
