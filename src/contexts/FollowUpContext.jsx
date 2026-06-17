import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const FollowUpContext = createContext();

export function useFollowUp() {
    return useContext(FollowUpContext);
}

export function FollowUpProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [requisitions, setRequisitions] = useState([]);
    const [reqLogs, setReqLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFollowUp = async () => {
        const { data, error } = await supabase.from('followup').select('*');
        if (error) {
            console.error('Erro ao buscar followup:', error);
            return;
        }

        const loadedReqs = [];
        const loadedLogs = [];

        data.forEach(row => {
            loadedReqs.push({ id: row.id, status: row.status, ...row.dados });
            if (row.dados && row.dados.reqLogs) {
                loadedLogs.push(...row.dados.reqLogs);
            }
        });

        // Ordena para que os mais recentes apareçam no topo
        loadedReqs.sort((a, b) => {
            const dateA = a.lastUpdateDate || a.dataCriacao || '0';
            const dateB = b.lastUpdateDate || b.dataCriacao || '0';
            return new Date(dateB) - new Date(dateA);
        });

        setRequisitions(loadedReqs);
        setReqLogs(loadedLogs);
        setLoading(false);
    };

    useEffect(() => {
        fetchFollowUp();

        const subscription = supabase.channel('followup-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'followup' }, payload => {
                fetchFollowUp();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const _updateInDb = async (id, newReq, newLogsList) => {
        const { id: _id, status, numeroRC, ...restData } = newReq;
        const dbRow = {
            titulo: numeroRC || 'Sem RC',
            status: status || 'Aberto',
            dados: { ...restData, numeroRC, reqLogs: newLogsList }
        };
        await supabase.from('followup').update(dbRow).eq('id', id);
    };

    const addReqLog = async (reqId, action, observacao = '') => {
        const req = requisitions.find(r => r.id === reqId);
        if (!req) return;

        const newLog = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            reqId,
            action,
            observacao,
            date: new Date().toISOString(),
            userId: currentUser?.email,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const currentLogs = reqLogs.filter(l => l.reqId === reqId);
        const newLogsList = [newLog, ...currentLogs];

        await _updateInDb(reqId, req, newLogsList);

        setReqLogs(prev => [newLog, ...prev]);
    };

    const addRequisition = async (req) => {
        const newId = Date.now().toString();
        const firstLog = {
            id: newId + '_log',
            reqId: newId,
            action: 'Criação da Requisição',
            observacao: '',
            date: new Date().toISOString(),
            userId: currentUser?.email,
            userName: currentUser?.nome || currentUser?.name || 'Sistema'
        };

        const newReq = {
            id: newId,
            lastUpdateDate: new Date().toISOString(),
            ...req
        };

        const dbRow = {
            id: newId,
            titulo: req.numeroRC || 'Sem RC',
            status: req.status || 'Aberto',
            dados: { ...newReq, reqLogs: [firstLog] }
        };

        const { error } = await supabase.from('followup').insert([dbRow]);
        if (error) {
            console.error('Erro ao criar requisição:', error);
            return;
        }

        setRequisitions(prev => [newReq, ...prev]);
        setReqLogs(prev => [firstLog, ...prev]);
    };

    const updateRequisition = async (id, updates, logMessage, observacao = '') => {
        const req = requisitions.find(r => r.id === id);
        if (!req) return;

        const newReq = { ...req, ...updates, lastUpdateDate: new Date().toISOString() };
        
        let newLog = null;
        let newLogsList = reqLogs.filter(l => l.reqId === id);

        if (logMessage) {
            newLog = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                reqId: id,
                action: logMessage,
                observacao,
                date: new Date().toISOString(),
                userId: currentUser?.email,
                userName: currentUser?.nome || currentUser?.name || 'Sistema'
            };
            newLogsList = [newLog, ...newLogsList];
        }

        await _updateInDb(id, newReq, newLogsList);

        setRequisitions(prev => prev.map(r => r.id === id ? newReq : r));
        if (newLog) {
            setReqLogs(prev => [newLog, ...prev]);
        }
    };

    const deleteRequisition = async (id) => {
        const { error } = await supabase.from('followup').delete().eq('id', id);
        if (error) {
            console.error('Erro ao deletar requisição:', error);
            return;
        }
        setRequisitions(prev => prev.filter(req => req.id !== id));
        setReqLogs(prev => prev.filter(log => log.reqId !== id));
    };

    return (
        <FollowUpContext.Provider value={{
            requisitions,
            loading,
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
