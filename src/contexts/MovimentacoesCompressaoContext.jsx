import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './UserContext';
import { useCompressao } from './CompressaoContext';

const MovimentacoesCompressaoContext = createContext();

export function MovimentacoesCompressaoProvider({ children }) {
    const { currentUser } = useAuth();
    const { items, updateItem } = useCompressao();
    
    const [movimentacoes, setMovimentacoes] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/compressao_movimentacoes');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/compressao_movimentacoes', JSON.stringify(movimentacoes));
    }, [movimentacoes]);

    const addSaida = (dados) => {
        const novo = {
            id: 'mov-comp-' + Date.now().toString(),
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

        if (movimentacaoModificada && movimentacaoModificada.itemId) {
            const parentItem = items.find(i => i.id === movimentacaoModificada.itemId);
            
            if (parentItem) {
                const updates = {};
                
                // Acumula os comprimidos produzidos
                if (dadosDevolucao.comprimidosProduzidos > 0) {
                    updates.comprimidosProduzidosTotais = (Number(parentItem.comprimidosProduzidosTotais) || 0) + Number(dadosDevolucao.comprimidosProduzidos);
                }

                // Se marcou com avaria ou desgaste, avisa o item mãe
                if (dadosDevolucao.condicao === 'Com avarias' || dadosDevolucao.condicao === 'Desgaste de uso') {
                    updates.statusDanificado = true;
                    updates.historicoDanos = `Danificado/Desgastado na devolução em ${new Date().toLocaleDateString()}. Motivo: ${dadosDevolucao.observacoesDevolucao || 'Não informado'}`;
                }
                
                if (Object.keys(updates).length > 0) {
                    updateItem(parentItem.id, updates);
                }
            }
        }
    };

    return (
        <MovimentacoesCompressaoContext.Provider value={{
            movimentacoes,
            addSaida,
            registrarDevolucao
        }}>
            {children}
        </MovimentacoesCompressaoContext.Provider>
    );
}

export const useMovimentacoesCompressao = () => useContext(MovimentacoesCompressaoContext);
