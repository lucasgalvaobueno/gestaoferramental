import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export function useTasks() {
    return useContext(TaskContext);
}

export function TaskProvider({ children }) {
    const { currentUser } = useAuth();
    
    const [tasks, setTasks] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/tasks');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/tasks', JSON.stringify(tasks));
    }, [tasks]);

    const addTask = (taskData) => {
        const newTask = {
            id: 'task-' + Date.now().toString(),
            dataCriacao: new Date().toISOString(),
            atribuidoPorId: currentUser?.email,
            atribuidoPorNome: currentUser?.nome || currentUser?.name || 'Admin',
            status: 'pendente', // 'pendente' ou 'concluida'
            ciente: false,
            ...taskData
        };
        setTasks(prev => [...prev, newTask]);
    };

    const updateTask = (id, updates) => {
        setTasks(prev => prev.map(t => {
            if (t.id === id) {
                return { ...t, ...updates, dataAtualizacao: new Date().toISOString() };
            }
            return t;
        }));
    };

    const deleteTask = (id) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return (
        <TaskContext.Provider value={{
            tasks,
            addTask,
            updateTask,
            deleteTask
        }}>
            {children}
        </TaskContext.Provider>
    );
}
