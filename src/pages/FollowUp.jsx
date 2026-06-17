import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useFollowUp } from '../contexts/FollowUpContext';
import { useAssets } from '../contexts/AssetContext';
import { formatarMoeda, formatarData } from '../utils/calculations';
import { ArrowLeft, Plus, X, Search, AlertCircle, Edit, History, User, CheckCircle2, Trash2, ChevronDown, ChevronUp, ArrowDown, ArrowUp, LayoutGrid, List, Filter, ZoomIn, ZoomOut } from 'lucide-react';

const TOP_10_CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD', 'BRL'];
const STATUS_OPTIONS = ["Ag. aprovação da RC", "Ag. pedido de compras", "Ag. Chegada", "Em atraso", "Cancelado", "Concluído"];

export default function FollowUp() {
    const { requisitions, addRequisition, updateRequisition, deleteRequisition, reqLogs } = useFollowUp();
    const { assets } = useAssets();
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAlertList, setShowAlertList] = useState(false);
    const [currentReq, setCurrentReq] = useState(null);
    const [reqToDelete, setReqToDelete] = useState(null);
    const [historySortOrder, setHistorySortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Zoom and Drag States
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    // Zoom / Drag Handlers
    const handleZoomIn  = () => setScale(p => Math.min(p + 0.1, 2));
    const handleZoomOut = () => setScale(p => Math.max(p - 0.1, 0.3));

    const handleMouseDown = (e) => {
        if (e.target.closest('button') || e.target.closest('.kanban-card')) return;
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

    useEffect(() => {
        const el = containerRef.current;
        if (!el || viewMode !== 'kanban') return;
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
    }, [viewMode]);

    // Add Form States
    const [formNumeroRC, setFormNumeroRC] = useState('');
    const [formDescricao, setFormDescricao] = useState('');
    const [formOrcamentos, setFormOrcamentos] = useState([{ id: Date.now(), fornecedor: '', detalhe: '' }]);
    const [formPossuiImob, setFormPossuiImob] = useState('nao');
    const [formImobilizados, setFormImobilizados] = useState([{ id: Date.now(), numero: '', asset: null, error: '' }]);
    const [formValorOriginal, setFormValorOriginal] = useState('');
    const [formMoeda, setFormMoeda] = useState('USD');
    const [formCambio, setFormCambio] = useState('');
    const [formStatus, setFormStatus] = useState(STATUS_OPTIONS[0]);
    const [formDataCriacao, setFormDataCriacao] = useState(new Date().toISOString().split('T')[0]);
    const [formDataEmissao, setFormDataEmissao] = useState('');
    const [formNumPedido, setFormNumPedido] = useState('');
    const [formPrevisao, setFormPrevisao] = useState('');
    const [formApplyTax, setFormApplyTax] = useState(true);
    const [formPedidoEmitido, setFormPedidoEmitido] = useState(false);

    // Edit Form States
    const [editNumeroRC, setEditNumeroRC] = useState('');
    const [editDataEmissao, setEditDataEmissao] = useState('');
    const [editNumPedido, setEditNumPedido] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editObservacao, setEditObservacao] = useState('');
    const [editPrevisao, setEditPrevisao] = useState('');

    // Auto-update 'Em atraso' based on date
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        requisitions.forEach(req => {
            if (req.status === 'Ag. Chegada' && req.previsaoChegada && req.previsaoChegada < today) {
                updateRequisition(req.id, { status: 'Em atraso' }, 'Status alterado automaticamente por vencimento da previsão');
            }
        });
    }, [requisitions, updateRequisition]);

    const valorTotalReais = useMemo(() => {
        const v = parseFloat(formValorOriginal) || 0;
        const c = parseFloat(formCambio) || 1;
        const base = v * c;
        return formApplyTax ? base * 1.40 : base;
    }, [formValorOriginal, formCambio, formApplyTax]);

    const handleImobChange = (index, value) => {
        const newImobs = [...formImobilizados];
        newImobs[index].numero = value;
        const found = assets.find(a => a.numeroImobilizado === value);
        if (value && !found) {
            newImobs[index].error = 'Ativo não encontrado';
            newImobs[index].asset = null;
        } else {
            newImobs[index].error = '';
            newImobs[index].asset = found || null;
        }
        setFormImobilizados(newImobs);
    };

    const handleSaveNew = (e) => {
        e.preventDefault();
        
        // Validation
        let derivedCapexId = null;

        if (formPossuiImob === 'sim') {
            if (formImobilizados.some(i => i.error || !i.numero)) {
                alert('Corrija os erros nos campos de imobilizado antes de salvar.');
                return;
            }

            const capexIds = formImobilizados.map(i => i.asset?.capexId).filter(Boolean);
            if (capexIds.length > 0) {
                const uniqueCapexIds = [...new Set(capexIds)];
                if (uniqueCapexIds.length > 1) {
                    alert('Todos os imobilizados de uma mesma requisição devem pertencer à MESMA Linha de Investimento CAPEX.');
                    return;
                }
                derivedCapexId = uniqueCapexIds[0];
            } else {
                alert('Nenhum dos imobilizados inseridos possui uma Linha de Investimento CAPEX atrelada. Verifique o cadastro do ativo.');
                return;
            }
        }

        if (!formNumeroRC) {
            alert('O número da RC é obrigatório.');
            return;
        }

        const newReq = {
            numeroRC: formNumeroRC,
            descricao: formDescricao,
            orcamentos: formOrcamentos,
            possuiImobilizado: formPossuiImob === 'sim',
            imobilizados: formPossuiImob === 'sim' ? formImobilizados.map(i => ({ numero: i.numero, descricao: i.asset.descricao, area: i.asset.areaCorrespondente })) : [],
            capexId: derivedCapexId,
            valorOriginal: parseFloat(formValorOriginal),
            moeda: formMoeda,
            cambio: parseFloat(formCambio),
            valorTotalReais,
            status: formStatus,
            dataCriacao: formDataCriacao,
            dataEmissaoPedido: formPedidoEmitido ? formDataEmissao : '',
            numeroPedido: formPedidoEmitido ? formNumPedido : '',
            previsaoChegada: formPedidoEmitido ? formPrevisao : '',
        };

        addRequisition(newReq);
        setShowAddModal(false);
        resetForm();
    };

    const resetForm = () => {
        setFormNumeroRC('');
        setFormDescricao('');
        setFormOrcamentos([{ id: Date.now(), fornecedor: '', detalhe: '' }]);
        setFormPossuiImob('nao');
        setFormImobilizados([{ id: Date.now(), numero: '', asset: null, error: '' }]);
        setFormValorOriginal('');
        setFormMoeda('USD');
        setFormCambio('');
        setFormStatus(STATUS_OPTIONS[0]);
        setFormDataCriacao(new Date().toISOString().split('T')[0]);
        setFormDataEmissao('');
        setFormNumPedido('');
        setFormPrevisao('');
        setFormApplyTax(true);
        setFormPedidoEmitido(false);
    };

    const openEdit = (req) => {
        setCurrentReq(req);
        setEditNumeroRC(req.numeroRC || '');
        setEditDataEmissao(req.dataEmissaoPedido || '');
        setEditNumPedido(req.numeroPedido || '');
        setEditPrevisao(req.previsaoChegada || '');
        setEditStatus(req.status || '');
        setEditObservacao('');
        setShowEditModal(true);
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        const updates = {
            numeroRC: editNumeroRC,
            dataEmissaoPedido: editDataEmissao,
            numeroPedido: editNumPedido,
            previsaoChegada: editPrevisao,
            status: editStatus
        };
        
        let logMsg = `Atualização de status para ${editStatus}`;
        if (currentReq.previsaoChegada !== editPrevisao) {
            const oldPrev = currentReq.previsaoChegada ? new Date(currentReq.previsaoChegada).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '(Vazio)';
            const newPrev = editPrevisao ? new Date(editPrevisao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '(Vazio)';
            logMsg += `\n• Previsão: de ${oldPrev} para ${newPrev}`;
        }

        updateRequisition(currentReq.id, updates, logMsg, editObservacao);
        setShowEditModal(false);
    };

    const handleDeleteClick = (req, e) => {
        e.stopPropagation();
        setReqToDelete(req);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (reqToDelete) {
            deleteRequisition(reqToDelete.id);
            setShowDeleteModal(false);
            setReqToDelete(null);
        }
    };

    // Alerts logic
    const alerts = useMemo(() => {
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        return requisitions.filter(r => {
            if (r.status === 'Concluído' || r.status === 'Cancelado') return false;
            if (r.lastUpdateDate < sevenDaysAgo) return true;
            return false;
        });
    }, [requisitions]);

    const filteredReqs = useMemo(() => {
        return requisitions.filter(r => {
            if (filterStatus && r.status !== filterStatus) return false;
            if (filterSearch) {
                const term = filterSearch.toLowerCase();
                const matchDesc = r.descricao.toLowerCase().includes(term);
                const matchRC = (r.numeroRC || '').toLowerCase().includes(term);
                const matchForn = r.orcamentos.some(o => o.fornecedor.toLowerCase().includes(term));
                const matchPed = (r.numeroPedido || '').toLowerCase().includes(term);
                if (!matchDesc && !matchForn && !matchPed && !matchRC) return false;
            }
            return true;
        });
    }, [requisitions, filterStatus, filterSearch]);

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'Follow-Up' }]} />
            <div className="container animate-fade-in">
                
                {/* Alerts Banner */}
                {alerts.length > 0 && (
                    <div style={{ backgroundColor: 'var(--danger-color)', color: 'white', padding: '1rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
                        <div className="flex items-center justify-between" style={{ cursor: 'pointer' }} onClick={() => setShowAlertList(!showAlertList)}>
                            <div className="flex items-center gap-4">
                                <AlertCircle size={24} />
                                <div>
                                    <h4 style={{ color: 'white', margin: 0 }}>Atenção Necessária</h4>
                                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Há {alerts.length} item(ns) sem atualização há mais de 7 dias. Clique para {showAlertList ? 'recolher' : 'ver detalhes'}.</p>
                                </div>
                            </div>
                            <button className="btn btn-icon text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                {showAlertList ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                        {showAlertList && (
                            <div className="mt-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--border-radius-sm)' }}>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {alerts.map(r => (
                                        <li 
                                            key={r.id} 
                                            style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
                                            onClick={() => { openEdit(r); setShowAlertList(false); }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <div>
                                                <strong style={{ color: 'white' }}>{r.numeroRC}</strong> - {r.descricao}
                                            </div>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.9, backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                ⏳ Sem atualização há mais de 7 dias
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/gestao-ferramental" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Follow-up de Requisições de Compras</h2>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary flex items-center gap-2" onClick={() => setViewMode(v => v === 'list' ? 'kanban' : 'list')}>
                            {viewMode === 'list' ? <><LayoutGrid size={18} /> Ver em Kanban</> : <><List size={18} /> Ver em Lista</>}
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} /> Adicionar Requisição
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <button className="btn btn-secondary flex items-center gap-2" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={16} /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                    <div className="flex items-center gap-4">
                        {viewMode === 'kanban' && (
                            <div className="flex items-center gap-2" style={{ background: 'var(--surface-color)', padding: '0.2rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
                                <button className="btn btn-icon" style={{ padding: '0.2rem' }} onClick={handleZoomOut} title="Diminuir zoom"><ZoomOut size={16} /></button>
                                <span style={{ minWidth: 45, textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{Math.round(scale * 100)}%</span>
                                <button className="btn btn-icon" style={{ padding: '0.2rem' }} onClick={handleZoomIn} title="Aumentar zoom"><ZoomIn size={16} /></button>
                            </div>
                        )}
                        {(filterSearch || filterStatus) && (
                            <span className="badge flex items-center gap-2" style={{ backgroundColor: 'var(--primary-color)', color: 'white', fontSize: '0.75rem' }}>
                                Filtros Ativos
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }} onClick={() => { setFilterSearch(''); setFilterStatus(''); }}>
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                    </div>
                </div>

                {showFilters && (
                    <div className="card mb-4 animate-fade-in" style={{ padding: '1rem' }}>
                        <div className="flex gap-4 items-center flex-wrap">
                            <div className="form-group" style={{ marginBottom: 0, flex: 2, minWidth: '250px' }}>
                                <div className="flex items-center" style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
                                    <input type="text" className="form-control" style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.85rem' }} value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Buscar Descrição, Fornecedor ou Nº Pedido..." />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status:</span>
                                    <select className="form-control" style={{ fontSize: '0.85rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                        <option value="">Todos</option>
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'list' ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nº RC</th>
                                    <th>Nº Pedido</th>
                                    <th>Descrição</th>
                                    <th>Fornecedor Principal</th>
                                    <th>Valor Final (R$)</th>
                                    <th>Status</th>
                                    <th>Previsão</th>
                                    <th>Última Atualização</th>
                                    <th className="text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReqs.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center" style={{color: 'var(--text-secondary)'}}>Nenhuma requisição encontrada.</td></tr>
                                ) : (
                                    filteredReqs.map(req => (
                                        <tr key={req.id} onClick={() => openEdit(req)} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: 600 }}>{req.numeroRC}</td>
                                            <td>{req.numeroPedido || '-'}</td>
                                            <td>{req.descricao}</td>
                                            <td>{req.orcamentos[0]?.fornecedor || '-'}</td>
                                            <td style={{fontWeight: '600'}}>{formatarMoeda(req.valorTotalReais)}</td>
                                            <td>
                                                <span className={`badge ${req.status === 'Em atraso' || req.status === 'Cancelado' ? 'badge-danger' : req.status === 'Concluído' ? 'badge-success' : 'badge-warning'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>{formatarData(req.previsaoChegada)}</td>
                                            <td style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>{new Date(req.lastUpdateDate).toLocaleDateString('pt-BR')}</td>
                                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    className="btn btn-icon text-danger" 
                                                    onClick={(e) => handleDeleteClick(req, e)}
                                                    title="Excluir Requisição"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div 
                        className="kanban-board"
                        ref={containerRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        style={{ cursor: 'grab', maxHeight: '75vh', overflow: 'auto' }}
                    >
                        <div style={{ display: 'flex', gap: '1rem', transform: `scale(${scale})`, transformOrigin: 'top left', transition: 'transform 0.1s ease-out', minWidth: 'min-content' }}>
                            {STATUS_OPTIONS.map(status => {
                                const reqsInStatus = filteredReqs.filter(r => r.status === status);
                                return (
                                    <div key={status} className="kanban-column">
                                        <div className={`kanban-header kanban-header-${status.replace(/ /g, '-').replace(/\./g, '')}`}>
                                            {status} <span className="kanban-count">{reqsInStatus.length}</span>
                                        </div>
                                        <div className="kanban-cards">
                                            {reqsInStatus.map(req => (
                                                <div key={req.id} className="kanban-card" onClick={() => openEdit(req)}>
                                                    <div className="kanban-card-top">
                                                        <strong>{req.numeroRC}</strong>
                                                        {req.numeroPedido && <span className="kanban-card-pedido">Ped: {req.numeroPedido}</span>}
                                                    </div>
                                                    <div className="kanban-card-desc">{req.descricao}</div>
                                                    <div className="kanban-card-footer">
                                                        <span>{req.orcamentos[0]?.fornecedor || 'S/ Forn'}</span>
                                                        <strong>{formatarMoeda(req.valorTotalReais)}</strong>
                                                    </div>
                                                </div>
                                            ))}
                                            {reqsInStatus.length === 0 && (
                                                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem', padding: '2rem 0', opacity: 0.7 }}>
                                                    Nenhuma requisição
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Add Requisição */}
            <div className={`modal-overlay ${showAddModal ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '800px' }}>
                    <div className="modal-header">
                        <h2 className="modal-title">Nova Requisição de Compra</h2>
                        <button className="modal-close" onClick={() => setShowAddModal(false)}><X /></button>
                    </div>
                    <form onSubmit={handleSaveNew}>
                        <div className="flex gap-4">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Nº da RC</label>
                                <input type="text" required className="form-control" value={formNumeroRC} onChange={e => setFormNumeroRC(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ flex: 3 }}>
                                <label>Descrição da Requisição</label>
                                <input type="text" required className="form-control" value={formDescricao} onChange={e => setFormDescricao(e.target.value)} />
                            </div>
                        </div>
                        
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem' }}>
                            <div className="flex justify-between items-center mb-2">
                                <label style={{ margin: 0 }}>Orçamentos</label>
                                <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setFormOrcamentos([...formOrcamentos, { id: Date.now(), fornecedor: '', detalhe: '' }])}>
                                    <Plus size={14} /> Adicionar
                                </button>
                            </div>
                            {formOrcamentos.map((orc, index) => (
                                <div key={orc.id} className="flex gap-2 mb-2">
                                    <input type="text" required className="form-control" style={{ flex: 1 }} placeholder="Orçamento / Detalhe" value={orc.detalhe} onChange={e => { const n = [...formOrcamentos]; n[index].detalhe = e.target.value; setFormOrcamentos(n); }} />
                                    <input type="text" required className="form-control" style={{ flex: 1 }} placeholder="Nome do Fornecedor" value={orc.fornecedor} onChange={e => { const n = [...formOrcamentos]; n[index].fornecedor = e.target.value; setFormOrcamentos(n); }} />
                                    {formOrcamentos.length > 1 && (
                                        <button type="button" className="btn btn-icon text-danger" onClick={() => setFormOrcamentos(formOrcamentos.filter(o => o.id !== orc.id))}><X size={18}/></button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="form-group">
                            <label>Possui imobilizado?</label>
                            <select className="form-control" value={formPossuiImob} onChange={e => setFormPossuiImob(e.target.value)}>
                                <option value="nao">Não</option>
                                <option value="sim">Sim</option>
                            </select>
                        </div>

                        {formPossuiImob === 'sim' && (
                            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem', backgroundColor: 'var(--background-color)' }}>
                                <div className="flex justify-between items-center mb-2">
                                    <label style={{ margin: 0 }}>Imobilizados Relacionados</label>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setFormImobilizados([...formImobilizados, { id: Date.now(), numero: '', asset: null, error: '' }])}>
                                        <Plus size={14} /> Adicionar
                                    </button>
                                </div>
                                {formImobilizados.map((imob, index) => (
                                    <div key={imob.id} className="flex flex-col gap-1 mb-3">
                                        <div className="flex gap-2">
                                            <input type="text" required className="form-control" style={{ flex: 1 }} placeholder="Nº do Imobilizado" value={imob.numero} onChange={e => handleImobChange(index, e.target.value)} />
                                            {formImobilizados.length > 1 && (
                                                <button type="button" className="btn btn-icon text-danger" onClick={() => setFormImobilizados(formImobilizados.filter(i => i.id !== imob.id))}><X size={18}/></button>
                                            )}
                                        </div>
                                        {imob.error && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{imob.error}</span>}
                                        {imob.asset && (
                                            <span style={{ color: 'var(--primary-color)', fontSize: '0.75rem' }}>
                                                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                {imob.asset.descricao} | Área: {imob.asset.areaCorrespondente}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-4 mb-4">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label>Valor (Moeda Original)</label>
                                <input type="number" step="0.01" required className="form-control" value={formValorOriginal} onChange={e => setFormValorOriginal(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label>Moeda</label>
                                <select className="form-control" value={formMoeda} onChange={e => setFormMoeda(e.target.value)}>
                                    {TOP_10_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label>Câmbio Considerado</label>
                                <input type="number" step="0.0001" required className="form-control" value={formCambio} onChange={e => setFormCambio(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ padding: '1rem', backgroundColor: 'rgba(179, 207, 229, 0.2)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Valor Total Estimado em Reais {formApplyTax && '(+40% de taxas)'}
                            </p>
                            <h3 style={{ margin: '0.5rem 0', color: 'var(--primary-hover)' }}>{formatarMoeda(valorTotalReais)}</h3>
                            <div className="checkbox-wrapper" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                                <input type="checkbox" id="check-tax" checked={formApplyTax} onChange={e => setFormApplyTax(e.target.checked)} />
                                <label htmlFor="check-tax">Considerar 40% de taxas e impostos</label>
                            </div>
                        </div>

                        <div className="flex gap-4 mb-4">
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label>Data Criação RC</label>
                                <input type="date" required className="form-control" value={formDataCriacao} onChange={e => setFormDataCriacao(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label>Status Inicial</label>
                                <select className="form-control" value={formStatus} onChange={e => setFormStatus(e.target.value)}>
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="checkbox-wrapper" style={{ marginBottom: '1rem' }}>
                            <input type="checkbox" id="check-pedido" checked={formPedidoEmitido} onChange={e => setFormPedidoEmitido(e.target.checked)} />
                            <label htmlFor="check-pedido" style={{ fontWeight: 600 }}>Pedido de Compras já emitido?</label>
                        </div>

                        {formPedidoEmitido && (
                            <div className="flex gap-4 mb-4">
                                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                    <label>Emissão do Pedido</label>
                                    <input type="date" required className="form-control" value={formDataEmissao} onChange={e => setFormDataEmissao(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                    <label>Nº Pedido de Compras</label>
                                    <input type="text" required className="form-control" value={formNumPedido} onChange={e => setFormNumPedido(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                    <label>Previsão de Chegada</label>
                                    <input type="date" required className="form-control" value={formPrevisao} onChange={e => setFormPrevisao(e.target.value)} />
                                </div>
                            </div>
                        )}

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Salvar Requisição</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal Edit / FollowUp */}
            <div className={`modal-overlay ${showEditModal ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '800px' }}>
                    <div className="modal-header">
                        <h2 className="modal-title">Detalhes da Requisição</h2>
                        <button className="modal-close" onClick={() => setShowEditModal(false)}><X /></button>
                    </div>
                    {currentReq && (
                        <div className="flex gap-8">
                            <div style={{ flex: 1 }}>
                                <div className="mb-4">
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Descrição</p>
                                    <p style={{ fontWeight: '600' }}>{currentReq.descricao}</p>
                                </div>
                                <form onSubmit={handleSaveEdit}>
                                    <div className="form-group">
                                        <label>Nº da RC</label>
                                        <input type="text" required className="form-control" value={editNumeroRC} onChange={e => setEditNumeroRC(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Data Emissão do Pedido</label>
                                        <input type="date" className="form-control" value={editDataEmissao} onChange={e => setEditDataEmissao(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Número do Pedido</label>
                                        <input type="text" className="form-control" value={editNumPedido} onChange={e => setEditNumPedido(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Previsão de Chegada</label>
                                        <input type="date" className="form-control" value={editPrevisao} onChange={e => setEditPrevisao(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Status Atual</label>
                                        <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Observação / Comentário (Opcional)</label>
                                        <textarea className="form-control" rows="3" value={editObservacao} onChange={e => setEditObservacao(e.target.value)} placeholder="Descreva a atualização..."></textarea>
                                    </div>
                                    <div className="modal-footer" style={{ marginTop: '1rem' }}>
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Fechar</button>
                                        <button type="submit" className="btn btn-primary">Atualizar Follow-Up</button>
                                    </div>
                                </form>
                            </div>
                            
                            <div style={{ flex: 1, borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="flex items-center gap-2 text-primary m-0"><History size={20} /> Histórico de Atualizações</h3>
                                    {reqLogs.filter(l => l.reqId === currentReq.id).length > 0 && (
                                        <button type="button" className="btn btn-secondary flex items-center gap-2" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setHistorySortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} title="Alternar entre mais recentes e mais antigos">
                                            {historySortOrder === 'desc' ? <><ArrowDown size={14} /> Mais recentes</> : <><ArrowUp size={14} /> Mais antigos</>}
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {(() => {
                                        const filtered = reqLogs.filter(l => l.reqId === currentReq.id);
                                        return historySortOrder === 'desc' ? filtered.reverse() : filtered;
                                    })().map(log => (
                                        <div key={log.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--surface-color)' }}>
                                            <div className="flex items-center justify-between mb-1">
                                                <strong style={{ color: 'var(--primary-color)', whiteSpace: 'pre-line', lineHeight: '1.4' }}>{log.action}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(log.date).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                            {log.observacao && (
                                                <p style={{ fontSize: '0.875rem', margin: '0.5rem 0', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                                    "{log.observacao}"
                                                </p>
                                            )}
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                <User size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                                                {log.userName}
                                            </div>
                                        </div>
                                    ))}
                                    {reqLogs.filter(l => l.reqId === currentReq.id).length === 0 && (
                                        <p className="text-center" style={{ color: 'var(--text-secondary)' }}>Nenhum histórico encontrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Confirmação de Exclusão */}
            <div className={`modal-overlay ${showDeleteModal ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div className="flex flex-col items-center justify-center mb-4 text-danger">
                        <Trash2 size={48} style={{ opacity: 0.8 }} />
                    </div>
                    <h3 className="mb-4">Confirmar Exclusão</h3>
                    <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Deseja realmente excluir permanentemente a requisição <br/>
                        <strong style={{ color: 'var(--text-color)' }}>{reqToDelete?.numeroRC} - {reqToDelete?.descricao}</strong>?
                    </p>
                    <div className="flex justify-center gap-4 mt-2">
                        <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                        <button className="btn btn-danger" onClick={confirmDelete}>Excluir</button>
                    </div>
                </div>
            </div>
        </>
    );
}
