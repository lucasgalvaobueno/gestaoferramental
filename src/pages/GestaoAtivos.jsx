import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAssets } from '../contexts/AssetContext';
import { useCapex } from '../contexts/CapexContext';
import { calcularValorContabil, formatarMoeda, formatarData } from '../utils/calculations';
import { ArrowLeft, ArrowRight, Plus, BarChart2, Edit, Trash2, CheckSquare, X, PieChart, History, User, Filter, Download, ArrowDown, ArrowUp } from 'lucide-react';

export default function GestaoAtivos() {
    const { getAssetsByStatus, addAsset, updateAsset, moveAsset, addLog, logs } = useAssets();
    const { capexItems } = useCapex();
    const [currentTab, setCurrentTab] = useState('ativo'); // 'ativo', 'aguardando_descarte', 'descartado'
    
    // Filters
    const [filterArea, setFilterArea] = useState('');
    const [filterDataInicio, setFilterDataInicio] = useState('');
    const [filterDataFim, setFilterDataFim] = useState('');
    const [filterCapexId, setFilterCapexId] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal states
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    
    const [showChecklist, setShowChecklist] = useState(false);
    const [checkingAsset, setCheckingAsset] = useState(null);
    const [checks, setChecks] = useState({ relatorio: false, controladoria: false, gerencia: false });
    const [anexoFile, setAnexoFile] = useState(null);
    
    const [showSummary, setShowSummary] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyAsset, setHistoryAsset] = useState(null);
    const [historySortOrder, setHistorySortOrder] = useState('desc');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [assetToMove, setAssetToMove] = useState(null);

    const handleOpenHistory = (asset) => {
        setHistoryAsset(asset);
        setShowHistory(true);
    };

    // Form states
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultForm = {
        dataCadastro: todayStr,
        numeroImobilizado: '',
        descricao: '',
        referencia: '',
        areaCorrespondente: 'Geral',
        valor: '',
        tempoDepreciacao: '',
        dataInicioDepreciacao: todayStr,
        capexId: ''
    };
    const [formData, setFormData] = useState(defaultForm);

    let assets = getAssetsByStatus(currentTab);
    
    // Apply filters
    if (filterArea) {
        assets = assets.filter(a => a.areaCorrespondente === filterArea);
    }
    if (filterDataInicio) {
        assets = assets.filter(a => a.dataCadastro >= filterDataInicio);
    }
    if (filterDataFim) {
        assets = assets.filter(a => a.dataCadastro <= filterDataFim);
    }
    if (filterCapexId) {
        assets = assets.filter(a => a.capexId === filterCapexId);
    }

    // Handlers for Asset Modal
    const handleOpenAssetModal = (asset = null) => {
        setEditingAsset(asset);
        if (asset) {
            setFormData({
                ...defaultForm,
                ...asset,
                capexId: asset.capexId || '',
                referencia: asset.referencia || ''
            });
        } else {
            setFormData(defaultForm);
        }
        setShowAssetModal(true);
    };

    const handleSaveAsset = (e, saveAndNew = false) => {
        e?.preventDefault();
        const dataToSave = {
            ...formData,
            valor: parseFloat(formData.valor),
            tempoDepreciacao: parseFloat(formData.tempoDepreciacao)
        };

        if (editingAsset) {
            const changes = [];
            const labels = {
                numeroImobilizado: 'Nº Imobilizado',
                descricao: 'Descrição',
                referencia: 'Referência',
                areaCorrespondente: 'Área',
                valor: 'Valor Total',
                tempoDepreciacao: 'Tempo de Depreciação',
                dataInicioDepreciacao: 'Data Início Depreciação',
                dataCadastro: 'Data de Cadastro',
                capexId: 'Linha CAPEX'
            };

            Object.keys(dataToSave).forEach(key => {
                if (dataToSave[key] !== editingAsset[key]) {
                    const label = labels[key] || key;
                    let oldVal = editingAsset[key];
                    let newVal = dataToSave[key];
                    
                    if (key === 'valor') {
                        oldVal = formatarMoeda(oldVal || 0);
                        newVal = formatarMoeda(newVal || 0);
                    } else if (key === 'capexId') {
                        const oldCapex = capexItems.find(c => c.id === oldVal);
                        const newCapex = capexItems.find(c => c.id === newVal);
                        oldVal = oldCapex ? oldCapex.linhaInvestimento : '(Vazio)';
                        newVal = newCapex ? newCapex.linhaInvestimento : '(Vazio)';
                    } else {
                        oldVal = oldVal || '(Vazio)';
                        newVal = newVal || '(Vazio)';
                    }
                    
                    changes.push(`${label}: de "${oldVal}" para "${newVal}"`);
                }
            });

            const logMessage = changes.length > 0 
                ? `Edição de Ativo:\n• ${changes.join('\n• ')}` 
                : 'Edição de Ativo: Salvo sem alterações reais.';

            updateAsset(editingAsset.id, dataToSave, logMessage);
            setShowAssetModal(false);
        } else {
            addAsset(dataToSave);
            if (saveAndNew) {
                setFormData(defaultForm);
            } else {
                setShowAssetModal(false);
            }
        }
    };

    // Handlers for Checklist
    const handleOpenChecklist = (asset) => {
        setCheckingAsset(asset);
        setChecks({ relatorio: false, controladoria: false, gerencia: false });
        setAnexoFile(null);
        setShowChecklist(true);
    };

    const handleSaveChecklist = () => {
        const labels = [];
        if (checks.relatorio) labels.push('Relatório realizado');
        if (checks.controladoria) labels.push('Aval controladoria');
        if (checks.gerencia) labels.push('Aval gerência');
        if (anexoFile) labels.push(`Anexo: ${anexoFile.name}`);
        
        if (labels.length > 0) {
            addLog(checkingAsset.id, `Checklist parcial: ${labels.join(', ')}`);
        }
        setShowChecklist(false);
    };

    const handleConfirmDiscard = () => {
        moveAsset(checkingAsset.id, 'descartado', `Descarte concluído. Documento anexo: ${anexoFile?.name}`, { anexoDescarte: anexoFile });
        setShowChecklist(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setAnexoFile(null);
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("O arquivo é muito grande! Por favor, selecione um arquivo de até 2MB para evitar travar a memória do sistema.");
            e.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setAnexoFile({
                name: file.name,
                type: file.type,
                data: reader.result
            });
        };
        reader.readAsDataURL(file);
    };

    const allChecked = checks.relatorio && checks.controladoria && checks.gerencia && anexoFile !== null;

    // Calculated fields
    const valorContabilPreview = calcularValorContabil(
        parseFloat(formData.valor),
        parseFloat(formData.tempoDepreciacao),
        formData.dataInicioDepreciacao
    );

    const summaryQtd = assets.length;
    const summaryValor = assets.reduce((acc, a) => acc + (a.valor || 0), 0);
    const summaryContabil = assets.reduce((acc, a) => acc + calcularValorContabil(a.valor, a.tempoDepreciacao, a.dataInicioDepreciacao), 0);
    
    // Ativos quase depreciados (>= 80%) para o resumo da aba Ativos
    const ativosQuaseDepreciados = assets.filter(a => {
        const valorOriginal = a.valor;
        if (!valorOriginal) return false;
        const vContabil = calcularValorContabil(a.valor, a.tempoDepreciacao, a.dataInicioDepreciacao);
        const pct = ((valorOriginal - vContabil) / valorOriginal) * 100;
        return pct >= 80;
    });

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'Gestão de Ativos' }]} />
            <div className="container animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/gestao-ferramental" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Ativos Imobilizados</h2>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenAssetModal()}>
                        <Plus size={18} /> Adicionar Ativos
                    </button>
                </div>
                
                <div className="tabs">
                    <button className={`tab ${currentTab === 'ativo' ? 'active' : ''}`} onClick={() => setCurrentTab('ativo')}>Ativos</button>
                    <button className={`tab ${currentTab === 'aguardando_descarte' ? 'active' : ''}`} onClick={() => setCurrentTab('aguardando_descarte')}>Aguardando Descarte</button>
                    <button className={`tab ${currentTab === 'descartado' ? 'active' : ''}`} onClick={() => setCurrentTab('descartado')}>Ativos Descartados</button>
                </div>

                {/* Filtros */}
                <div className="flex justify-between items-center mb-4">
                    <button className="btn btn-secondary flex items-center gap-2" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={16} /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                    {(filterArea || filterDataInicio || filterDataFim || filterCapexId) && (
                        <span className="badge flex items-center gap-2" style={{ backgroundColor: 'var(--primary-color)', color: 'white', fontSize: '0.75rem' }}>
                            Filtros Ativos
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }} onClick={() => { setFilterArea(''); setFilterDataInicio(''); setFilterDataFim(''); setFilterCapexId(''); }}>
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
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Área:</span>
                                    <select className="form-control" style={{ fontSize: '0.85rem' }} value={filterArea} onChange={e => setFilterArea(e.target.value)}>
                                        <option value="">Todas</option>
                                        <option value="Manipulação">Manipulação</option>
                                        <option value="Compressão">Compressão</option>
                                        <option value="Embalagem">Embalagem</option>
                                        <option value="Não sólidos">Não sólidos</option>
                                        <option value="Geral">Geral</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, flex: 2, minWidth: '300px' }}>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Período:</span>
                                    <input type="date" className="form-control" style={{ fontSize: '0.85rem' }} value={filterDataInicio} onChange={e => setFilterDataInicio(e.target.value)} title="Data Inicial" />
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>até</span>
                                    <input type="date" className="form-control" style={{ fontSize: '0.85rem' }} value={filterDataFim} onChange={e => setFilterDataFim(e.target.value)} title="Data Final" />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                                <div className="flex items-center gap-2">
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Linha CAPEX:</span>
                                    <select className="form-control" style={{ fontSize: '0.85rem' }} value={filterCapexId} onChange={e => setFilterCapexId(e.target.value)}>
                                        <option value="">Todas</option>
                                        {capexItems.map(c => <option key={c.id} value={c.id}>{c.ano} - {c.linhaInvestimento}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Num. Imobilizado</th>
                                <th>Descrição</th>
                                <th>Área</th>
                                <th>Data Cadastro</th>
                                <th>Valor Total</th>
                                <th>Valor Contábil</th>
                                {currentTab === 'descartado' && <th>Responsável (Descarte)</th>}
                                {currentTab === 'descartado' && <th className="text-center">Anexo</th>}
                                <th className="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.length === 0 ? (
                                <tr><td colSpan="7" className="text-center" style={{color: 'var(--text-secondary)'}}>Nenhum ativo encontrado.</td></tr>
                            ) : (
                                assets.map(asset => {
                                    const valorContabil = calcularValorContabil(asset.valor, asset.tempoDepreciacao, asset.dataInicioDepreciacao);
                                    return (
                                        <tr key={asset.id} onClick={() => handleOpenHistory(asset)} style={{ cursor: 'pointer' }}>
                                            <td>{asset.numeroImobilizado}</td>
                                            <td>{asset.descricao}<br/><span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Ref: {asset.referencia || '-'}</span></td>
                                            <td>{asset.areaCorrespondente}</td>
                                            <td>{formatarData(asset.dataCadastro)}</td>
                                            <td>{formatarMoeda(asset.valor)}</td>
                                            <td>{formatarMoeda(valorContabil)}</td>
                                            {currentTab === 'descartado' && (
                                                <td>
                                                    {(() => {
                                                        const discardLog = logs.slice().reverse().find(l => l.assetId === asset.id && l.action.toLowerCase().includes('descartado'));
                                                        return discardLog ? discardLog.userName : '-';
                                                    })()}
                                                </td>
                                            )}
                                            {currentTab === 'descartado' && (
                                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                    {asset.anexoDescarte ? (
                                                        <a href={asset.anexoDescarte.data} download={asset.anexoDescarte.name} className="btn btn-icon text-primary" title={`Baixar comprovante: ${asset.anexoDescarte.name}`}>
                                                            <Download size={20} />
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="text-center">
                                                {currentTab === 'ativo' && (
                                                    <>
                                                        <button className="btn btn-icon btn-edit" onClick={(e) => { e.stopPropagation(); handleOpenAssetModal(asset); }} title="Editar"><Edit size={18} /></button>
                                                        <button className="btn btn-icon btn-move text-danger" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAssetToMove(asset);
                                                            setShowConfirmModal(true);
                                                        }} title="Aguardando descarte" style={{ color: 'var(--danger-color)' }}><Trash2 size={18} /></button>
                                                    </>
                                                )}
                                                {currentTab === 'aguardando_descarte' && (
                                                    <button className="btn btn-icon btn-check" onClick={(e) => { e.stopPropagation(); handleOpenChecklist(asset); }} title="Preencher Checklist"><CheckSquare size={18} /></button>
                                                )}
                                                {currentTab === 'descartado' && (
                                                    <span className="badge badge-danger">Descartado</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <button className="fab-resumo" onClick={() => setShowSummary(true)} title="Resumo">
                <BarChart2 />
            </button>

            {/* Asset Modal */}
            <div className={`modal-overlay ${showAssetModal ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '800px' }}>
                    <div className="modal-header">
                        <h2 className="modal-title">{editingAsset ? 'Editar Ativo' : 'Adicionar Ativo'}</h2>
                        <button className="modal-close" onClick={() => setShowAssetModal(false)}><X /></button>
                    </div>
                    <form onSubmit={handleSaveAsset}>
                        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Data de Cadastro</label>
                                <input type="date" className="form-control" value={formData.dataCadastro} onChange={e => setFormData({...formData, dataCadastro: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Número do Imobilizado</label>
                                <input type="text" className="form-control" value={formData.numeroImobilizado} onChange={e => setFormData({...formData, numeroImobilizado: e.target.value})} required />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Descrição</label>
                                <input type="text" className="form-control" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Referência</label>
                                <input type="text" className="form-control" value={formData.referencia} onChange={e => setFormData({...formData, referencia: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Área Correspondente</label>
                                <select className="form-control" value={formData.areaCorrespondente} onChange={e => setFormData({...formData, areaCorrespondente: e.target.value})} required>
                                    <option value="Manipulação">Manipulação</option>
                                    <option value="Compressão">Compressão</option>
                                    <option value="Embalagem">Embalagem</option>
                                    <option value="Não sólidos">Não sólidos</option>
                                    <option value="Geral">Geral</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Linha de Invest. CAPEX</label>
                                <select className="form-control" required value={formData.capexId || ''} onChange={e => setFormData({...formData, capexId: e.target.value})}>
                                    <option value="">Selecione a Linha CAPEX</option>
                                    {capexItems.map(c => <option key={c.id} value={c.id}>{c.ano} - {c.linhaInvestimento} ({c.descricao})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Valor Total (R$)</label>
                                <input type="number" step="0.01" className="form-control" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Tempo de Depreciação (anos)</label>
                                <input type="number" step="0.1" className="form-control" value={formData.tempoDepreciacao} onChange={e => setFormData({...formData, tempoDepreciacao: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Data Início de Depreciação</label>
                                <input type="date" className="form-control" value={formData.dataInicioDepreciacao} onChange={e => setFormData({...formData, dataInicioDepreciacao: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Valor Contábil Calculado</label>
                                <input type="text" className="form-control" value={formatarMoeda(valorContabilPreview)} disabled style={{ backgroundColor: 'var(--background-color)', fontWeight: 'bold' }} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            {!editingAsset && <button type="button" className="btn btn-secondary" onClick={(e) => {
                                const form = e.target.closest('form');
                                if (form.checkValidity()) handleSaveAsset(e, true);
                                else form.reportValidity();
                            }}>Salvar e novo</button>}
                            <button type="submit" className="btn btn-primary">Salvar e fechar</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Checklist Modal */}
            <div className={`modal-overlay ${showChecklist ? 'active' : ''}`}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">Checklist de Descarte</h2>
                        <button className="modal-close" onClick={() => setShowChecklist(false)}><X /></button>
                    </div>
                    {checkingAsset && (
                        <>
                            <div className="mb-4">
                                <p><strong>Ativo:</strong> {checkingAsset.numeroImobilizado} - {checkingAsset.descricao}</p>
                            </div>
                            <div className="checkbox-wrapper">
                                <input type="checkbox" id="check-relatorio" checked={checks.relatorio} onChange={e => setChecks({...checks, relatorio: e.target.checked})} />
                                <label htmlFor="check-relatorio">Relatório de baixa de imobilizado realizado</label>
                            </div>
                            <div className="checkbox-wrapper">
                                <input type="checkbox" id="check-controladoria" checked={checks.controladoria} onChange={e => setChecks({...checks, controladoria: e.target.checked})} />
                                <label htmlFor="check-controladoria">Solicitado aval da Controladoria</label>
                            </div>
                            <div className="checkbox-wrapper">
                                <input type="checkbox" id="check-gerencia" checked={checks.gerencia} onChange={e => setChecks({...checks, gerencia: e.target.checked})} />
                                <label htmlFor="check-gerencia">Solicitado aval da Gerência</label>
                            </div>
                            <div className="form-group mt-4 p-4" style={{ backgroundColor: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--border-color)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Anexo Comprobatório (Obrigatório) *</label>
                                <input 
                                    type="file" 
                                    className="form-control" 
                                    style={{ padding: '0.5rem' }} 
                                    onChange={handleFileChange}
                                />
                                <small style={{ color: 'var(--text-secondary)' }}>Anexe o documento (máx 2MB) autorizando o descarte.</small>
                            </div>
                            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={handleSaveChecklist}>Salvar</button>
                                {allChecked && <button type="button" className="btn btn-danger" onClick={handleConfirmDiscard}>Salvar e confirmar o descarte</button>}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Modal */}
            <div className={`modal-overlay ${showSummary ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '500px' }}>
                    <div className="modal-header">
                        <h2 className="modal-title flex items-center gap-2"><PieChart /> Resumo</h2>
                        <button className="modal-close" onClick={() => setShowSummary(false)}><X /></button>
                    </div>
                    <div className="flex flex-col gap-3 mt-2">
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Quantidade de ativos:</span>
                            <span style={{ fontWeight: 600 }}>{summaryQtd}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Valor Total:</span>
                            <span style={{ fontWeight: 600 }}>{formatarMoeda(summaryValor)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Valor Contábil Total:</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{formatarMoeda(summaryContabil)}</span>
                        </div>

                        {currentTab === 'ativo' && ativosQuaseDepreciados.length > 0 && (
                            <div className="mt-4 p-4" style={{ backgroundColor: '#FEF2F2', borderRadius: 'var(--border-radius-sm)', border: '1px solid #FEE2E2' }}>
                                <h3 className="text-danger mb-2" style={{ fontSize: '1rem' }}>⚠️ Depreciação acima de 80%</h3>
                                <ul style={{ fontSize: '0.875rem', color: '#991B1B', paddingLeft: '1rem' }}>
                                    {ativosQuaseDepreciados.map(a => {
                                        const vContabil = calcularValorContabil(a.valor, a.tempoDepreciacao, a.dataInicioDepreciacao);
                                        const pct = ((a.valor - vContabil) / a.valor) * 100;
                                        return (
                                            <li key={a.id} className="mb-1">
                                                <strong>{a.numeroImobilizado}</strong> - {a.descricao} <br/>
                                                <span style={{opacity: 0.8}}>{pct.toFixed(1)}% depreciado (Resta {formatarMoeda(vContabil)})</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Modal */}
            <div className={`modal-overlay ${showHistory ? 'active' : ''}`}>
                <div className="modal-content">
                    <div className="modal-header">
                        <div className="flex items-center gap-4">
                            <h2 className="modal-title flex items-center gap-2"><History /> Histórico do Ativo</h2>
                            {historyAsset && logs.filter(l => l.assetId === historyAsset.id).length > 0 && (
                                <button className="btn btn-secondary flex items-center gap-2" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setHistorySortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} title="Alternar entre mais recentes e mais antigos">
                                    {historySortOrder === 'desc' ? <><ArrowDown size={14} /> Mais recentes</> : <><ArrowUp size={14} /> Mais antigos</>}
                                </button>
                            )}
                        </div>
                        <button className="modal-close" onClick={() => setShowHistory(false)}><X /></button>
                    </div>
                    {historyAsset && (
                        <>
                            <div className="mb-4">
                                <p><strong>Ativo:</strong> {historyAsset.numeroImobilizado} - {historyAsset.descricao}</p>
                            </div>
                            <div className="flex flex-col gap-3" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {(() => {
                                    const filtered = logs.filter(l => l.assetId === historyAsset.id);
                                    return historySortOrder === 'desc' ? filtered.reverse() : filtered;
                                })().map(log => (
                                    <div key={log.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--surface-color)' }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <strong style={{ color: 'var(--primary-color)', whiteSpace: 'pre-line', lineHeight: '1.4', display: 'block' }}>{log.action}</strong>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {new Date(log.date).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            <User size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                                            Responsável: {log.userName}
                                        </div>
                                    </div>
                                ))}
                                {logs.filter(l => l.assetId === historyAsset.id).length === 0 && (
                                    <p className="text-center" style={{ color: 'var(--text-secondary)' }}>Nenhum histórico encontrado.</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Confirm Move Modal */}
            <div className={`modal-overlay ${showConfirmModal ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div className="flex flex-col items-center justify-center mb-4 text-danger">
                        <Trash2 size={48} style={{ opacity: 0.8 }} />
                    </div>
                    <h3 className="mb-4">Confirmar Movimentação</h3>
                    <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Deseja realmente mover o ativo <br/>
                        <strong style={{ color: 'var(--text-color)' }}>{assetToMove?.numeroImobilizado} - {assetToMove?.descricao}</strong> <br/>
                        para aguardando descarte?
                    </p>
                    <div className="flex justify-center gap-4 mt-2">
                        <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
                        <button className="btn btn-danger" onClick={() => {
                            moveAsset(assetToMove.id, 'aguardando_descarte');
                            setShowConfirmModal(false);
                        }}>Sim, mover</button>
                    </div>
                </div>
            </div>
        </>
    );
}
