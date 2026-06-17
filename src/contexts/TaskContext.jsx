import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const TaskContext = createContext();

export function useTasks() {
    return useContext(TaskContext);
}

export function TaskProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        const { data, error } = await supabase.from('tarefas').select('*');
        if (error) {
            console.error('Erro ao buscar tarefas:', error);
            return;
        }

        const loadedTasks = data.map(row => ({
            id: row.id,
            status: row.status,
            ...row.dados
        }));

        setTasks(loadedTasks);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();

        const subscription = supabase.channel('tarefas-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas' }, payload => {
                fetchTasks();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const addTask = async (taskData) => {
        const newId = 'task-' + Date.now().toString();
        const newTask = {
            id: newId,
            dataCriacao: new Date().toISOString(),
            atribuidoPorId: currentUser?.email,
            atribuidoPorNome: currentUser?.nome || currentUser?.name || 'Admin',
            status: 'pendente',
            ciente: false,
            ...taskData
        };

        const dbRow = {
            id: newId,
            titulo: taskData.titulo || taskData.title || 'Tarefa sem título',
            status: 'pendente',
            dados: newTask
        };

        const { error } = await supabase.from('tarefas').insert([dbRow]);
        if (error) {
            console.error('Erro ao adicionar tarefa:', error);
            return;
        }

        setTasks(prev => [...prev, newTask]);
    };

    const updateTask = async (id, updates) => {
        const t = tasks.find(x => x.id === id);
        if (!t) return;

        const updatedTask = { ...t, ...updates, dataAtualizacao: new Date().toISOString() };
        const { id: _id, status, ...restData } = updatedTask;

        const dbRow = {
            status: status || 'pendente',
            dados: updatedTask
        };

        const { error } = await supabase.from('tarefas').update(dbRow).eq('id', id);
        if (error) {
            console.error('Erro ao atualizar tarefa:', error);
            return;
        }

        setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
    };

    const deleteTask = async (id) => {
        const { error } = await supabase.from('tarefas').delete().eq('id', id);
        if (error) {
            console.error('Erro ao deletar tarefa:', error);
            return;
        }

        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return (
        <TaskContext.Provider value={{
            tasks,
            loading,
            addTask,
            updateTask,
            deleteTask
        }}>
            {children}
        </TaskContext.Provider>
    );
}
