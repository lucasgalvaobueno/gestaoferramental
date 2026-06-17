import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FollowUpContext = createContext();

export function useFollowUp() {
    return useContext(FollowUpContext);
}

export function FollowUpProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [requisitions, setRequisitions] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/requisitions');
        const parsed = stored ? JSON.parse(stored) : [];
        // Remove quaisquer entradas de exemplo que possam ter ficado no localStorage
        const mockIds = ['RC-EXEMPLO-001', 'RC-EXEMPLO-002', 'RC-EXEMPLO-003'];
        return parsed.filter(r => !mockIds.includes(r.numeroRC));
    });

    const [reqLogs, setReqLogs] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/req_logs');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/requisitions', JSON.stringify(requisitions));
    }, [requisitions]);

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/req_logs', JSON.stringify(reqLogs));
    }, [reqLogs]);

    const addReqLog = (reqId, action, observacao = '') => {
        const newLog = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            reqId,
            action,
            observacao,
            date: new Date().toISOString(),
            userId: currentUser?.email,
            userName: currentUser?.nome || currentUser?.name || 'Usuário Desconhecido'
        };
        setReqLogs(prev => [newLog, ...prev]);
    };

    const addRequisition = (req) => {
        const newReq = {
            id: Date.now().toString(),
            lastUpdateDate: new Date().toISOString(),
            ...req
        };
        setRequisitions(prev => [newReq, ...prev]);
        addReqLog(newReq.id, 'Criação da Requisição');
    };

    const updateRequisition = (id, updates, logMessage, observacao = '') => {
        setRequisitions(prev => prev.map(req => {
            if (req.id === id) {
                return { ...req, ...updates, lastUpdateDate: new Date().toISOString() };
            }
            return req;
        }));
        if (logMessage) {
            addReqLog(id, logMessage, observacao);
        }
    };

    const deleteRequisition = (id) => {
        setRequisitions(prev => prev.filter(req => req.id !== id));
    };

    return (
        <FollowUpContext.Provider value={{
            requisitions,
            addRequisition,
            updateRequisition,
            deleteRequisition,
            reqLogs,
            addReqLog
        }}>
            {children}
        </FollowUpContext.Provider>
    );
}
