import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCompressao } from '../contexts/CompressaoContext';
import { ArrowLeft, Plus, X, List, History, User, FileText, Upload, Info, Eye, Edit2, Save, Trash2, AlertTriangle } from 'lucide-react';

export default function CadastrosCompressao() {
    const { items, logs, addItem, updateItem, deleteItem } = useCompressao();
    
    const [currentTab, setCurrentTab] = useState('compressao');
    const [listCategoryFilter, setListCategoryFilter] = useState('Todas');
    
    const [showHistory, setShowHistory] = useState(false);
    const [historyItem, setHistoryItem] = useState(null);

    const [showDetails, setShowDetails] = useState(false);
    const [detailsItem, setDetailsItem] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [itemToDelete, setItemToDelete] = useState(null);

    const [showSummary, setShowSummary] = useState(false);

    // Form states - Compressao
    const [padraoPuncoes, setPadraoPuncoes] = useState('');
    const [medidaPuncao, setMedidaPuncao] = useState('');
    const [numIdentificacao, setNumIdentificacao] = useState('');
    const [raio, setRaio] = useState('');
    const [qtdSuperiores, setQtdSuperiores] = useState('');
    const [qtdInferiores, setQtdInferiores] = useState('');
    const [tipoMatriz, setTipoMatriz] = useState(''); // 'matrizes' ou 'segmentos'
    const [qtdMatrizesSegmentos, setQtdMatrizesSegmentos] = useState('');
    const [equipamentos, setEquipamentos] = useState({
        'Fette 1200': false,
        'Fette 2200': false,
        'Fette 3200': false,
        'Fette 3090': false
    });
    const [dedicadoProduto, setDedicadoProduto] = useState(false);
    const [produtosDedicados, setProdutosDedicados] = useState([]);
    const [newProdutoCodigo, setNewProdutoCodigo] = useState('');
    const [newProdutoNome, setNewProdutoNome] = useState('');
    const [estimativaProducao, setEstimativaProducao] = useState('');
    
    // Form states - Encapsulamento
    const [tipoEncapsulamento, setTipoEncapsulamento] = useState(''); // 'pellet' ou 'pó'
    const [equipamentoEncapsulamento, setEquipamentoEncapsulamento] = useState('');
    const [numFormato, setNumFormato] = useState('');

    // Shared PDF
    const [anexoPdf, setAnexoPdf] = useState(null);
    const fileInputRef = useRef(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfToView, setPdfToView] = useState(null);

    const resetForm = () => {
        setPadraoPuncoes('');
        setMedidaPuncao('');
        setNumIdentificacao('');
        setRaio('');
        setQtdSuperiores('');
        setQtdInferiores('');
        setTipoMatriz('');
        setQtdMatrizesSegmentos('');
        setEquipamentos({'Fette 1200': false, 'Fette 2200': false, 'Fette 3200': false, 'Fette 3090': false});
        setDedicadoProduto(false);
        setProdutosDedicados([]);
        setNewProdutoCodigo('');
        setNewProdutoNome('');
        setEstimativaProducao('');
        setTipoEncapsulamento('');
        setEquipamentoEncapsulamento('');
        setNumFormato('');
        setAnexoPdf(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTabChange = (tab) => {
        setCurrentTab(tab);
        resetForm();
    };

    const handleEquipamentoChange = (eq) => {
        setEquipamentos(prev => ({ ...prev, [eq]: !prev[eq] }));
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Por favor, selecione apenas arquivos PDF.');
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (evt) => {
                setAnexoPdf(evt.target.result); // Base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitCompressao = (e) => {
        e.preventDefault();
        const selectedEquips = Object.keys(equipamentos).filter(k => equipamentos[k]);
        
        addItem({
            categoria: 'Compressão',
            padraoPuncoes,
            medidaPuncao,
            numIdentificacao,
            raio,
            qtdSuperiores: Number(qtdSuperiores),
            qtdInferiores: Number(qtdInferiores),
            tipoMatriz,
            qtdMatrizesSegmentos: Number(qtdMatrizesSegmentos),
            equipamentos: selectedEquips,
            dedicadoProduto,
            produtosDedicados,
            estimativaProducao,
            anexoPdf
        });
        resetForm();
    };

    const handleSubmitEncapsulamento = (e) => {
        e.preventDefault();
        addItem({
            categoria: 'Encapsulamento',
            tipo: tipoEncapsulamento,
            equipamento: equipamentoEncapsulamento,
            numFormato,
            anexoPdf
        });
        resetForm();
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        let updates = {};
        
        if (detailsItem.categoria === 'Compressão') {
            const selectedEquips = Object.keys(equipamentos).filter(k => equipamentos[k]);
            updates = {
                padraoPuncoes, medidaPuncao, numIdentificacao, raio,
                qtdSuperiores: Number(qtdSuperiores), qtdInferiores: Number(qtdInferiores),
                tipoMatriz, qtdMatrizesSegmentos: Number(qtdMatrizesSegmentos),
                equipamentos: selectedEquips,
                dedicadoProduto, produtosDedicados,
                estimativaProducao,
                anexoPdf: anexoPdf || detailsItem.anexoPdf // Keep existing if not changed
            };
        } else {
            updates = {
                tipo: tipoEncapsulamento,
                equipamento: equipamentoEncapsulamento,
                numFormato,
                anexoPdf: anexoPdf || detailsItem.anexoPdf
            };
        }

        updateItem(detailsItem.id, updates);
        setDetailsItem({ ...detailsItem, ...updates });
        setIsEditing(false);
    };

    const renderProdutosSection = () => (
        <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)' }}>
            <h4 className="mb-2">Produtos Dedicados</h4>
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

    const renderPdfUploader = () => (
        <div className="form-group mt-4 p-4" style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius)', textAlign: 'center' }}>
            <Upload size={32} className="text-secondary mb-2" style={{ margin: '0 auto' }} />
            <label style={{ display: 'block', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 600 }}>
                Clique aqui para anexar Projeto/PDF
                <input type="file" accept="application/pdf" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
            </label>
            {anexoPdf && <div className="text-success mt-2 flex items-center justify-center gap-2"><FileText size={16} /> Arquivo PDF selecionado.</div>}
            {isEditing && !anexoPdf && detailsItem.anexoPdf && <div className="text-secondary mt-2 flex items-center justify-center gap-2"><FileText size={16} /> Arquivo atual já existe. (Envie novo para substituir)</div>}
        </div>
    );

    const renderFormFieldsCompressao = () => (
        <>
            <div className="form-group">
                <label>Padrão dos punções</label>
                <select className="form-control" required value={padraoPuncoes} onChange={e => setPadraoPuncoes(e.target.value)}>
                    <option value="" disabled>Selecione o padrão</option>
                    <option value="EU19 - FS12">EU19 - FS12</option>
                    <option value="EU19 - BB">EU19 - BB</option>
                    <option value="EU19 - BBS">EU19 - BBS</option>
                    <option value='EU 1"'>EU 1"</option>
                    <option value='EU 1" - 441'>EU 1" - 441</option>
                </select>
            </div>

            <div className="flex gap-4">
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Medida do Punção</label>
                    <input type="text" className="form-control" required value={medidaPuncao} onChange={e => setMedidaPuncao(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Raio</label>
                    <input type="text" className="form-control" required value={raio} onChange={e => setRaio(e.target.value)} />
                </div>
            </div>

            <div className="form-group">
                <label>Número de Identificação do Conjunto</label>
                <input type="text" className="form-control" required value={numIdentificacao} onChange={e => setNumIdentificacao(e.target.value)} />
            </div>

            <div className="flex gap-4">
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Qtd. Punções Superiores</label>
                    <input type="number" className="form-control" required value={qtdSuperiores} onChange={e => setQtdSuperiores(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Qtd. Punções Inferiores</label>
                    <input type="number" className="form-control" required value={qtdInferiores} onChange={e => setQtdInferiores(e.target.value)} />
                </div>
            </div>

            <div className="form-group p-3" style={{ border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <label className="mb-3 block">Tipo de Conjunto Inferior</label>
                <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tipoMatriz" required value="matrizes" checked={tipoMatriz === 'matrizes'} onChange={e => setTipoMatriz(e.target.value)} /> Matrizes
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tipoMatriz" required value="segmentos" checked={tipoMatriz === 'segmentos'} onChange={e => setTipoMatriz(e.target.value)} /> Segmentos
                    </label>
                </div>
                {tipoMatriz && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Quantidade de {tipoMatriz === 'matrizes' ? 'Matrizes' : 'Segmentos'}</label>
                        <input type="number" className="form-control" required value={qtdMatrizesSegmentos} onChange={e => setQtdMatrizesSegmentos(e.target.value)} />
                    </div>
                )}
            </div>

            <div className="form-group mt-4">
                <label className="mb-2 block">Atende quais equipamentos?</label>
                <div className="flex gap-4 flex-wrap">
                    {['Fette 1200', 'Fette 2200', 'Fette 3200', 'Fette 3090'].map(eq => (
                        <label key={eq} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={equipamentos[eq]} onChange={() => handleEquipamentoChange(eq)} /> {eq}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group mt-4">
                <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={dedicadoProduto} onChange={e => setDedicadoProduto(e.target.checked)} />
                    É dedicado para algum produto?
                </label>
            </div>
            {dedicadoProduto && renderProdutosSection()}

            <div className="form-group mt-4">
                <label>Estimativa de quantidade de comprimidos produzidos</label>
                <input type="text" className="form-control" value={estimativaProducao} onChange={e => setEstimativaProducao(e.target.value)} placeholder="Ex: 5.000.000" />
            </div>

            {renderPdfUploader()}
        </>
    );

    const renderFormFieldsEncapsulamento = () => (
        <>
            <div className="form-group">
                <label className="mb-2 block">Tipo</label>
                <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tipoEnc" required value="pellet" checked={tipoEncapsulamento === 'pellet'} onChange={e => setTipoEncapsulamento(e.target.value)} /> Pellet
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tipoEnc" required value="pó" checked={tipoEncapsulamento === 'pó'} onChange={e => setTipoEncapsulamento(e.target.value)} /> Pó
                    </label>
                </div>
            </div>

            <div className="form-group">
                <label>Equipamento</label>
                <input type="text" className="form-control" required value={equipamentoEncapsulamento} onChange={e => setEquipamentoEncapsulamento(e.target.value)} />
            </div>

            <div className="form-group">
                <label>Número do Formato</label>
                <input type="text" className="form-control" required value={numFormato} onChange={e => setNumFormato(e.target.value)} />
            </div>

            {renderPdfUploader()}
        </>
    );

    const renderFormCompressao = () => (
        <form onSubmit={handleSubmitCompressao} className="card p-4 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="mb-4">Cadastro de Compressão</h3>
            {renderFormFieldsCompressao()}
            <button type="submit" className="btn btn-primary mt-4">Salvar Cadastro</button>
        </form>
    );

    const renderFormEncapsulamento = () => (
        <form onSubmit={handleSubmitEncapsulamento} className="card p-4 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="mb-4">Cadastro de Encapsulamento</h3>
            {renderFormFieldsEncapsulamento()}
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

        const openPdf = (pdfBase64) => {
            setPdfToView(pdfBase64);
            setShowPdfModal(true);
        };

        const openDetails = (item) => {
            setDetailsItem(item);
            setIsEditing(false);
            setShowDetails(true);
        };

        const renderTableHeaders = () => {
            if (listCategoryFilter === 'Todas') return <tr><th>Categoria</th><th>TAG / Identificação</th><th>Equipamento</th><th className="text-center">Ações</th></tr>;
            if (listCategoryFilter === 'Compressão') return <tr><th>ID Conjunto</th><th>Medida</th><th>Equipamentos</th><th className="text-center">Ações</th></tr>;
            if (listCategoryFilter === 'Encapsulamento') return <tr><th>Número Formato</th><th>Tipo</th><th>Equipamento</th><th className="text-center">Ações</th></tr>;
        };

        const renderTableRow = (item) => {
            const isCompressao = item.categoria === 'Compressão';
            const limitReached = isCompressao && item.estimativaProducao ? ((item.comprimidosProduzidosTotais || 0) / item.estimativaProducao) >= 0.7 : false;
            
            const trStyle = limitReached ? { backgroundColor: '#FEF2F2', borderLeft: '4px solid var(--danger-color)' } : {};

            const actions = (
                <td style={{ verticalAlign: 'middle' }}>
                    <div className="flex justify-center gap-2">
                        {item.anexoPdf && <button className="btn btn-icon" onClick={() => openPdf(item.anexoPdf)} title="Ver Projeto/PDF"><FileText size={18} /></button>}
                        <button className="btn btn-icon" onClick={() => openDetails(item)} title="Ver Detalhes"><Eye size={18} /></button>
                        <button className="btn btn-icon" onClick={() => openHistory(item)} title="Histórico"><History size={18} /></button>
                        <button className="btn btn-icon text-danger" onClick={() => setItemToDelete(item)} title="Excluir"><Trash2 size={18} color="var(--danger-color)" /></button>
                    </div>
                </td>
            );

            if (listCategoryFilter === 'Todas') return (
                <tr key={item.id} style={trStyle}>
                    <td>
                        <div className="flex items-center gap-2">
                            {limitReached && <AlertTriangle size={16} className="text-danger" title="Atenção: Este conjunto atingiu 70% ou mais da estimativa de produção!" />}
                            <strong>{item.categoria}</strong>
                        </div>
                    </td>
                    <td>{item.numIdentificacao || item.numFormato}</td>
                    <td>{item.categoria === 'Compressão' ? (item.equipamentos?.join(', ') || '-') : item.equipamento}</td>
                    {actions}
                </tr>
            );
            if (listCategoryFilter === 'Compressão') return (
                <tr key={item.id} style={trStyle}>
                    <td>
                        <div className="flex items-center gap-2">
                            {limitReached && <AlertTriangle size={16} className="text-danger" title="Atenção: Este conjunto atingiu 70% ou mais da estimativa de produção!" />}
                            <strong>{item.numIdentificacao}</strong>
                        </div>
                    </td>
                    <td>{item.medidaPuncao}</td>
                    <td>{item.equipamentos?.join(', ') || '-'}</td>
                    {actions}
                </tr>
            );
            if (listCategoryFilter === 'Encapsulamento') return (
                <tr key={item.id}>
                    <td><strong>{item.numFormato}</strong></td>
                    <td>{item.tipo}</td>
                    <td>{item.equipamento}</td>
                    {actions}
                </tr>
            );
        };

        return (
            <div className="animate-fade-in">
                <div className="tabs mb-4" style={{ display: 'inline-flex', padding: '0.25rem', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>
                    {['Todas', 'Compressão', 'Encapsulamento'].map(cat => (
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
                                <tr><td colSpan="4" className="text-center py-4 text-secondary">Nenhum item encontrado.</td></tr>
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
        if (detailsItem.categoria === 'Compressão') {
            setPadraoPuncoes(detailsItem.padraoPuncoes || '');
            setMedidaPuncao(detailsItem.medidaPuncao || '');
            setNumIdentificacao(detailsItem.numIdentificacao || '');
            setRaio(detailsItem.raio || '');
            setQtdSuperiores(detailsItem.qtdSuperiores || '');
            setQtdInferiores(detailsItem.qtdInferiores || '');
            setTipoMatriz(detailsItem.tipoMatriz || '');
            setQtdMatrizesSegmentos(detailsItem.qtdMatrizesSegmentos || '');
            
            const eqs = {'Fette 1200': false, 'Fette 2200': false, 'Fette 3200': false, 'Fette 3090': false};
            detailsItem.equipamentos?.forEach(e => eqs[e] = true);
            setEquipamentos(eqs);
            
            setDedicadoProduto(detailsItem.dedicadoProduto || false);
            setProdutosDedicados(detailsItem.produtosDedicados || []);
            setEstimativaProducao(detailsItem.estimativaProducao || '');
        } else {
            setTipoEncapsulamento(detailsItem.tipo || '');
            setEquipamentoEncapsulamento(detailsItem.equipamento || '');
            setNumFormato(detailsItem.numFormato || '');
        }
        setAnexoPdf(null); // Leave empty unless they upload a new one
        setIsEditing(true);
    };

    const resumo = {
        Compressao: items.filter(i => i.categoria === 'Compressão').length,
        Encapsulamento: items.filter(i => i.categoria === 'Encapsulamento').length
    };

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'Cadastros Compressão' }]} />
            <div className="container" style={{ position: 'relative', minHeight: '80vh' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/gestao-ferramental" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Cadastros Compressão</h2>
                    </div>
                    {currentTab !== 'itens_cadastrados' && (
                        <button className="btn btn-secondary flex items-center gap-2" onClick={() => handleTabChange('itens_cadastrados')}>
                            <List size={18} /> Itens Cadastrados
                        </button>
                    )}
                </div>

                {currentTab !== 'itens_cadastrados' && (
                    <div className="tabs mb-4">
                        <button className={`tab ${currentTab === 'compressao' ? 'active' : ''}`} onClick={() => handleTabChange('compressao')}>Compressão</button>
                        <button className={`tab ${currentTab === 'encapsulamento' ? 'active' : ''}`} onClick={() => handleTabChange('encapsulamento')}>Encapsulamento</button>
                    </div>
                )}

                {currentTab === 'compressao' && renderFormCompressao()}
                {currentTab === 'encapsulamento' && renderFormEncapsulamento()}
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
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', color: 'var(--primary-color)' }}>Resumo</div>
                            <div className="flex flex-col gap-1">
                                <span>Compressão: <strong>{resumo.Compressao}</strong></span>
                                <span>Encapsulamento: <strong>{resumo.Encapsulamento}</strong></span>
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
                                <strong>Item:</strong> {historyItem.categoria} - {historyItem.numIdentificacao || historyItem.numFormato}
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
                                        {detailsItem.categoria === 'Compressão' ? (
                                            <>
                                                <div><span className="text-secondary block text-sm">Padrão</span><strong>{detailsItem.padraoPuncoes}</strong></div>
                                                <div><span className="text-secondary block text-sm">Medida</span><strong>{detailsItem.medidaPuncao}</strong></div>
                                                <div><span className="text-secondary block text-sm">ID Conjunto</span><strong>{detailsItem.numIdentificacao}</strong></div>
                                                <div><span className="text-secondary block text-sm">Raio</span><strong>{detailsItem.raio}</strong></div>
                                                <div><span className="text-secondary block text-sm">Estimativa Produzida</span><strong>{detailsItem.estimativaProducao || '-'}</strong></div>
                                                <div><span className="text-secondary block text-sm">Qtd. Superiores</span><strong>{detailsItem.qtdSuperiores}</strong></div>
                                                <div><span className="text-secondary block text-sm">Qtd. Inferiores</span><strong>{detailsItem.qtdInferiores}</strong></div>
                                                <div style={{ gridColumn: '1 / -1' }}><span className="text-secondary block text-sm">Tipo Conjunto Inferior</span><strong>{detailsItem.qtdMatrizesSegmentos} {detailsItem.tipoMatriz}</strong></div>
                                                
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <span className="text-secondary block text-sm mb-1">Equipamentos</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {detailsItem.equipamentos?.map((eq, i) => <span key={i} className="badge badge-primary">{eq}</span>)}
                                                    </div>
                                                </div>

                                                {(detailsItem.dedicadoProduto !== undefined || detailsItem.produtosDedicados?.length > 0) && (
                                                    <div style={{ gridColumn: '1 / -1' }}>
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
                                            </>
                                        ) : (
                                            <>
                                                <div><span className="text-secondary block text-sm">Tipo</span><strong>{detailsItem.tipo}</strong></div>
                                                <div><span className="text-secondary block text-sm">Equipamento</span><strong>{detailsItem.equipamento}</strong></div>
                                                <div><span className="text-secondary block text-sm">Número Formato</span><strong>{detailsItem.numFormato}</strong></div>
                                            </>
                                        )}
                                    </div>
                                    
                                    {detailsItem.anexoPdf && (
                                        <div className="mt-2 p-3 bg-light rounded flex items-center justify-between" style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
                                            <div className="flex items-center gap-2"><FileText size={18} className="text-primary"/> <strong>Projeto/PDF</strong> Anexado</div>
                                            <button className="btn btn-secondary btn-sm" onClick={() => { setShowPdfModal(true); setPdfToView(detailsItem.anexoPdf); }}>Visualizar</button>
                                        </div>
                                    )}

                                    <div className="modal-footer mt-4">
                                        <button className="btn btn-secondary" onClick={() => setShowDetails(false)}>Fechar</button>
                                        <button className="btn btn-primary" onClick={startEdit}><Edit2 size={16} /> Editar Item</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdate} className="flex flex-col gap-4 p-2">
                                    {detailsItem.categoria === 'Compressão' ? renderFormFieldsCompressao() : renderFormFieldsEncapsulamento()}
                                    <div className="modal-footer mt-4">
                                        <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary"><Save size={16} /> Salvar Alterações</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal Visualizador de PDF */}
                {showPdfModal && pdfToView && (
                    <div className="modal-overlay active" style={{ zIndex: 1005, padding: '1rem' }}>
                        <div className="modal-content" style={{ maxWidth: '900px', width: '100%', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
                            <div className="modal-header">
                                <h3 className="modal-title flex items-center gap-2"><FileText size={20} /> Visualizador de Projeto/PDF</h3>
                                <button className="modal-close" onClick={() => { setShowPdfModal(false); setPdfToView(null); }}><X /></button>
                            </div>
                            <div style={{ flex: 1, backgroundColor: '#525659', borderRadius: '4px', overflow: 'hidden' }}>
                                <iframe 
                                    src={`${pdfToView}#toolbar=1&navpanes=0&scrollbar=1`} 
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 'none' }}
                                    title="PDF Viewer"
                                ></iframe>
                            </div>
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
                                <strong style={{ color: 'var(--text-color)' }}>{itemToDelete.categoria} - {itemToDelete.numIdentificacao || itemToDelete.numFormato}</strong>
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
