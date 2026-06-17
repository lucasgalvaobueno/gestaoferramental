import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './UserContext';
import { useManipulacao } from './ManipulacaoContext';

const MovimentacoesManipulacaoContext = createContext();

export function MovimentacoesManipulacaoProvider({ children }) {
    const { currentUser } = useAuth();
    const { updateItem } = useManipulacao();
    
    const [movimentacoes, setMovimentacoes] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/manipulacao_movimentacoes');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/manipulacao_movimentacoes', JSON.stringify(movimentacoes));
    }, [movimentacoes]);

    const addSaida = (dados) => {
        const novo = {
            id: 'mov-' + Date.now().toString(),
            dataSaida: new Date().toISOString(),
            responsavelSaida: currentUser?.nome || 'Sistema',
            status: 'Em Uso',
            ...dados
        };
        setMovimentacoes(prev => [novo, ...prev]);
    };

    const registrarDevolucao = (idMovimentacao, dadosDevolucao) => {
        let movimentacaoModificada = null;

        setMovimentacoes(prev => prev.map(m => {
            if (m.id !== idMovimentacao) return m;
            
            movimentacaoModificada = {
                ...m,
                status: 'Devolvido',
                dataDevolucao: new Date().toISOString(),
                responsavelRecebimento: currentUser?.nome || 'Sistema',
                ...dadosDevolucao
            };
            return movimentacaoModificada;
        }));

        // Se marcou com avaria, avisa o item mãe no ManipulacaoContext
        if (dadosDevolucao.condicao === 'Com avarias' && movimentacaoModificada?.itemId) {
            updateItem(movimentacaoModificada.itemId, {
                statusDanificado: true,
                historicoDanos: `Danificado na devolução em ${new Date().toLocaleDateString()}. Motivo: ${dadosDevolucao.observacoesDevolucao || 'Não informado'}`
            });
        }
    };

    return (
        <MovimentacoesManipulacaoContext.Provider value={{
            movimentacoes,
            addSaida,
            registrarDevolucao
        }}>
            {children}
        </MovimentacoesManipulacaoContext.Provider>
    );
}

export const useMovimentacoesManipulacao = () => useContext(MovimentacoesManipulacaoContext);
