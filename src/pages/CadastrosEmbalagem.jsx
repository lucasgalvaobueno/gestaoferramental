import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useEmbalagem } from '../contexts/EmbalagemContext';
import { ArrowLeft, Plus, X, List, History, User, FileText, Upload, Info, Eye, Edit2, Save, Trash2, Box, Filter, Search } from 'lucide-react';

const MultiSelectDropdown = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
            <label className="mb-2 block">{label} (Pode adicionar mais de um)</label>
            <div 
                className="form-control flex items-center justify-between cursor-pointer" 
                onClick={() => setIsOpen(!isOpen)}
                style={{ minHeight: '38px', backgroundColor: 'var(--background-color)' }}
            >
                <span className="text-secondary">
                    {selected.length === 0 ? 'Selecione as opções...' : `${selected.length} item(ns) selecionado(s)`}
                </span>
                <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▼</span>
            </div>
            {isOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '4px' }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={16} className="text-secondary" />
                        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }} />
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                        {filteredOptions.length === 0 ? (
                            <div className="p-2 text-secondary text-sm">Nenhuma opção encontrada.</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-light" style={{ borderRadius: '4px', margin: 0 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selected.includes(opt.id)} 
                                        onChange={(e) => {
                                            if(e.target.checked) onChange([...selected, opt.id]);
                                            else onChange(selected.filter(id => id !== opt.id));
                                        }} 
                                    /> 
                                    {opt.label}
                                </label>
                            ))
                        )}
                    </div>
                </div>
            )}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selected.map(id => {
                        const opt = options.find(o => o.id === id);
                        return opt ? (
                            <span key={id} className="badge badge-primary flex items-center gap-1" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                                {opt.label}
                                <X size={14} className="cursor-pointer" onClick={() => onChange(selected.filter(s => s !== id))} />
                            </span>
                        ) : null;
                    })}
                </div>
            )}
        </div>
    );
};

export default function CadastrosEmbalagem() {
    const { items, logs, addItem, updateItem, deleteItem } = useEmbalagem();

    const [currentTab, setCurrentTab] = useState(''); // '', 'BPF5-50', 'MEDISEAL', 'itens_cadastrados'
    const [subCategoria, setSubCategoria] = useState('');
    
    // Filters for Itens Cadastrados
    const [listCategoryFilter, setListCategoryFilter] = useState('Todas');
    const [listSubCategoriaFilter, setListSubCategoriaFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortAsc, setSortAsc] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    
    // Subcategory definitions for BPF5-50
    const bpfSubCats = [
        'Guias de alimentação', 'Guias do corte', 'Formação superior', 'Formação inferior',
        'Selagem superior', 'Selagem inferior', 'Alimentador universal', 'Alimentador dedicado',
        'Formato dedicado', 'Laço do filme', 'Ciclóide', 'Escovas', 'Facas'
    ];
    // Subcategory definitions for MEDISEAL
    const medisealSubCats = [
        'Alimentador universal', 'Calha', 'Rolo de selagem', 'Formação superior e inferior',
        'Escovas', 'Facas'
    ];

    // UI states
    const [showHistory, setShowHistory] = useState(false);
    const [historyItem, setHistoryItem] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [detailsItem, setDetailsItem] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showSummary, setShowSummary] = useState(false);

    // Common/Specific fields
    const [tag, setTag] = useState('');
    const [tamanhoBlister, setTamanhoBlister] = useState('');
    const [espessuraMin, setEspessuraMin] = useState('');
    const [espessuraMax, setEspessuraMax] = useState('');
    const [qtdBlisters, setQtdBlisters] = useState('');
    const [profundidadeBolha, setProfundidadeBolha] = useState('');
    const [faca, setFaca] = useState('');
    const [cunha, setCunha] = useState('');
    const [numFerramenta, setNumFerramenta] = useState('');
    
    // Arrays for multiple select / relation
    const [selectedGuiasAlimentacao, setSelectedGuiasAlimentacao] = useState([]);
    const [selectedGuiasCorte, setSelectedGuiasCorte] = useState([]);
    const [selectedRolosSelagem, setSelectedRolosSelagem] = useState([]);
    
    const [produtosDedicados, setProdutosDedicados] = useState([]);
    const [newProdutoCodigo, setNewProdutoCodigo] = useState('');
    const [newProdutoNome, setNewProdutoNome] = useState('');

    const [anexoPdf, setAnexoPdf] = useState(null);
    const fileInputRef = useRef(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfToView, setPdfToView] = useState(null);

    const resetForm = () => {
        setTag('');
        setTamanhoBlister('');
        setEspessuraMin('');
        setEspessuraMax('');
        setQtdBlisters('');
        setProfundidadeBolha('');
        setFaca('');
        setCunha('');
        setNumFerramenta('');
        setSelectedGuiasAlimentacao([]);
        setSelectedGuiasCorte([]);
        setSelectedRolosSelagem([]);
        setProdutosDedicados([]);
        setNewProdutoCodigo('');
        setNewProdutoNome('');
        setAnexoPdf(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTabChange = (tab) => {
        setCurrentTab(tab);
        setSubCategoria('');
        resetForm();
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

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const payload = {
            equipamento: currentTab,
            subcategoria: subCategoria,
            tag,
            tamanhoBlister,
            espessuraMin,
            espessuraMax,
            qtdBlisters,
            profundidadeBolha,
            faca,
            cunha,
            numFerramenta,
            selectedGuiasAlimentacao,
            selectedGuiasCorte,
            selectedRolosSelagem,
            produtosDedicados,
            anexoPdf
        };

        addItem(payload);
        resetForm();
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        
        const updates = {
            tag,
            tamanhoBlister,
            espessuraMin,
            espessuraMax,
            qtdBlisters,
            profundidadeBolha,
            faca,
            cunha,
            numFerramenta,
            selectedGuiasAlimentacao,
            selectedGuiasCorte,
            selectedRolosSelagem,
            produtosDedicados,
            anexoPdf: anexoPdf || detailsItem.anexoPdf
        };

        updateItem(detailsItem.id, updates);
        setDetailsItem({ ...detailsItem, ...updates });
        setIsEditing(false);
    };

    // --- RENDER HELPERS --- //
    const renderPdfUploader = () => (
        <div className="form-group mt-4 p-4" style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius)', textAlign: 'center' }}>
            <Upload size={32} className="text-secondary mb-2" style={{ margin: '0 auto' }} />
            <label style={{ display: 'block', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 600 }}>
                Clique aqui para anexar Projeto/PDF
                <input type="file" accept="application/pdf" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
            </label>
            {anexoPdf && <div className="text-success mt-2 flex items-center justify-center gap-2"><FileText size={16} /> Arquivo PDF selecionado.</div>}
            {isEditing && !anexoPdf && detailsItem?.anexoPdf && <div className="text-secondary mt-2 flex items-center justify-center gap-2"><FileText size={16} /> Arquivo atual já existe. (Envie novo para substituir)</div>}
        </div>
    );

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

    // Options for dropdowns
    const guiasAlimentacaoOptions = items
        .filter(i => i.equipamento === currentTab && i.subcategoria === 'Guias de alimentação')
        .map(i => ({ id: i.id, label: i.tag || i.tamanhoBlister || 'Sem TAG' }));
        
    const guiasCorteOptions = items
        .filter(i => i.equipamento === currentTab && i.subcategoria === 'Guias do corte')
        .map(i => ({ id: i.id, label: i.tag || 'Sem TAG' }));

    const rolosSelagemOptions = items
        .filter(i => i.equipamento === 'MEDISEAL' && i.subcategoria === 'Rolo de selagem')
        .map(i => ({ id: i.id, label: i.tag || 'Sem TAG' }));

    // RENDER FORM FIELDS BASED ON SUBCATEGORY
    const renderFields = () => {
        if (!subCategoria) return null;

        // BPF5-50
        if (subCategoria === 'Guias de alimentação') return (
            <>
                <div className="form-group"><label>TAG</label><input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} /></div>
                <div className="form-group"><label>Tamanho do Blíster</label><input type="text" className="form-control" required value={tamanhoBlister} onChange={e => setTamanhoBlister(e.target.value)} /></div>
            </>
        );
        if (subCategoria === 'Guias do corte') return (
            <>
                <div className="form-group"><label>TAG</label><input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} /></div>
                <div className="flex gap-4">
                    <div className="form-group flex-1"><label>Espessura Mínima</label><input type="text" className="form-control" required value={espessuraMin} onChange={e => setEspessuraMin(e.target.value)} /></div>
                    <div className="form-group flex-1"><label>Espessura Máxima</label><input type="text" className="form-control" required value={espessuraMax} onChange={e => setEspessuraMax(e.target.value)} /></div>
                </div>
            </>
        );
        if (subCategoria === 'Formação superior') return (
            <div className="form-group"><label>Quantidade de Blísters</label><input type="number" className="form-control" required value={qtdBlisters} onChange={e => setQtdBlisters(e.target.value)} /></div>
        );
        if (subCategoria === 'Formação inferior') return (
            <>
                <div className="form-group"><label>TAG</label><input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} /></div>
                <div className="flex gap-4">
                    <div className="form-group flex-1"><label>Tamanho do Blíster</label><input type="text" className="form-control" required value={tamanhoBlister} onChange={e => setTamanhoBlister(e.target.value)} /></div>
                    <div className="form-group flex-1"><label>Profundidade da Bolha</label><input type="text" className="form-control" required value={profundidadeBolha} onChange={e => setProfundidadeBolha(e.target.value)} /></div>
                    <div className="form-group flex-1"><label>Faca</label><input type="text" className="form-control" required value={faca} onChange={e => setFaca(e.target.value)} /></div>
                </div>
                <MultiSelectDropdown label="Guias de Alimentação" options={guiasAlimentacaoOptions} selected={selectedGuiasAlimentacao} onChange={setSelectedGuiasAlimentacao} />
                <MultiSelectDropdown label="Guias do Corte" options={guiasCorteOptions} selected={selectedGuiasCorte} onChange={setSelectedGuiasCorte} />
                {renderProdutosSection()}
                {renderPdfUploader()}
            </>
        );
        if (subCategoria === 'Selagem superior') return (
            <div className="form-group"><label>QTD Blíster</label><input type="number" className="form-control" required value={qtdBlisters} onChange={e => setQtdBlisters(e.target.value)} /></div>
        );
        if (subCategoria === 'Selagem inferior') return (
            <>
                <div className="form-group"><label>TAG</label><input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} /></div>
                <div className="flex gap-4">
                    <div className="form-group flex-1"><label>Tamanho do Blíster</label><input type="text" className="form-control" required value={tamanhoBlister} onChange={e => setTamanhoBlister(e.target.value)} /></div>
                    <div className="form-group flex-1"><label>Faca</label><input type="text" className="form-control" required value={faca} onChange={e => setFaca(e.target.value)} /></div>
                </div>
                <MultiSelectDropdown label="Guias de Alimentação" options={guiasAlimentacaoOptions} selected={selectedGuiasAlimentacao} onChange={setSelectedGuiasAlimentacao} />
                <MultiSelectDropdown label="Guias do Corte" options={guiasCorteOptions} selected={selectedGuiasCorte} onChange={setSelectedGuiasCorte} />
                {renderPdfUploader()}
            </>
        );
        if (subCategoria === 'Alimentador universal') return (
            <>
                <div className="form-group"><label>TAG</label><input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} /></div>
                {currentTab === 'BPF5-50' && <div className="form-group"><label>Cunha Compatível</label><input type="text" className="form-control" required value={cunha} onChange={e => setCunha(e.target.value)} /></div>}
            </>
        );
        if (subCategoria === 'Alimentador dedicado' || subCategoria === 'Calha' || subCategoria === 'Rolo de selagem' || subCategoria === 'Escovas') return (
            <div className="form-group"><label>TAG</label><input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} /></div>
        );
        if (subCategoria === 'Formato dedicado') return (
            <>
                <div className="form-group"><label>TAG</label><input type="text" className="form-control" required value={tag} onChange={e => setTag(e.target.value)} /></div>
                <div className="flex gap-4">
                    <div className="form-group flex-1"><label>Espessura Mínima do Tubo</label><input type="text" className="form-control" required value={espessuraMin} onChange={e => setEspessuraMin(e.target.value)} /></div>
                    <div className="form-group flex-1"><label>Espessura Máxima do Tubo</label><input type="text" className="form-control" required value={espessuraMax} onChange={e => setEspessuraMax(e.target.value)} /></div>
                </div>
            </>
        );
        if (subCategoria === 'Laço do filme' || subCategoria === 'Ciclóide' || subCategoria === 'Facas') return (
            <div className="form-group"><label>Tamanho do Blíster</label><input type="text" className="form-control" required value={tamanhoBlister} onChange={e => setTamanhoBlister(e.target.value)} /></div>
        );
        // MEDISEAL specific
        if (subCategoria === 'Formação superior e inferior') return (
            <>
                <div className="flex gap-4">
                    <div className="form-group flex-1"><label>Número da Ferramenta</label><input type="text" className="form-control" required value={numFerramenta} onChange={e => setNumFerramenta(e.target.value)} /></div>
                    <div className="form-group flex-1"><label>Profundidade da Bolha</label><input type="text" className="form-control" required value={profundidadeBolha} onChange={e => setProfundidadeBolha(e.target.value)} /></div>
                </div>
                <MultiSelectDropdown label="Rolo de Selagem" options={rolosSelagemOptions} selected={selectedRolosSelagem} onChange={setSelectedRolosSelagem} />
                {renderProdutosSection()}
                {renderPdfUploader()}
            </>
        );

        return null;
    };

    const startEdit = () => {
        setTag(detailsItem.tag || '');
        setTamanhoBlister(detailsItem.tamanhoBlister || '');
        setEspessuraMin(detailsItem.espessuraMin || '');
        setEspessuraMax(detailsItem.espessuraMax || '');
        setQtdBlisters(detailsItem.qtdBlisters || '');
        setProfundidadeBolha(detailsItem.profundidadeBolha || '');
        setFaca(detailsItem.faca || '');
        setCunha(detailsItem.cunha || '');
        setNumFerramenta(detailsItem.numFerramenta || '');
        setSelectedGuiasAlimentacao(detailsItem.selectedGuiasAlimentacao || []);
        setSelectedGuiasCorte(detailsItem.selectedGuiasCorte || []);
        setSelectedRolosSelagem(detailsItem.selectedRolosSelagem || []);
        setProdutosDedicados(detailsItem.produtosDedicados || []);
        
        setCurrentTab(detailsItem.equipamento);
        setSubCategoria(detailsItem.subcategoria);
        setAnexoPdf(null); 
        setIsEditing(true);
    };

    const renderItensCadastrados = () => {
        let list = items;
        if (listCategoryFilter !== 'Todas') {
            list = items.filter(i => i.equipamento === listCategoryFilter);
        }
        if (listSubCategoriaFilter) {
            list = list.filter(i => i.subcategoria === listSubCategoriaFilter);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(i => 
                (i.tag && i.tag.toLowerCase().includes(q)) ||
                (i.tamanhoBlister && i.tamanhoBlister.toLowerCase().includes(q)) ||
                (i.numFerramenta && i.numFerramenta.toLowerCase().includes(q)) ||
                (i.subcategoria && i.subcategoria.toLowerCase().includes(q))
            );
        }
        list.sort((a, b) => {
            const valA = (a.tag || a.tamanhoBlister || a.numFerramenta || '').toLowerCase();
            const valB = (b.tag || b.tamanhoBlister || b.numFerramenta || '').toLowerCase();
            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });

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

        const getIdentificacao = (item) => {
            if (item.tag) return item.tag;
            if (item.numFerramenta) return item.numFerramenta;
            if (item.tamanhoBlister) return `Blíster: ${item.tamanhoBlister}`;
            if (item.qtdBlisters) return `Qtd: ${item.qtdBlisters}`;
            return '-';
        };

        const renderTableHeaders = () => {
            if (!listSubCategoriaFilter) {
                return (
                    <tr>
                        <th>Equipamento</th>
                        <th>Tipo de Cadastro</th>
                        <th>Identificação</th>
                        <th>Status</th>
                        <th className="text-center">Ações</th>
                    </tr>
                );
            }
            const sub = listSubCategoriaFilter;
            return (
                <tr>
                    {['Guias de alimentação', 'Guias do corte', 'Formação inferior', 'Selagem inferior', 'Alimentador universal', 'Alimentador dedicado', 'Formato dedicado', 'Escovas', 'Calha', 'Rolo de selagem'].includes(sub) && <th>TAG</th>}
                    {['Guias de alimentação', 'Formação inferior', 'Selagem inferior', 'Laço do filme', 'Ciclóide', 'Facas'].includes(sub) && <th>Tamanho Blíster</th>}
                    {['Guias do corte'].includes(sub) && <th>Espessura (Min - Max)</th>}
                    {['Formato dedicado'].includes(sub) && <th>Espessura Tubo (Min - Max)</th>}
                    {['Formação superior', 'Selagem superior'].includes(sub) && <th>Qtd Blísters</th>}
                    {['Formação inferior', 'Formação superior e inferior'].includes(sub) && <th>Prof. Bolha</th>}
                    {['Formação inferior', 'Selagem inferior'].includes(sub) && <th>Faca</th>}
                    {['Alimentador universal'].includes(sub) && <th>Cunha Compatível</th>}
                    {['Formação superior e inferior'].includes(sub) && <th>Num. Ferramenta</th>}
                    <th>Status</th>
                    <th className="text-center">Ações</th>
                </tr>
            );
        };

        const renderTableRow = (item) => {
            const actions = (
                <td className="text-center">
                    <div className="flex justify-center gap-2">
                        {item.anexoPdf && <button className="btn btn-icon" onClick={() => openPdf(item.anexoPdf)} title="Ver Projeto/PDF"><FileText size={18} /></button>}
                        <button className="btn btn-icon" onClick={() => openDetails(item)} title="Ver Detalhes"><Eye size={18} /></button>
                        <button className="btn btn-icon" onClick={() => openHistory(item)} title="Histórico"><History size={18} /></button>
                        <button className="btn btn-icon text-danger" onClick={() => setItemToDelete(item)} title="Excluir"><Trash2 size={18} color="var(--danger-color)" /></button>
                    </div>
                </td>
            );

            if (!listSubCategoriaFilter) {
                return (
                    <tr key={item.id}>
                        <td><strong>{item.equipamento}</strong></td>
                        <td>{item.subcategoria}</td>
                        <td>{getIdentificacao(item)}</td>
                        <td>{item.statusDanificado ? <span className="badge bg-danger/10 text-danger border border-danger/20 text-xs">Danificado</span> : <span className="badge bg-success/10 text-success border border-success/20 text-xs">Operacional</span>}</td>
                        {actions}
                    </tr>
                );
            }

            const sub = listSubCategoriaFilter;
            return (
                <tr key={item.id}>
                    {['Guias de alimentação', 'Guias do corte', 'Formação inferior', 'Selagem inferior', 'Alimentador universal', 'Alimentador dedicado', 'Formato dedicado', 'Escovas', 'Calha', 'Rolo de selagem'].includes(sub) && <td><strong>{item.tag || '-'}</strong></td>}
                    {['Guias de alimentação', 'Formação inferior', 'Selagem inferior', 'Laço do filme', 'Ciclóide', 'Facas'].includes(sub) && <td>{item.tamanhoBlister || '-'}</td>}
                    {['Guias do corte'].includes(sub) && <td>{item.espessuraMin || '-'} / {item.espessuraMax || '-'}</td>}
                    {['Formato dedicado'].includes(sub) && <td>{item.espessuraMin || '-'} / {item.espessuraMax || '-'}</td>}
                    {['Formação superior', 'Selagem superior'].includes(sub) && <td>{item.qtdBlisters || '-'}</td>}
                    {['Formação inferior', 'Formação superior e inferior'].includes(sub) && <td>{item.profundidadeBolha || '-'}</td>}
                    {['Formação inferior', 'Selagem inferior'].includes(sub) && <td>{item.faca || '-'}</td>}
                    {['Alimentador universal'].includes(sub) && <td>{item.cunha || '-'}</td>}
                    {['Formação superior e inferior'].includes(sub) && <td>{item.numFerramenta || '-'}</td>}
                    <td>{item.statusDanificado ? <span className="badge bg-danger/10 text-danger border border-danger/20 text-xs">Danificado</span> : <span className="badge bg-success/10 text-success border border-success/20 text-xs">Operacional</span>}</td>
                    {actions}
                </tr>
            );
        };

        return (
            <div className="animate-fade-in">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="tabs" style={{ display: 'inline-flex', padding: '0.25rem', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>
                            {['Todas', 'BPF5-50', 'MEDISEAL'].map(cat => (
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
                        <button className="btn btn-secondary flex items-center gap-2" onClick={() => setShowFilters(!showFilters)}>
                            <Filter size={18} /> Filtros e Busca
                        </button>
                    </div>

                    {showFilters && (
                        <div className="card p-4 animate-fade-in flex flex-wrap gap-4 items-end" style={{ backgroundColor: 'var(--background-color)' }}>
                            <div className="form-group mb-0" style={{ flex: 1, minWidth: '200px' }}>
                                <label>Categoria Específica</label>
                                <select className="form-control" value={listSubCategoriaFilter} onChange={e => setListSubCategoriaFilter(e.target.value)}>
                                    <option value="">Todas</option>
                                    <optgroup label="BPF5-50">
                                        {bpfSubCats.map(s => <option key={`bpf-${s}`} value={s}>{s}</option>)}
                                    </optgroup>
                                    <optgroup label="MEDISEAL">
                                        {medisealSubCats.map(s => <option key={`med-${s}`} value={s}>{s}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            <div className="form-group mb-0" style={{ flex: 2, minWidth: '200px' }}>
                                <label>Buscar (Tag/Medida/Ferramenta)</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} className="text-secondary" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="text" className="form-control" style={{ paddingLeft: '35px' }} placeholder="Digite para buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group mb-0" style={{ minWidth: '150px' }}>
                                <label>Ordenação (A-Z)</label>
                                <button className="btn btn-secondary w-full" onClick={() => setSortAsc(!sortAsc)}>
                                    {sortAsc ? '▲ Crescente (A-Z)' : '▼ Decrescente (Z-A)'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>{renderTableHeaders()}</thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr><td colSpan={listSubCategoriaFilter ? "10" : "4"} className="text-center py-4 text-secondary">Nenhum item encontrado.</td></tr>
                            ) : (
                                list.map(item => renderTableRow(item))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'Cadastros Embalagem' }]} />
            <div className="container" style={{ position: 'relative', minHeight: '80vh' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to={currentTab === '' || currentTab === 'itens_cadastrados' ? "/gestao-ferramental" : "#"} onClick={() => {
                            if(currentTab === 'BPF5-50' || currentTab === 'MEDISEAL') handleTabChange('');
                        }} className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Cadastros Embalagem {currentTab && currentTab !== 'itens_cadastrados' && `- ${currentTab}`}</h2>
                    </div>
                    {currentTab !== 'itens_cadastrados' && (
                        <button className="btn btn-secondary flex items-center gap-2" onClick={() => handleTabChange('itens_cadastrados')}>
                            <List size={18} /> Itens Cadastrados
                        </button>
                    )}
                </div>

                {/* MAIN MENU (LARGE ICONS) */}
                {currentTab === '' && (
                    <div className="dashboard-grid mt-4 animate-fade-in">
                        <div className="dashboard-card" onClick={() => handleTabChange('BPF5-50')}>
                            <Box size={48} className="text-primary mb-2" />
                            <h3>BPF5-50</h3>
                        </div>
                        <div className="dashboard-card" onClick={() => handleTabChange('MEDISEAL')}>
                            <Box size={48} className="text-primary mb-2" />
                            <h3>MEDISEAL</h3>
                        </div>
                    </div>
                )}

                {/* BPF5-50 or MEDISEAL forms */}
                {(currentTab === 'BPF5-50' || currentTab === 'MEDISEAL') && (
                    <div className="card p-4 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div className="form-group mb-4">
                            <label className="text-primary" style={{ fontWeight: 600 }}>Selecione o Item para Cadastrar:</label>
                            <select className="form-control" value={subCategoria} onChange={(e) => {
                                setSubCategoria(e.target.value);
                                resetForm();
                            }}>
                                <option value="" disabled>-- Selecione --</option>
                                {(currentTab === 'BPF5-50' ? bpfSubCats : medisealSubCats).map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>

                        {subCategoria && (
                            <form onSubmit={handleSubmit} className="animate-fade-in">
                                <h3 className="mb-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                    Cadastro: {subCategoria}
                                </h3>
                                {renderFields()}
                                <button type="submit" className="btn btn-primary mt-4 w-full">Salvar Cadastro</button>
                            </form>
                        )}
                    </div>
                )}

                {currentTab === 'itens_cadastrados' && renderItensCadastrados()}

                {/* Modals and Overlays logic are same as Compressão */}
                
                {/* Histórico Modal */}
                {showHistory && historyItem && (
                    <div className="modal-overlay active" style={{ zIndex: 1000 }}>
                        <div className="modal-content" style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h3 className="modal-title flex items-center gap-2"><History size={20} /> Histórico de Alterações</h3>
                                <button className="modal-close" onClick={() => setShowHistory(false)}><X /></button>
                            </div>
                            <div className="mb-4 p-3" style={{ backgroundColor: 'var(--background-color)', borderRadius: '4px' }}>
                                <strong>Item:</strong> {historyItem.equipamento} - {historyItem.subcategoria}
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
                                    {isEditing ? `Editar: ${detailsItem.subcategoria}` : `Detalhes: ${detailsItem.subcategoria}`}
                                </h3>
                                <button className="modal-close" onClick={() => setShowDetails(false)}><X /></button>
                            </div>
                            
                            {!isEditing ? (
                                <div className="flex flex-col gap-4 p-2">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><span className="text-secondary block text-sm">Equipamento</span><strong>{detailsItem.equipamento}</strong></div>
                                        {detailsItem.tag && <div><span className="text-secondary block text-sm">TAG</span><strong>{detailsItem.tag}</strong></div>}
                                        {detailsItem.tamanhoBlister && <div><span className="text-secondary block text-sm">Tamanho do Blíster</span><strong>{detailsItem.tamanhoBlister}</strong></div>}
                                        {detailsItem.espessuraMin && <div><span className="text-secondary block text-sm">Espessura Mín.</span><strong>{detailsItem.espessuraMin}</strong></div>}
                                        {detailsItem.espessuraMax && <div><span className="text-secondary block text-sm">Espessura Máx.</span><strong>{detailsItem.espessuraMax}</strong></div>}
                                        {detailsItem.qtdBlisters && <div><span className="text-secondary block text-sm">Qtd Blísters</span><strong>{detailsItem.qtdBlisters}</strong></div>}
                                        {detailsItem.profundidadeBolha && <div><span className="text-secondary block text-sm">Prof. da Bolha</span><strong>{detailsItem.profundidadeBolha}</strong></div>}
                                        {detailsItem.faca && <div><span className="text-secondary block text-sm">Faca</span><strong>{detailsItem.faca}</strong></div>}
                                        {detailsItem.cunha && <div><span className="text-secondary block text-sm">Cunha</span><strong>{detailsItem.cunha}</strong></div>}
                                        {detailsItem.numFerramenta && <div><span className="text-secondary block text-sm">Num. Ferramenta</span><strong>{detailsItem.numFerramenta}</strong></div>}
                                        
                                        {detailsItem.selectedGuiasAlimentacao?.length > 0 && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <span className="text-secondary block text-sm mb-1">Guias de Alimentação Vinculados</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {detailsItem.selectedGuiasAlimentacao.map((id, i) => {
                                                        const g = items.find(it => it.id === id);
                                                        return <span key={i} className="badge badge-primary">{g ? (g.tag || g.tamanhoBlister) : id}</span>;
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {detailsItem.selectedGuiasCorte?.length > 0 && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <span className="text-secondary block text-sm mb-1">Guias do Corte Vinculados</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {detailsItem.selectedGuiasCorte.map((id, i) => {
                                                        const g = items.find(it => it.id === id);
                                                        return <span key={i} className="badge badge-primary">{g ? g.tag : id}</span>;
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {detailsItem.selectedRolosSelagem?.length > 0 && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <span className="text-secondary block text-sm mb-1">Rolos de Selagem Vinculados</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {detailsItem.selectedRolosSelagem.map((id, i) => {
                                                        const g = items.find(it => it.id === id);
                                                        return <span key={i} className="badge badge-primary">{g ? g.tag : id}</span>;
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {detailsItem.produtosDedicados?.length > 0 && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <span className="text-secondary block text-sm mb-1">Produtos Vinculados</span>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {detailsItem.produtosDedicados.map((prod, i) => (
                                                        <li key={i} style={{ padding: '0.5rem', backgroundColor: 'var(--background-color)', marginBottom: '0.25rem', borderRadius: '4px' }}>
                                                            <strong>{prod.codigo}</strong> - {prod.nome}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {detailsItem.anexoPdf && (
                                        <div className="mt-2 p-3 rounded flex items-center justify-between" style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
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
                                    {renderFields()}
                                    <div className="modal-footer mt-4">
                                        <button type="button" className="btn btn-secondary" onClick={() => {
                                            setIsEditing(false);
                                            setCurrentTab('itens_cadastrados'); // back to listing context
                                            setSubCategoria('');
                                        }}>Cancelar</button>
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
                                <strong style={{ color: 'var(--text-color)' }}>{itemToDelete.equipamento} - {itemToDelete.subcategoria}</strong>
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
