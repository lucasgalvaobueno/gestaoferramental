import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './UserContext';
import { useEmbalagem } from './EmbalagemContext';

const MovimentacoesEmbalagemContext = createContext();

export function MovimentacoesEmbalagemProvider({ children }) {
    const { currentUser } = useAuth();
    const { items, updateItem } = useEmbalagem();
    
    const [movimentacoes, setMovimentacoes] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/embalagem_movimentacoes');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/embalagem_movimentacoes', JSON.stringify(movimentacoes));
    }, [movimentacoes]);

    const addSaida = (dados) => {
        const novo = {
            id: 'mov-emb-' + Date.now().toString(),
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

        if (movimentacaoModificada && movimentacaoModificada.itemsEnvolvidos) {
            // itemsEnvolvidos is an array of objects: { itemId: '...', condicao: '...', observacoes: '...' }
            movimentacaoModificada.itemsEnvolvidos.forEach(envolvido => {
                const parentItem = items.find(i => i.id === envolvido.itemId);
                if (parentItem) {
                    const updates = {};
                    
                    if (envolvido.condicao === 'Com avarias' || envolvido.condicao === 'Desgaste de uso') {
                        updates.statusDanificado = true;
                        updates.historicoDanos = `Danificado/Desgastado na devolução em ${new Date().toLocaleDateString()}. Motivo: ${envolvido.observacoes || 'Não informado'}`;
                    }
                    
                    if (Object.keys(updates).length > 0) {
                        updateItem(parentItem.id, updates);
                    }
                }
            });
        }
    };

    return (
        <MovimentacoesEmbalagemContext.Provider value={{
            movimentacoes,
            addSaida,
            registrarDevolucao
        }}>
            {children}
        </MovimentacoesEmbalagemContext.Provider>
    );
}

export const useMovimentacoesEmbalagem = () => useContext(MovimentacoesEmbalagemContext);
