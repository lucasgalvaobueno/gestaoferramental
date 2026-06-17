import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const OrgContext = createContext();

export function useOrg() {
    return useContext(OrgContext);
}

const defaultOrgData = [
    {
        id: 'ceo-1',
        parentId: null,
        nome: 'João Silva',
        matricula: '10001',
        turno: 'Administrativo',
        escala: '5x2',
        cargo: 'CEO',
        funcao: 'Diretor Geral',
        numeroVaga: '001',
        isOpen: false,
        observacao: 'Foco em expansão LATAM',
        avatarUrl: '',
        area: 'Diretoria'
    }
];

export function OrgProvider({ children }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrg = async () => {
        const { data, error } = await supabase.from('organograma').select('*');
        if (error) {
            console.error('Erro ao buscar organograma:', error);
            return;
        }

        if (data.length === 0) {
            // Seed inicial se vazio
            setEmployees(defaultOrgData);
            setLoading(false);
            
            // Opcional: Inserir seed no banco
            const seedRows = defaultOrgData.map(e => ({
                id: e.id,
                cargo: e.cargo,
                departamento: e.area || 'Diretoria',
                status: e.isOpen ? 'aberta' : 'preenchida',
                dados: e
            }));
            await supabase.from('organograma').insert(seedRows);
            return;
        }

        const loaded = data.map(row => ({
            id: row.id,
            ...row.dados
        }));

        setEmployees(loaded);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrg();

        const subscription = supabase.channel('org-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'organograma' }, payload => {
                fetchOrg();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const _updateInDb = async (id, dataObj) => {
        const dbRow = {
            cargo: dataObj.cargo || 'Indefinido',
            departamento: dataObj.area || 'Geral',
            status: dataObj.isOpen ? 'aberta' : 'preenchida',
            dados: dataObj
        };

        const { error } = await supabase.from('organograma').update(dbRow).eq('id', id);
        if (error) {
            console.error('Erro ao atualizar organograma:', error);
        }
    };

    const addEmployee = async (employeeData) => {
        const newId = 'emp-' + Date.now().toString();
        const newEmp = { id: newId, ...employeeData };

        const dbRow = {
            id: newId,
            cargo: employeeData.cargo || 'Indefinido',
            departamento: employeeData.area || 'Geral',
            status: employeeData.isOpen ? 'aberta' : 'preenchida',
            dados: newEmp
        };

        const { error } = await supabase.from('organograma').insert([dbRow]);
        if (error) {
            console.error('Erro ao adicionar no organograma:', error);
            return;
        }

        setEmployees(prev => [...prev, newEmp]);
    };

    const updateEmployee = async (id, updates) => {
        const emp = employees.find(e => e.id === id);
        if (!emp) return;

        const newEmp = { ...emp, ...updates };
        await _updateInDb(id, newEmp);

        setEmployees(prev => prev.map(e => e.id === id ? newEmp : e));
    };

    const deleteEmployee = async (id) => {
        const { error } = await supabase.from('organograma').delete().eq('id', id);
        if (error) {
            console.error('Erro ao deletar do organograma:', error);
            return;
        }
        
        // Remove also children recursively
        const childrenToRemove = getDescendantIds(id);
        if (childrenToRemove.length > 0) {
            await supabase.from('organograma').delete().in('id', childrenToRemove);
        }

        setEmployees(prev => prev.filter(e => e.id !== id && !childrenToRemove.includes(e.id)));
    };

    const getDescendantIds = (parentId) => {
        const descendants = [];
        const findChildren = (id) => {
            const children = employees.filter(e => e.parentId === id);
            children.forEach(c => {
                descendants.push(c.id);
                findChildren(c.id);
            });
        };
        findChildren(parentId);
        return descendants;
    };

    const importFromCSV = async (dataArray) => {
        const rows = dataArray.map(item => ({
            id: item.id || `emp-${Date.now().toString()}-${Math.random().toString(36).substr(2, 5)}`,
            cargo: item.cargo || 'Indefinido',
            departamento: item.area || 'Geral',
            status: item.isOpen ? 'aberta' : 'preenchida',
            dados: item
        }));

        await supabase.from('organograma').delete().neq('id', 'dummy'); // delete all
        await supabase.from('organograma').insert(rows);
        
        setEmployees(rows.map(r => r.dados));
    };

    return (
        <OrgContext.Provider value={{
            employees,
            loading,
            addEmployee,
            updateEmployee,
            deleteEmployee,
            importFromCSV
        }}>
            {children}
        </OrgContext.Provider>
    );
}
