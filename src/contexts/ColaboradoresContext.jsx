import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './UserContext';

const ColaboradoresContext = createContext();

export function ColaboradoresProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [colaboradores, setColaboradores] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/manipulacao_colaboradores');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/manipulacao_colaboradores', JSON.stringify(colaboradores));
    }, [colaboradores]);

    const addColaborador = (dados) => {
        const novo = {
            id: 'colab-' + Date.now().toString(),
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
        <ColaboradoresContext.Provider value={{
            colaboradores,
            addColaborador,
            editColaborador,
            deleteColaborador,
            getColaboradorByCracha
        }}>
            {children}
        </ColaboradoresContext.Provider>
    );
}

export const useColaboradores = () => useContext(ColaboradoresContext);
