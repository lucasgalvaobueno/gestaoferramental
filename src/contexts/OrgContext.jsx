import React, { createContext, useState, useContext, useEffect } from 'react';

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
    },
    {
        id: 'dir-1',
        parentId: 'ceo-1',
        nome: 'Maria Fernandes',
        matricula: '10002',
        turno: 'Administrativo',
        escala: '5x2',
        cargo: 'Diretor Comercial',
        funcao: 'Diretoria Executiva',
        numeroVaga: '002',
        isOpen: false,
        observacao: '',
        avatarUrl: ''
    },
    {
        id: 'dir-2',
        parentId: 'ceo-1',
        nome: 'Carlos Eduardo',
        matricula: '10003',
        turno: 'Administrativo',
        escala: '5x2',
        cargo: 'Diretor Financeiro',
        funcao: 'CFO',
        numeroVaga: '003',
        isOpen: false,
        observacao: '',
        avatarUrl: ''
    },
    {
        id: 'dir-3',
        parentId: 'ceo-1',
        nome: 'Ana Costa',
        matricula: '10004',
        turno: 'Administrativo',
        escala: '5x2',
        cargo: 'Diretor de Produção',
        funcao: 'COO',
        numeroVaga: '004',
        isOpen: false,
        observacao: '',
        avatarUrl: ''
    },
    {
        id: 'ger-1',
        parentId: 'dir-1',
        nome: '',
        matricula: '',
        turno: 'Comercial',
        escala: '5x2',
        cargo: 'Gerente de Vendas',
        funcao: 'Gestão de Key Accounts',
        numeroVaga: '005',
        isOpen: true,
        dataAbertura: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias atrás
        observacao: 'Vaga congelada até o Q3',
        avatarUrl: '',
        area: 'Vendas'
    }
];

export function OrgProvider({ children }) {
    const [nodes, setNodes] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/org_nodes');
        return stored ? JSON.parse(stored) : defaultOrgData;
    });

    useEffect(() => {
        localStorage.setItem('@gestao-ferramental/org_nodes', JSON.stringify(nodes));
    }, [nodes]);

    const addNode = (parentId) => {
        const newNode = {
            id: 'node-' + Date.now().toString(),
            parentId,
            nome: 'Novo Colaborador',
            matricula: '',
            turno: '',
            escala: '',
            cargo: 'Cargo Base',
            funcao: '',
            numeroVaga: '',
            isOpen: false,
            observacao: '',
            avatarUrl: '',
            area: ''
        };
        setNodes(prev => [...prev, newNode]);
    };

    const updateNode = (id, updates) => {
        setNodes(prev => prev.map(n => {
            if (n.id === id) {
                let dataAbertura = n.dataAbertura;
                if (updates.isOpen && !n.isOpen) {
                    dataAbertura = new Date().toISOString();
                } else if ('isOpen' in updates && !updates.isOpen) {
                    dataAbertura = null;
                }
                return { ...n, ...updates, dataAbertura };
            }
            return n;
        }));
    };

    const deleteNode = (id) => {
        // Find all descendants recursively to delete them or reassign them.
        // For simplicity, we delete all descendants.
        const idsToDelete = new Set([id]);
        
        let changed = true;
        while (changed) {
            changed = false;
            for (let n of nodes) {
                if (idsToDelete.has(n.parentId) && !idsToDelete.has(n.id)) {
                    idsToDelete.add(n.id);
                    changed = true;
                }
            }
        }
        
        setNodes(prev => prev.filter(n => !idsToDelete.has(n.id)));
    };

    const moveNode = (draggedId, targetParentId) => {
        // Prevent cyclic dependencies
        if (draggedId === targetParentId) return;

        let currentId = targetParentId;
        while (currentId) {
            if (currentId === draggedId) {
                alert("Operação inválida: Você não pode mover um líder para debaixo de seu próprio liderado.");
                return;
            }
            const parent = nodes.find(n => n.id === currentId);
            currentId = parent ? parent.parentId : null;
        }

        setNodes(prev => prev.map(n => n.id === draggedId ? { ...n, parentId: targetParentId } : n));
    };

    return (
        <OrgContext.Provider value={{ nodes, addNode, updateNode, deleteNode, moveNode }}>
            {children}
        </OrgContext.Provider>
    );
}
