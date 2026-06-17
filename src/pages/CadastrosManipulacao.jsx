import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useManipulacao } from '../contexts/ManipulacaoContext';
import { ArrowLeft, Plus, X, List, History, User, Info, Edit2, Save, Eye, Trash2, AlertTriangle } from 'lucide-react';

export default function CadastrosManipulacao() {
    const { items, logs, addItem, updateItem, deleteItem } = useManipulacao();
    
    const [currentTab, setCurrentTab] = useState('malhas'); 
    const [listCategoryFilter, setListCategoryFilter] = useState('Todas');
    
    const [showHistory, setShowHistory] = useState(false);
    const [historyItem, setHistoryItem] = useState(null);

    const [showDetails, setShowDetails] = useState(false);
    const [detailsItem, setDetailsItem] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [itemToDelete, setItemToDelete] = useState(null);

    const [showSummary, setShowSummary] = useState(false);

    // Global form states
    const [tipo, setTipo] = useState('');
    const [medida, setMedida] = useState('');
    const [equipamentos, setEquipamentos] = useState([]);
    const [newEquipamento, setNewEquipamento] = useState('');
    const [tag, setTag] = useState('');
    
    const [dedicadoProduto, setDedicadoProduto] = useState(false);
    const [produtosDedicados, setProdutosDedicados] = useState([]);
    const [newProdutoCodigo, setNewProdutoCodigo] = useState('');
    const [newProdutoNome, setNewProdutoNome] = useState('');

    const resetForm = () => {
        setTipo('');
        setMedida('');
        setEquipamentos([]);
        setNewEquipamento('');
        setTag('');
        setDedicadoProduto(false);
        setProdutosDedicados([]);
        setNewProdutoCodigo('');
        setNewProdutoNome('');
    };

    const handleTabChange = (tab) => {
        setCurrentTab(tab);
        resetForm();
    };

    const addEquipamento = () => {
        if (newEquipamento.trim()) {
            setEquipamentos([...equipamentos, newEquipamento.trim()]);
            setNewEquipamento('');
        }
    };
    const removeEquipamento = (index) => {
        setEquipamentos(equipamentos.filter((_, i) => i !== index));
    };

    const addProduto = () => {
        if (newProdutoCodigo.trim() && newProdutoNome.trim()) {
            setProdutosDedicados([...produtosDedicados, { codigo: newProdutoCodigo.trim(), nome: newProdutoNome.trim() }]);
            setNewProdutoCodigo('');
            setNewProdutoNome('');
        }
    };
    const removeProduto = (index) => {
        setProdutosDedicados(produtosDedicados.filter((_, i) => i !== index));
    };

    const handleSubmit = (e, categoria) => {
        e.preventDefault();
        addItem({
            categoria,
            tipo,
            medida,
            equipamentos,
            tag,
            dedicadoProduto,
            produtosDedicados
        });
        resetForm();
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        updateItem(detailsItem.id, {
            tipo,
            medida,
            equipamentos,
            tag,
            dedicadoProduto,
            produtosDedicados
        });
        
        // Atualiza a visualização do modal
        setDetailsItem({
            ...detailsItem,
            tipo, medida, equipamentos, tag, dedicadoProduto, produtosDedicados
        });
        setIsEditing(false);
    };

    const renderProdutosSection = (isOptional) => (
        <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)' }}>
            <h4 className="mb-2">{isOptional ? 'Produtos Dedicados' : 'Produtos e Códigos'}</h4>
            <div className="flex gap-2 items-end mb-2">
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Código do Produto</label>
                    <input type="text" className="form-control" value={newProdutoCodigo} onChange={e => setNewProdutoCodigo(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Nome do Produto</label>
                    <input type="text" className="form-control" value={newProdutoNome} onChange={e => setNewProdutoNome(e.target.value)} />
                </div>
                <button type="button" className="btn btn-secondary" onClick={addProduto}><Plus size={18} /></button>
            </div>
            {produtosDedicados.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                    {produtosDedicados.map((prod, i) => (
                        <li key={i} className="flex justify-between items-center" style={{ backgroundColor: 'var(--background-color)', padding: '0.5rem', marginBottom: '0.25rem', borderRadius: '4px' }}>
                            <span><strong>{prod.codigo}</strong> - {prod.nome}</span>
                            <button type="button" className="text-danger" onClick={() => removeProduto(i)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    const renderEquipamentosSection = () => (
        <div className="form-group mt-2">
            <label>Equipamentos</label>
            <div className="flex gap-2">
                <input type="text" className="form-control" value={newEquipamento} onChange={e => setNewEquipamento(e.target.value)} placeholder="Ex: Misturador 01" />
                <button type="button" className="btn btn-secondary" onClick={addEquipamento}><Plus size={18} /></button>
            </div>
            {equipamentos.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                    {equipamentos.map((eq, i) => (
                        <span key={i} className="badge badge-primary flex items-center gap-1">
                            {eq} <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeEquipamento(i)} />
                        </span>
                    ))}
                </div>
            )}
        </div>
    );

    const renderFormFields = (categoria) => {
        return (
            <>
                {(categoria === 'Malhas' || categoria === 'Tamises') && (
                    <>
                        <div className="form-group">
                            <label>Tipo</label>
                            <input type="text" className="form-control" required value={tipo} onChange={e => setTipo(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Medida</label>
                            <input type="text" className="form-control" required value={medida} onChange={e => setMedida(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>TAG</label>
                            <input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} />
                        </div>
                        {renderEquipamentosSection()}
                        <div className="form-group mt-4">
                            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                                <input type="checkbox" checked={dedicadoProduto} onChange={e => setDedicadoProduto(e.target.checked)} />
                                É dedicado para algum produto?
                            </label>
                        </div>
                        {dedicadoProduto && renderProdutosSection(true)}
                    </>
                )}

                {categoria === 'Mangueiras' && (
                    <>
                        <div className="form-group">
                            <label>Tipo</label>
                            <select className="form-control" required value={tipo} onChange={e => setTipo(e.target.value)}>
                                <option value="">Selecione...</option>
                                <option value="Carga">Carga</option>
                                <option value="Transferência">Transferência</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>TAG</label>
                            <input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} />
                        </div>
                        {renderEquipamentosSection()}
                        {renderProdutosSection(false)}
                    </>
                )}

                {categoria === 'Filtros' && (
                    <>
                        <div className="form-group">
                            <label>TAG</label>
                            <input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} />
                        </div>
                        {renderEquipamentosSection()}
                        {renderProdutosSection(false)}
                    </>
                )}
            </>
        );
    };

    const renderFormMalhasTamises = (categoria) => (
        <form onSubmit={(e) => handleSubmit(e, categoria)} className="card p-4 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="mb-4">Cadastro de {categoria}</h3>
            {renderFormFields(categoria)}
            <button type="submit" className="btn btn-primary mt-4">Salvar Cadastro</button>
        </form>
    );

    const renderFormMangueiras = () => (
        <form onSubmit={(e) => handleSubmit(e, 'Mangueiras')} className="card p-4 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="mb-4">Cadastro de Mangueiras</h3>
            {renderFormFields('Mangueiras')}
            <button type="submit" className="btn btn-primary mt-4">Salvar Cadastro</button>
        </form>
    );

    const renderFormFiltros = () => (
        <form onSubmit={(e) => handleSubmit(e, 'Filtros')} className="card p-4 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="mb-4">Cadastro de Filtros</h3>
            {renderFormFields('Filtros')}
            <button type="submit" className="btn btn-primary mt-4">Salvar Cadastro</button>
        </form>
    );

    const renderItensCadastrados = () => {
        let list = items;
        if (listCategoryFilter !== 'Todas') {
            list = items.filter(i => i.categoria === listCategoryFilter);
        }

        const openHistory = (item) => {
            setHistoryItem(item);
            setShowHistory(true);
        };

        const openDetails = (item) => {
            setDetailsItem(item);
            setIsEditing(false);
            setShowDetails(true);
        };

        const renderTableHeaders = () => {
            if (listCategoryFilter === 'Todas') return <tr><th>Categoria</th><th>TAG</th><th>Equipamento</th><th>Status</th><th className="text-center">Ações</th></tr>;
            if (listCategoryFilter === 'Malhas' || listCategoryFilter === 'Tamises') return <tr><th>Tipo</th><th>Medida</th><th>TAG</th><th>Equipamento</th><th>Status</th><th className="text-center">Ações</th></tr>;
            if (listCategoryFilter === 'Mangueiras') return <tr><th>Tipo</th><th>TAG</th><th>Equipamento</th><th>Status</th><th className="text-center">Ações</th></tr>;
            if (listCategoryFilter === 'Filtros') return <tr><th>TAG</th><th>Equipamento</th><th>Status</th><th className="text-center">Ações</th></tr>;
        };

        const renderTableRow = (item) => {
            const eqText = item.equipamentos?.length > 0 ? item.equipamentos.join(', ') : '-';
            const statusCell = (
                <td>
                    {item.statusDanificado ? (
                        <span className="text-danger flex items-center gap-1 text-sm"><AlertTriangle size={14}/> Danificado</span>
                    ) : (
                        <span className="text-success text-sm">Operacional</span>
                    )}
                </td>
            );

            const actions = (
                <td className="text-center">
                    <div className="flex justify-center gap-2">
                        <button className="btn btn-icon" onClick={() => openDetails(item)} title="Ver Detalhes"><Eye size={18} /></button>
                        <button className="btn btn-icon" onClick={() => openHistory(item)} title="Histórico"><History size={18} /></button>
                        <button className="btn btn-icon text-danger" onClick={() => setItemToDelete(item)} title="Excluir"><Trash2 size={18} color="var(--danger-color)" /></button>
                    </div>
                </td>
            );

            const rowStyle = { backgroundColor: item.statusDanificado ? '#FEF2F2' : 'transparent' };

            if (listCategoryFilter === 'Todas') return (
                <tr key={item.id} style={rowStyle}>
                    <td><strong>{item.categoria}</strong></td>
                    <td>{item.tag || '-'}</td>
                    <td>{eqText}</td>
                    {statusCell}
                    {actions}
                </tr>
            );
            if (listCategoryFilter === 'Malhas' || listCategoryFilter === 'Tamises') return (
                <tr key={item.id} style={rowStyle}>
                    <td>{item.tipo}</td>
                    <td>{item.medida}</td>
                    <td>{item.tag || '-'}</td>
                    <td>{eqText}</td>
                    {statusCell}
                    {actions}
                </tr>
            );
            if (listCategoryFilter === 'Mangueiras') return (
                <tr key={item.id} style={rowStyle}>
                    <td>{item.tipo}</td>
                    <td>{item.tag || '-'}</td>
                    <td>{eqText}</td>
                    {statusCell}
                    {actions}
                </tr>
            );
            if (listCategoryFilter === 'Filtros') return (
                <tr key={item.id} style={rowStyle}>
                    <td>{item.tag || '-'}</td>
                    <td>{eqText}</td>
                    {statusCell}
                    {actions}
                </tr>
            );
        };

        return (
            <div className="animate-fade-in">
                <div className="tabs mb-4" style={{ display: 'inline-flex', padding: '0.25rem', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>
                    {['Todas', 'Malhas', 'Tamises', 'Mangueiras', 'Filtros'].map(cat => (
                        <button key={cat} 
                            onClick={() => setListCategoryFilter(cat)}
                            style={{
                                padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.85rem',
                                backgroundColor: listCategoryFilter === cat ? '#ffffff' : 'transparent',
                                color: listCategoryFilter === cat ? 'var(--primary-color)' : 'var(--text-secondary)',
                                boxShadow: listCategoryFilter === cat ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>{renderTableHeaders()}</thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-4 text-secondary">Nenhum item encontrado.</td></tr>
                            ) : (
                                list.map(item => renderTableRow(item))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const startEdit = () => {
        setTipo(detailsItem.tipo || '');
        setMedida(detailsItem.medida || '');
        setTag(detailsItem.tag || '');
        setEquipamentos(detailsItem.equipamentos || []);
        setNewEquipamento('');
        setDedicadoProduto(detailsItem.dedicadoProduto || false);
        setProdutosDedicados(detailsItem.produtosDedicados || []);
        setNewProdutoCodigo('');
        setNewProdutoNome('');
        setIsEditing(true);
    };

    const resumo = {
        Malhas: items.filter(i => i.categoria === 'Malhas').length,
        Tamises: items.filter(i => i.categoria === 'Tamises').length,
        Mangueiras: items.filter(i => i.categoria === 'Mangueiras').length,
        Filtros: items.filter(i => i.categoria === 'Filtros').length,
    };

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'Cadastros Manipulação' }]} />
            <div className="container" style={{ position: 'relative', minHeight: '80vh' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/gestao-ferramental" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Cadastros Manipulação</h2>
                    </div>
                    {currentTab !== 'itens_cadastrados' && (
                        <button className="btn btn-secondary flex items-center gap-2" onClick={() => handleTabChange('itens_cadastrados')}>
                            <List size={18} /> Itens Cadastrados
                        </button>
                    )}
                </div>

                {currentTab !== 'itens_cadastrados' && (
                    <div className="tabs mb-4">
                        <button className={`tab ${currentTab === 'malhas' ? 'active' : ''}`} onClick={() => handleTabChange('malhas')}>Malhas</button>
                        <button className={`tab ${currentTab === 'tamises' ? 'active' : ''}`} onClick={() => handleTabChange('tamises')}>Tamises</button>
                        <button className={`tab ${currentTab === 'mangueiras' ? 'active' : ''}`} onClick={() => handleTabChange('mangueiras')}>Mangueiras</button>
                        <button className={`tab ${currentTab === 'filtros' ? 'active' : ''}`} onClick={() => handleTabChange('filtros')}>Filtros</button>
                    </div>
                )}

                {currentTab === 'malhas' && renderFormMalhasTamises('Malhas')}
                {currentTab === 'tamises' && renderFormMalhasTamises('Tamises')}
                {currentTab === 'mangueiras' && renderFormMangueiras()}
                {currentTab === 'filtros' && renderFormFiltros()}
                {currentTab === 'itens_cadastrados' && renderItensCadastrados()}

                {/* Widget Flutuante Resumo Interativo */}
                <div 
                    style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}
                    onClick={() => setShowSummary(!showSummary)}
                >
                    <div style={{
                        backgroundColor: 'var(--primary-color)', color: 'white',
                        width: '48px', height: '48px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer'
                    }}>
                        <Info size={24} />
                    </div>
                    {showSummary && (
                        <div style={{
                            position: 'absolute', bottom: '60px', right: '0',
                            backgroundColor: 'white', color: 'var(--text-color)', padding: '1rem',
                            borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            fontSize: '0.85rem', width: 'max-content', border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', color: 'var(--primary-color)' }}>Resumo de Cadastros</div>
                            <div className="flex flex-col gap-1">
                                <span>Malhas: <strong>{resumo.Malhas}</strong></span>
                                <span>Tamises: <strong>{resumo.Tamises}</strong></span>
                                <span>Mangueiras: <strong>{resumo.Mangueiras}</strong></span>
                                <span>Filtros: <strong>{resumo.Filtros}</strong></span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Histórico Modal */}
                {showHistory && historyItem && (
                    <div className="modal-overlay active" style={{ zIndex: 1000 }}>
                        <div className="modal-content" style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h3 className="modal-title flex items-center gap-2"><History size={20} /> Histórico de Alterações</h3>
                                <button className="modal-close" onClick={() => setShowHistory(false)}><X /></button>
                            </div>
                            <div className="mb-4 p-3" style={{ backgroundColor: 'var(--background-color)', borderRadius: '4px' }}>
                                <strong>Item:</strong> {historyItem.categoria} - {historyItem.tag || historyItem.tipo}
                            </div>
                            <div className="flex flex-col gap-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {(() => {
                                    const itemLogs = logs.filter(l => l.itemId === historyItem.id).reverse();
                                    if (itemLogs.length === 0) return <p className="text-secondary">Nenhum histórico registrado.</p>;
                                    return itemLogs.map(log => (
                                        <div key={log.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                            <div className="flex items-center justify-between mb-2">
                                                <strong style={{ color: 'var(--primary-color)' }}>{log.action}</strong>
                                                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{new Date(log.date).toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="text-sm text-secondary flex items-center gap-1">
                                                <User size={14} /> Responsável: {log.userName}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Detalhes / Edição Modal */}
                {showDetails && detailsItem && (
                    <div className="modal-overlay active" style={{ zIndex: 999, padding: '1rem' }}>
                        <div className="modal-content" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="modal-header">
                                <h3 className="modal-title flex items-center gap-2">
                                    {isEditing ? <Edit2 size={20} /> : <Eye size={20} />} 
                                    {isEditing ? `Editar ${detailsItem.categoria}` : `Detalhes: ${detailsItem.categoria}`}
                                </h3>
                                <button className="modal-close" onClick={() => setShowDetails(false)}><X /></button>
                            </div>
                            
                            {!isEditing ? (
                                <div className="flex flex-col gap-4 p-2">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {detailsItem.tipo && <div><span className="text-secondary block text-sm">Tipo</span><strong>{detailsItem.tipo}</strong></div>}
                                        {detailsItem.medida && <div><span className="text-secondary block text-sm">Medida</span><strong>{detailsItem.medida}</strong></div>}
                                        {detailsItem.tag && <div><span className="text-secondary block text-sm">TAG</span><strong>{detailsItem.tag}</strong></div>}
                                    </div>
                                    
                                    <div>
                                        <span className="text-secondary block text-sm mb-1">Equipamentos Atendidos</span>
                                        <div className="flex flex-wrap gap-2">
                                            {detailsItem.equipamentos?.length > 0 ? detailsItem.equipamentos.map((eq, i) => <span key={i} className="badge badge-primary">{eq}</span>) : '-'}
                                        </div>
                                    </div>

                                    {(detailsItem.dedicadoProduto !== undefined || detailsItem.produtosDedicados?.length > 0) && (
                                        <div>
                                            <span className="text-secondary block text-sm mb-1">Produtos Vinculados {detailsItem.dedicadoProduto ? '(Dedicado)' : ''}</span>
                                            {detailsItem.produtosDedicados?.length > 0 ? (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {detailsItem.produtosDedicados.map((prod, i) => (
                                                        <li key={i} style={{ padding: '0.5rem', backgroundColor: 'var(--background-color)', marginBottom: '0.25rem', borderRadius: '4px' }}>
                                                            <strong>{prod.codigo}</strong> - {prod.nome}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="modal-footer mt-4">
                                        <button className="btn btn-secondary" onClick={() => setShowDetails(false)}>Fechar</button>
                                        <button className="btn btn-primary" onClick={startEdit}><Edit2 size={16} /> Editar Item</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdate} className="flex flex-col gap-4 p-2">
                                    {renderFormFields(detailsItem.categoria)}
                                    <div className="modal-footer mt-4">
                                        <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary"><Save size={16} /> Salvar Alterações</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Confirm Delete Modal */}
                {itemToDelete && (
                    <div className="modal-overlay active" style={{ zIndex: 1005 }}>
                        <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div className="flex flex-col items-center justify-center mb-4 text-danger">
                                <Trash2 size={48} style={{ opacity: 0.8 }} />
                            </div>
                            <h3 className="mb-4">Confirmar Exclusão</h3>
                            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                                Deseja realmente excluir este cadastro? <br/>
                                <strong style={{ color: 'var(--text-color)' }}>{itemToDelete.categoria} - {itemToDelete.tag || itemToDelete.tipo}</strong>
                            </p>
                            <div className="flex justify-center gap-4 mt-2">
                                <button className="btn btn-secondary" onClick={() => setItemToDelete(null)}>Cancelar</button>
                                <button className="btn btn-danger" onClick={() => {
                                    deleteItem(itemToDelete.id);
                                    setItemToDelete(null);
                                }}>Sim, excluir</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
