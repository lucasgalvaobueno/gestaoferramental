import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './UserContext';

const ColaboradoresCompressaoContext = createContext();

export function ColaboradoresCompressaoProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [colaboradores, setColaboradores] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/compressao_colaboradores');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/compressao_colaboradores', JSON.stringify(colaboradores));
    }, [colaboradores]);

    const addColaborador = (dados) => {
        const novo = {
            id: 'colab-comp-' + Date.now().toString(),
            dataCriacao: new Date().toISOString(),
            ...dados,
            historico: [{
                data: new Date().toISOString(),
                usuario: currentUser?.nome || 'Sistema',
                acao: 'Cadastro Inicial'
            }]
        };
        setColaboradores(prev => [...prev, novo]);
    };

    const editColaborador = (id, updates) => {
        setColaboradores(prev => prev.map(c => {
            if (c.id !== id) return c;
            
            const mudancas = [];
            for (let k in updates) {
                if (c[k] !== updates[k]) mudancas.push(`${k}: ${c[k]} -> ${updates[k]}`);
            }

            return {
                ...c,
                ...updates,
                historico: [
                    {
                        data: new Date().toISOString(),
                        usuario: currentUser?.nome || 'Sistema',
                        acao: `Edição: ${mudancas.join(', ')}`
                    },
                    ...(c.historico || [])
                ]
            };
        }));
    };

    const deleteColaborador = (id) => {
        setColaboradores(prev => prev.filter(c => c.id !== id));
    };

    const getColaboradorByCracha = (cracha) => {
        return colaboradores.find(c => c.cracha === cracha);
    };

    return (
        <ColaboradoresCompressaoContext.Provider value={{
            colaboradores,
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
