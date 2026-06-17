import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCapex } from '../contexts/CapexContext';
import { useFollowUp } from '../contexts/FollowUpContext';
import { formatarMoeda } from '../utils/calculations';
import { ArrowLeft, Plus, X, BarChart2, CheckCircle, Trash2, Filter } from 'lucide-react';

export default function Capex() {
    const { capexItems, addCapexItem, updateCapexItem, deleteCapexItem } = useCapex();
    const { requisitions } = useFollowUp();
    
    const [currentTab, setCurrentTab] = useState('aprovado'); // 'aprovado' ou 'desejo'
    const [filterAno, setFilterAno] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [showItemModal, setShowItemModal] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const defaultForm = {
        ano: new Date().getFullYear().toString(),
        descricao: '',
        linhaInvestimento: '',
        valor: '',
        areaCorrespondente: 'Manipulação'
    };
    
    const [formData, setFormData] = useState(defaultForm);

    const areas = ['Manipulação', 'Compressão', 'Embalagem', 'Não Sólidos', 'Geral'];
    
    const itemsByTab = capexItems.filter(item => item.status === currentTab);

    // Derived unique properties for filters based on current tab
    const allAnos = [...new Set(itemsByTab.map(i => i.ano))].filter(Boolean).sort((a, b) => b - a);

    // Apply filters
    const filteredItems = useMemo(() => {
        return itemsByTab.filter(item => {
            if (filterAno && item.ano !== filterAno) return false;
            if (filterArea && item.areaCorrespondente !== filterArea) return false;
            return true;
        });
    }, [itemsByTab, filterAno, filterArea]);

    // Resumo
    const resumo = useMemo(() => {
        const totalOrcamento = filteredItems.reduce((acc, item) => acc + (parseFloat(item.valor) || 0), 0);
        
        const filteredItemIds = new Set(filteredItems.map(i => i.id));
        const totalGasto = requisitions
            .filter(req => req.capexId && filteredItemIds.has(req.capexId))
            .reduce((acc, req) => acc + (req.valorTotalReais || 0), 0);
            
        const available = totalOrcamento - totalGasto;

        return {
            linhas: filteredItems.length,
            gasto: totalGasto,
            disponivel: totalOrcamento > 0 ? available : 0, 
            orcamentoTotal: totalOrcamento
        };
    }, [filteredItems, requisitions]);

    const handleOpenItemModal = (item = null) => {
        setEditingItem(item);
        setFormData(item ? { ...item } : { ...defaultForm });
        setShowItemModal(true);
    };

    const handleSaveItem = (e, saveAndNew = false) => {
        if(e) e.preventDefault();
        
        // Minimal validation
        if (!formData.ano || !formData.descricao || !formData.linhaInvestimento || !formData.valor) {
            alert('Preencha os campos obrigatórios!');
            return;
        }

        if (editingItem) {
            updateCapexItem(editingItem.id, formData);
            setShowItemModal(false);
        } else {
            addCapexItem({ ...formData, status: currentTab });
            if (saveAndNew) {
                setFormData(prev => ({ ...prev, descricao: '', valor: '' }));
            } else {
                setShowItemModal(false);
                setFormData({ ...defaultForm });
            }
        }
    };

    const handleApproveProject = (id) => {
        const targetId = id || editingItem?.id;
        if (targetId) {
            updateCapexItem(targetId, { status: 'aprovado' });
            setShowItemModal(false);
        }
    };

    const handleDeleteClick = (item, e) => {
        e?.stopPropagation();
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteCapexItem(itemToDelete.id);
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'CAPEX' }]} />
            <div className="container animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/gestao-ferramental" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>CAPEX (Gestão Orçamentária)</h2>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-primary" onClick={() => handleOpenItemModal()}>
                            <Plus size={18} /> {currentTab === 'aprovado' ? 'Adicionar Linha CAPEX' : 'Adicionar à Lista de Desejos'}
                        </button>
                    </div>
                </div>

                <div className="tabs mb-4">
                    <button className={`tab ${currentTab === 'aprovado' ? 'active' : ''}`} onClick={() => setCurrentTab('aprovado')}>Projetos Aprovados</button>
                    <button className={`tab ${currentTab === 'desejo' ? 'active' : ''}`} onClick={() => setCurrentTab('desejo')}>Lista de Desejos (Backlog)</button>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <button className="btn btn-secondary flex items-center gap-2" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={16} /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                    {(filterAno || filterArea) && (
                        <span className="badge flex items-center gap-2" style={{ backgroundColor: 'var(--primary-color)', color: 'white', fontSize: '0.75rem' }}>
                            Filtros Ativos
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }} onClick={() => { setFilterAno(''); setFilterArea(''); }}>
                                <X size={12} />
                            </button>
                        </span>
                    )}
                </div>

                {showFilters && (
                    <div className="card mb-4 animate-fade-in" style={{ padding: '1rem' }}>
                        <div className="flex gap-4 items-center flex-wrap">
                            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ano:</span>
                                    <select className="form-control" style={{ fontSize: '0.85rem' }} value={filterAno} onChange={e => setFilterAno(e.target.value)}>
                                        <option value="">Todos</option>
                                        {allAnos.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Área Correspondente:</span>
                                    <select className="form-control" style={{ fontSize: '0.85rem' }} value={filterArea} onChange={e => setFilterArea(e.target.value)}>
                                        <option value="">Todas</option>
                                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="table-container">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Ano</th>
                                <th>Linha de Invest.</th>
                                <th>Descrição</th>
                                <th>Área</th>
                                <th>{currentTab === 'aprovado' ? 'Orçamento Base' : 'Valor Estimado (Desejo)'}</th>
                                {currentTab === 'aprovado' && <th>Valor Gasto (RCs)</th>}
                                {currentTab === 'aprovado' && <th>Disponível</th>}
                                <th className="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr><td colSpan={currentTab === 'aprovado' ? "7" : "5"} className="text-center" style={{color: 'var(--text-secondary)'}}>Nenhum item encontrado.</td></tr>
                            ) : (
                                filteredItems.map(item => {
                                    const orcamento = parseFloat(item.valor) || 0;
                                    const gasto = requisitions
                                        .filter(req => req.capexId === item.id)
                                        .reduce((acc, req) => acc + (req.valorTotalReais || 0), 0);
                                    const disponivel = orcamento - gasto;
                                    
                                    return (
                                        <tr key={item.id} onClick={() => handleOpenItemModal(item)} style={{ cursor: 'pointer' }}>
                                            <td>{item.ano}</td>
                                            <td>{item.linhaInvestimento}</td>
                                            <td>{item.descricao}</td>
                                            <td>{item.areaCorrespondente}</td>
                                            <td style={{color: 'var(--text-secondary)'}}>{formatarMoeda(orcamento)}</td>
                                            {currentTab === 'aprovado' && <td style={{fontWeight: '600'}}>{formatarMoeda(gasto)}</td>}
                                            {currentTab === 'aprovado' && (
                                                <td style={{color: disponivel < 0 ? 'var(--danger-color)' : 'var(--primary-color)', fontWeight: '600'}}>
                                                    {formatarMoeda(disponivel)}
                                                </td>
                                            )}
                                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                {currentTab === 'desejo' && (
                                                    <button 
                                                        className="btn" 
                                                        style={{ backgroundColor: 'var(--success-color)', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.875rem', marginRight: '0.5rem' }} 
                                                        onClick={() => handleApproveProject(item.id)}
                                                        title="Aprovar Projeto (Transferir para Projetos Aprovados)"
                                                    >
                                                        <CheckCircle size={16} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'text-bottom' }} />
                                                        Transferir
                                                    </button>
                                                )}
                                                <button 
                                                    className="btn btn-icon text-danger" 
                                                    onClick={(e) => handleDeleteClick(item, e)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fab Resumo */}
            {currentTab === 'aprovado' && (
                <button className="fab-resumo" onClick={() => setShowSummary(true)} title="Resumo CAPEX">
                    <BarChart2 size={24} />
                </button>
            )}

            {/* Modal Summary */}
            <div className={`modal-overlay ${showSummary ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '400px' }}>
                    <div className="modal-header">
                        <h2 className="modal-title">Resumo Financeiro</h2>
                        <button className="modal-close" onClick={() => setShowSummary(false)}><X /></button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div style={{ padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Itens Filtrados (Linhas)</p>
                            <h3>{resumo.linhas}</h3>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Orçamento Base Total</p>
                            <h3>{formatarMoeda(resumo.orcamentoTotal)}</h3>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Valor Total Gasto (RCs vinculadas)</p>
                            <h3 style={{ color: 'var(--danger-color)' }}>{formatarMoeda(resumo.gasto)}</h3>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Valor Disponível Total</p>
                            <h3 style={{ color: 'var(--primary-color)' }}>{formatarMoeda(resumo.disponivel)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Add/Edit Item */}
            <div className={`modal-overlay ${showItemModal ? 'active' : ''}`}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">{editingItem ? 'Editar Item' : (currentTab === 'aprovado' ? 'Adicionar Linha CAPEX' : 'Adicionar à Lista de Desejos')}</h2>
                        <button className="modal-close" onClick={() => setShowItemModal(false)}><X /></button>
                    </div>
                    <form id="capex-form" onSubmit={(e) => handleSaveItem(e, false)}>
                        <div className="form-group">
                            <label>Ano</label>
                            <input type="number" required className="form-control" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Linha de Investimento</label>
                            <input type="text" required className="form-control" placeholder="Ex: Equipamentos de Laboratório" value={formData.linhaInvestimento} onChange={e => setFormData({...formData, linhaInvestimento: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Descrição</label>
                            <input type="text" required className="form-control" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Área Correspondente</label>
                            <select className="form-control" required value={formData.areaCorrespondente} onChange={e => setFormData({...formData, areaCorrespondente: e.target.value})}>
                                {areas.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{currentTab === 'aprovado' ? 'Valor do Orçamento Limite (R$)' : 'Valor Estimado do Desejo (R$)'}</label>
                            <input type="number" step="0.01" required className="form-control" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
                        </div>
                        <div className="modal-footer" style={{ flexWrap: 'wrap' }}>
                            <div className="flex gap-2" style={{ flex: 1 }}>
                                {editingItem && currentTab === 'desejo' && (
                                    <button type="button" className="btn" style={{ backgroundColor: 'var(--success-color)', color: 'white', fontWeight: 600 }} onClick={() => handleApproveProject()}>
                                        <CheckCircle size={18} /> Aprovar e Transferir
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancelar</button>
                                {!editingItem && <button type="button" className="btn btn-secondary" onClick={(e) => handleSaveItem(e, true)}>Salvar e Adicionar Novo</button>}
                                <button type="submit" className="btn btn-primary">{editingItem ? 'Salvar Alterações' : 'Salvar e Sair'}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <div className={`modal-overlay ${showDeleteModal ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div className="flex flex-col items-center justify-center mb-4 text-danger">
                        <Trash2 size={48} style={{ opacity: 0.8 }} />
                    </div>
                    <h3 className="mb-4">Confirmar Exclusão</h3>
                    <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Deseja realmente excluir permanentemente a linha <br/>
                        <strong style={{ color: 'var(--text-color)' }}>{itemToDelete?.linhaInvestimento} - {itemToDelete?.descricao}</strong>?
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
