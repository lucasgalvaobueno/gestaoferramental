import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useOrg } from '../contexts/OrgContext';
import {
    ArrowLeft, User, MessageCircle, Plus, Edit2,
    Trash2, Camera, ZoomIn, ZoomOut, X, Save,
    Users, Briefcase, Clock, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

/* ─── Card individual do organograma ─────────────────────── */
const OrgNode = ({ node, childrenNodes, onEdit, onAddChild, onView }) => {
    return (
        <li>
            <div className="org-node-wrapper">
                <div className={`org-card ${node.isOpen ? 'vaga-aberta' : ''}`} onClick={(e) => { e.stopPropagation(); onView(node); }} style={{ cursor: 'pointer' }}>
                    {/* Ações no canto superior direito */}
                    <div className="org-card-actions">
                        {node.observacao && (
                            <div className="org-card-bubble" title={node.observacao}>
                                <MessageCircle size={16} />
                                <span className="tooltip">{node.observacao}</span>
                            </div>
                        )}
                        <button
                            className="btn-edit-node"
                            onClick={e => { e.stopPropagation(); onEdit(node); }}
                            title="Editar colaborador"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>

                    <div className="org-card-avatar">
                        {node.avatarUrl
                            ? <img src={node.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : <User size={24} />}
                    </div>

                    <div className="org-card-content">
                        <h3 className="org-card-title">
                            {node.isOpen ? 'VAGA EM ABERTO' : (node.nome || 'Sem Nome')}
                        </h3>
                        <div className="org-card-role">{node.cargo}</div>
                        {!node.isOpen && node.funcao && (
                            <div className="org-card-function">{node.funcao}</div>
                        )}
                        {!node.isOpen && (
                            <div style={{
                                fontSize: '0.7rem', marginTop: '0.5rem',
                                color: '#FFFFFF', borderTop: '1px solid rgba(255,255,255,0.2)',
                                paddingTop: '0.5rem', width: '100%'
                            }}>
                                <strong>Mat:</strong> {node.matricula || '-'} &bull; <strong>Vaga:</strong> {node.numeroVaga || '-'}
                            </div>
                        )}
                        {/* Badge de área */}
                        {node.area && (
                            <div className="org-card-area-badge">{node.area}</div>
                        )}
                    </div>
                </div>

                {/* Botão de adicionar liderado */}
                <div className="node-connector-add">
                    <button
                        className="add-node-btn"
                        onClick={e => { e.stopPropagation(); onAddChild(node.id); }}
                        title="Adicionar Liderado"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* Filhos renderizados lado a lado pelo CSS clássico de árvore */}
            {childrenNodes.length > 0 && (
                <ul>
                    {childrenNodes.map(child => (
                        <OrgNode
                            key={child.id}
                            node={child}
                            childrenNodes={child.children}
                            onEdit={onEdit}
                            onAddChild={onAddChild}
                            onView={onView}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

/* ─── Página principal ────────────────────────────────────── */
export default function Organograma() {
    const { employees: nodes, addEmployee: addNode, updateEmployee: updateNode, deleteEmployee: deleteNode } = useOrg();

    const [editingNode, setEditingNode] = useState(null);
    const [viewingNode, setViewingNode] = useState(null);
    const [nodeToDelete, setNodeToDelete] = useState(null);
    const [formData, setFormData]       = useState({});
    const [scale, setScale]             = useState(1);
    const fileInputRef                  = useRef(null);

    const handleZoomIn  = () => setScale(p => Math.min(p + 0.1, 2));
    const handleZoomOut = () => setScale(p => Math.max(p - 0.1, 0.3));

    /* Constrói a árvore a partir da lista plana */
    const tree = useMemo(() => {
        const map = {};
        const roots = [];
        nodes.forEach(n => { map[n.id] = { ...n, children: [] }; });
        nodes.forEach(n => {
            if (n.parentId && map[n.parentId]) {
                map[n.parentId].children.push(map[n.id]);
            } else {
                roots.push(map[n.id]);
            }
        });
        return roots;
    }, [nodes]);

    /* Resumo estatístico */
    const stats = useMemo(() => {
        const ativos   = nodes.filter(n => !n.isOpen);
        const abertos  = nodes.filter(n =>  n.isOpen);

        const porArea = {};
        ativos.forEach(n => {
            const a = n.area?.trim() || 'Não informada';
            porArea[a] = (porArea[a] || 0) + 1;
        });

        const porEscala = {};
        ativos.forEach(n => {
            const e = n.escala?.trim() || 'Não informado';
            porEscala[e] = (porEscala[e] || 0) + 1;
        });

        return {
            total:     nodes.length,
            ativos:    ativos.length,
            abertos:   abertos.length,
            porArea:   Object.entries(porArea).sort((a, b) => b[1] - a[1]),
            porEscala: Object.entries(porEscala).sort((a, b) => b[1] - a[1]),
        };
    }, [nodes]);

    const [statsExpanded, setStatsExpanded] = useState(false);

    // Drag to scroll logic
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    const handleMouseDown = (e) => {
        if (e.target.closest('button') || e.target.closest('.org-card-actions')) return;
        setIsDragging(true);
        setStartX(e.pageX - containerRef.current.offsetLeft);
        setStartY(e.pageY - containerRef.current.offsetTop);
        setScrollLeft(containerRef.current.scrollLeft);
        setScrollTop(containerRef.current.scrollTop);
        containerRef.current.style.cursor = 'grabbing';
        containerRef.current.style.userSelect = 'none';
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        if(containerRef.current) {
            containerRef.current.style.cursor = 'grab';
            containerRef.current.style.userSelect = 'auto';
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if(containerRef.current) {
            containerRef.current.style.cursor = 'grab';
            containerRef.current.style.userSelect = 'auto';
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        const y = e.pageY - containerRef.current.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        containerRef.current.scrollLeft = scrollLeft - walkX;
        containerRef.current.scrollTop = scrollTop - walkY;
    };

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handleWheel = (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                setScale(p => Math.min(p + 0.1, 2));
            } else {
                setScale(p => Math.max(p - 0.1, 0.3));
            }
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

    /* Pais válidos (sem ciclos) */
    const getValidParents = nodeId => {
        const invalid = new Set([nodeId]);
        let changed = true;
        while (changed) {
            changed = false;
            for (const n of nodes) {
                if (invalid.has(n.parentId) && !invalid.has(n.id)) {
                    invalid.add(n.id);
                    changed = true;
                }
            }
        }
        return nodes.filter(n => !invalid.has(n.id));
    };

    /* Abre o modal de edição */
    const handleEdit = node => {
        setFormData({ ...node });
        setEditingNode(node);
    };

    /* Salva alterações */
    const handleSaveEdit = () => {
        if (!formData?.id) return;
        if (formData.parentId !== editingNode.parentId) {
            updateNode(formData.id, { parentId: formData.parentId });
        }
        updateNode(formData.id, {
            ...formData,
            parentId: formData.parentId || null,
            children: editingNode.children || []
        });
        setEditingNode(null);
    };

    /* Confirma exclusão */
    const confirmDelete = () => {
        if (nodeToDelete) {
            deleteNode(nodeToDelete.id);
            setNodeToDelete(null);
            setEditingNode(null);
        }
    };

    /* Upload de foto */
    const handlePhotoUpload = e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('Imagem deve ter no máximo 2 MB.'); return; }
        const reader = new FileReader();
        reader.onloadend = () => setFormData(prev => ({ ...prev, avatarUrl: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleAddChild = (parentId) => {
        addNode({
            parentId: parentId,
            nome: '',
            cargo: '',
            area: '',
            isOpen: true
        });
    };

    const field = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'Organograma' }]} />

            <div className="container animate-fade-in" style={{ maxWidth: '1600px', width: '95%' }}>
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/gestao-ferramental" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Estrutura Hierárquica</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-secondary" onClick={handleZoomOut} title="Diminuir zoom"><ZoomOut size={18} /></button>
                        <span style={{ minWidth: 54, textAlign: 'center', fontWeight: 700 }}>{Math.round(scale * 100)}%</span>
                        <button className="btn btn-secondary" onClick={handleZoomIn} title="Aumentar zoom"><ZoomIn size={18} /></button>
                    </div>
                </div>

                {/* ── Painel de Resumo ── */}
                <div className="org-stats-panel">
                    {/* Cards principais */}
                    <div className="org-stats-row">
                        <div className="org-stat-card org-stat-blue">
                            <div className="org-stat-icon"><Users size={22} /></div>
                            <div className="org-stat-info">
                                <span className="org-stat-value">{stats.total}</span>
                                <span className="org-stat-label">Total no Organograma</span>
                            </div>
                        </div>
                        <div className="org-stat-card org-stat-green">
                            <div className="org-stat-icon"><User size={22} /></div>
                            <div className="org-stat-info">
                                <span className="org-stat-value">{stats.ativos}</span>
                                <span className="org-stat-label">Colaboradores Ativos</span>
                            </div>
                        </div>
                        <div className="org-stat-card org-stat-orange">
                            <div className="org-stat-icon"><AlertCircle size={22} /></div>
                            <div className="org-stat-info">
                                <span className="org-stat-value">{stats.abertos}</span>
                                <span className="org-stat-label">Vagas em Aberto</span>
                            </div>
                        </div>
                        <button
                            className="org-stats-toggle"
                            onClick={() => setStatsExpanded(p => !p)}
                            title={statsExpanded ? 'Recolher detalhes' : 'Ver detalhes'}
                        >
                            {statsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            <span>{statsExpanded ? 'Recolher' : 'Detalhes'}</span>
                        </button>
                    </div>

                    {/* Tabelas detalhadas (expansível) */}
                    {statsExpanded && (
                        <div className="org-stats-detail">
                            {/* Por Área */}
                            <div className="org-stats-table-wrap">
                                <div className="org-stats-table-title">
                                    <Briefcase size={15} /> Colaboradores por Área
                                </div>
                                <table className="org-stats-table">
                                    <thead>
                                        <tr><th>Área</th><th>Qtd</th><th>%</th></tr>
                                    </thead>
                                    <tbody>
                                        {stats.porArea.map(([area, qtd]) => (
                                            <tr key={area}>
                                                <td>{area}</td>
                                                <td><strong>{qtd}</strong></td>
                                                <td>
                                                    <div className="org-stats-bar-wrap">
                                                        <div
                                                            className="org-stats-bar"
                                                            style={{ width: `${Math.round((qtd / stats.ativos) * 100)}%` }}
                                                        />
                                                        <span>{Math.round((qtd / stats.ativos) * 100)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Por Escala */}
                            <div className="org-stats-table-wrap">
                                <div className="org-stats-table-title">
                                    <Clock size={15} /> Colaboradores por Escala
                                </div>
                                <table className="org-stats-table">
                                    <thead>
                                        <tr><th>Escala</th><th>Qtd</th><th>%</th></tr>
                                    </thead>
                                    <tbody>
                                        {stats.porEscala.map(([escala, qtd]) => (
                                            <tr key={escala}>
                                                <td>{escala}</td>
                                                <td><strong>{qtd}</strong></td>
                                                <td>
                                                    <div className="org-stats-bar-wrap">
                                                        <div
                                                            className="org-stats-bar org-stats-bar-teal"
                                                            style={{ width: `${Math.round((qtd / stats.ativos) * 100)}%` }}
                                                        />
                                                        <span>{Math.round((qtd / stats.ativos) * 100)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Árvore */}
                <div 
                    className="tree-container" 
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{ overflow: 'auto', maxHeight: '75vh', cursor: 'grab' }}
                >
                    <div className="tree" style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}>
                        {tree.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>O organograma está vazio.</p>
                                <button className="btn btn-primary flex items-center gap-2" onClick={() => handleAddChild(null)}>
                                    <Plus size={18} /> Adicionar Primeiro Colaborador
                                </button>
                            </div>
                        ) : (
                            <ul>
                                {tree.map(root => (
                                    <OrgNode
                                        key={root.id}
                                        node={root}
                                        childrenNodes={root.children}
                                        onEdit={handleEdit}
                                        onAddChild={handleAddChild}
                                        onView={setViewingNode}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modal de Edição ── */}
            {editingNode && (
                <div className="modal-overlay" style={{ opacity: 1, visibility: 'visible' }}>
                    <div className="modal animate-scale">
                        {/* Header */}
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'var(--primary-color)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Edit2 size={16} color="white" />
                                </div>
                                <h3 style={{ margin: 0 }}>Editar Colaborador</h3>
                            </div>
                            <button className="btn btn-icon" onClick={() => setEditingNode(null)}>
                                <X size={22} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">

                            {/* Foto + vaga aberta */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%',
                                    background: 'var(--background-color)',
                                    border: '3px solid var(--primary-color)',
                                    overflow: 'hidden', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {formData.avatarUrl
                                        ? <img src={formData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <User size={36} color="var(--text-secondary)" />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <Camera size={16} /> Alterar Foto
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handlePhotoUpload}
                                        />
                                    </label>
                                    {formData.avatarUrl && (
                                        <button className="btn btn-secondary" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}
                                            onClick={() => field('avatarUrl', '')}>
                                            Remover foto
                                        </button>
                                    )}
                                </div>
                                <div style={{ marginLeft: 'auto' }} className="checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        id="vagaAberta"
                                        checked={!!formData.isOpen}
                                        onChange={e => field('isOpen', e.target.checked)}
                                    />
                                    <label htmlFor="vagaAberta" style={{ color: 'var(--danger-color)', fontWeight: 700, fontSize: '0.875rem' }}>
                                        Vaga em Aberto
                                    </label>
                                </div>
                            </div>

                            {/* Líder direto */}
                            <div className="form-group">
                                <label>Líder Direto (Reporta a)</label>
                                <select
                                    className="form-control"
                                    value={formData.parentId || ''}
                                    onChange={e => field('parentId', e.target.value || null)}
                                >
                                    <option value="">[Nenhum — CEO / Topo]</option>
                                    {getValidParents(formData.id).map(n => (
                                        <option key={n.id} value={n.id}>
                                            {n.nome || 'Vaga em Aberto'} — {n.cargo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Nome + Matrícula (só se não for vaga aberta) */}
                            {!formData.isOpen && (
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nome Completo</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.nome || ''}
                                            onChange={e => field('nome', e.target.value)}
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Matrícula</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.matricula || ''}
                                            onChange={e => field('matricula', e.target.value)}
                                            placeholder="Ex: 10001"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Cargo + Função */}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Cargo</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.cargo || ''}
                                        onChange={e => field('cargo', e.target.value)}
                                        placeholder="Ex: Gerente de Produção"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Função</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.funcao || ''}
                                        onChange={e => field('funcao', e.target.value)}
                                        placeholder="Ex: COO"
                                    />
                                </div>
                            </div>

                            {/* Área + Número da Vaga */}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Área / Departamento</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.area || ''}
                                        onChange={e => field('area', e.target.value)}
                                        placeholder="Ex: Produção, Comercial"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Número da Vaga</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.numeroVaga || ''}
                                        onChange={e => field('numeroVaga', e.target.value)}
                                        placeholder="Ex: 005"
                                    />
                                </div>
                            </div>

                            {/* Turno + Escala */}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Turno</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.turno || ''}
                                        onChange={e => field('turno', e.target.value)}
                                        placeholder="Ex: Administrativo"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Escala</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.escala || ''}
                                        onChange={e => field('escala', e.target.value)}
                                        placeholder="Ex: 5x2"
                                    />
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="form-group">
                                <label>Observações</label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    value={formData.observacao || ''}
                                    onChange={e => field('observacao', e.target.value)}
                                    placeholder="Anotações sobre a vaga ou pessoa."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
                            <button
                                type="button"
                                className="btn"
                                style={{ color: 'var(--danger-color)', background: 'transparent' }}
                                onClick={() => setNodeToDelete(formData)}
                            >
                                <Trash2 size={16} /> Excluir
                            </button>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingNode(null)}>
                                    Cancelar
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
                                    <Save size={16} /> Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal de Visualização de Detalhes ── */}
            {viewingNode && (
                <div className="modal-overlay" style={{ opacity: 1, visibility: 'visible', zIndex: 1000 }} onClick={() => setViewingNode(null)}>
                    <div className="modal animate-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'var(--primary-color)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <User size={16} color="white" />
                                </div>
                                <h3 style={{ margin: 0 }}>Detalhes do Colaborador</h3>
                            </div>
                            <button className="btn btn-icon" onClick={() => setViewingNode(null)}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
                            {/* Card de Resumo Principal */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--background-color)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {viewingNode.avatarUrl ? <img src={viewingNode.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={28} color="var(--text-secondary)" />}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.25rem' }}>{viewingNode.isOpen ? 'Vaga em Aberto' : viewingNode.nome}</h4>
                                    <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>{viewingNode.cargo} {viewingNode.funcao ? `- ${viewingNode.funcao}` : ''}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{viewingNode.area || 'Área não informada'}</div>
                                </div>
                            </div>

                            {/* Detalhes de Cadastro */}
                            <div>
                                <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>Informações de Cadastro</h5>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <div><strong>Matrícula:</strong> {viewingNode.matricula || '-'}</div>
                                    <div><strong>Nº Vaga:</strong> {viewingNode.numeroVaga || '-'}</div>
                                    <div><strong>Turno:</strong> {viewingNode.turno || '-'}</div>
                                    <div><strong>Escala:</strong> {viewingNode.escala || '-'}</div>
                                </div>
                                {viewingNode.observacao && (
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', background: 'var(--background-color)', padding: '0.5rem', borderRadius: '4px' }}>
                                        <strong>Observações:</strong> {viewingNode.observacao}
                                    </div>
                                )}
                            </div>

                            {/* Superior */}
                            <div>
                                <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>Superior (Reporta a)</h5>
                                {(() => {
                                    const superior = nodes.find(n => n.id === viewingNode.parentId);
                                    if (!superior) return <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>[Nenhum — Nível Topo]</div>;
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ccc', overflow: 'hidden' }}>
                                                {superior.avatarUrl ? <img src={superior.avatarUrl} alt="" style={{width:'100%', height:'100%', objectFit: 'cover'}} /> : <User size={12} style={{margin: '6px'}}/>}
                                            </div>
                                            <strong>{superior.isOpen ? 'Vaga em Aberto' : superior.nome}</strong> - {superior.cargo}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Equipe (Liderados) */}
                            <div>
                                {(() => {
                                    const liderados = nodes.filter(n => n.parentId === viewingNode.id);
                                    return (
                                        <>
                                            <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>
                                                Equipe Direta ({liderados.length} pessoas)
                                            </h5>
                                            {liderados.length === 0 ? (
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nenhum liderado direto.</div>
                                            ) : (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    {liderados.map(l => (
                                                        <li key={l.id} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ccc', overflow: 'hidden' }}>
                                                                {l.avatarUrl ? <img src={l.avatarUrl} alt="" style={{width:'100%', height:'100%', objectFit: 'cover'}} /> : <User size={12} style={{margin: '6px'}}/>}
                                                            </div>
                                                            <span><strong>{l.isOpen ? 'Vaga em Aberto' : l.nome}</strong> - {l.cargo}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Pares */}
                            <div>
                                {(() => {
                                    if (!viewingNode.parentId) return null;
                                    const pares = nodes.filter(n => n.parentId === viewingNode.parentId && n.id !== viewingNode.id);
                                    return (
                                        <>
                                            <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>
                                                Trabalham Junto ({pares.length} pares)
                                            </h5>
                                            {pares.length === 0 ? (
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nenhum par direto.</div>
                                            ) : (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    {pares.map(p => (
                                                        <li key={p.id} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ccc', overflow: 'hidden' }}>
                                                                {p.avatarUrl ? <img src={p.avatarUrl} alt="" style={{width:'100%', height:'100%', objectFit: 'cover'}} /> : <User size={12} style={{margin: '6px'}}/>}
                                                            </div>
                                                            <span><strong>{p.isOpen ? 'Vaga em Aberto' : p.nome}</strong> - {p.cargo}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal de Confirmação de Exclusão ── */}
            {nodeToDelete && (
                <div className="modal-overlay active" style={{ zIndex: 1100, padding: '1rem' }}>
                    <div className="modal-content animate-scale" style={{ maxWidth: '400px', width: '100%' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="m-0 text-danger flex items-center gap-2"><AlertCircle size={20} /> Confirmar Exclusão</h3>
                            <button className="btn btn-icon" onClick={() => setNodeToDelete(null)}><X size={20} /></button>
                        </div>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-color)' }}>
                            Tem certeza que deseja excluir <strong>{nodeToDelete.isOpen ? 'Vaga em Aberto' : (nodeToDelete.nome || 'Colaborador')}</strong> e <strong>todos os seus subordinados diretos e indiretos</strong>? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button className="btn btn-secondary" onClick={() => setNodeToDelete(null)}>Cancelar</button>
                            <button className="btn" style={{ background: 'var(--danger-color)', color: '#fff' }} onClick={confirmDelete}>
                                <Trash2 size={16} /> Excluir Definitivamente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
