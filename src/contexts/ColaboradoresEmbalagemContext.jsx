import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './UserContext';

const ColaboradoresEmbalagemContext = createContext();

export function useColaboradoresEmbalagem() {
    return useContext(ColaboradoresEmbalagemContext);
}

export function ColaboradoresEmbalagemProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [colaboradores, setColaboradores] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/embalagem_colaboradores');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/embalagem_colaboradores', JSON.stringify(colaboradores));
    }, [colaboradores]);

    const addColaborador = (colaboradorData) => {
        const novo = {
            id: 'col-emb-' + Date.now().toString(),
            dataCadastro: new Date().toISOString(),
            cadastradoPor: currentUser?.nome || 'Sistema',
            ...colaboradorData
        };
        setColaboradores(prev => [...prev, novo]);
    };

    const deleteColaborador = (id) => {
        setColaboradores(prev => prev.filter(c => c.id !== id));
    };

    return (
        <ColaboradoresEmbalagemContext.Provider value={{
            colaboradores,
            addColaborador,
            deleteColaborador
        }}>
            {children}
        </ColaboradoresEmbalagemContext.Provider>
    );
}
