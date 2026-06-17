import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useEspessura } from '../contexts/EspessuraContext';
import { useUsers } from '../contexts/UserContext';
import { ArrowLeft, Save, Upload, Trash2, CheckCircle2, AlertCircle, Filter, Info, ChevronRight, ChevronLeft, Search, Clock, List, Calendar, AlertTriangle, BarChart2, X, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function GestaoEspessuras() {
    const { produtos, addProduto, addProdutosEmMassa, deleteProduto, lancamentos, addLancamento } = useEspessura();
    const { currentUser } = useUsers();

    const [currentTab, setCurrentTab] = useState('lancamento');

    const [successMessage, setSuccessMessage] = useState('');
    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };
    const [errorMessage, setErrorMessage] = useState('');
    const showError = (msg) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), 4000);
    };

    // Current Time
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Formulário de Cadastro
    const [codigoPI, setCodigoPI] = useState('');
    const [codigoPA, setCodigoPA] = useState('');
    const [produtoPI, setProdutoPI] = useState('');
    const [produtoPA, setProdutoPA] = useState('');
    const [espessuraMin, setEspessuraMin] = useState('');
    const [espessuraMax, setEspessuraMax] = useState('');
    const [showExcelInfo, setShowExcelInfo] = useState(false);
    const fileInputRef = useRef(null);

    // Lista de Cadastro (Lateral)
    const [showCadastroList, setShowCadastroList] = useState(true);
    const [cadastroSearch, setCadastroSearch] = useState('');

    // Formulário de Lançamento
    const [searchPI, setSearchPI] = useState('');
    const [showPIOptions, setShowPIOptions] = useState(false);
    const [selectedProduto, setSelectedProduto] = useState(null);
    const [espessuraMinReal, setEspessuraMinReal] = useState('');
    const [espessuraMaxReal, setEspessuraMaxReal] = useState('');
    const [equipamento, setEquipamento] = useState('');
    const [lotePI, setLotePI] = useState('');

    const EQUIPAMENTOS = [
        'Fette 1200 - 3', 'Fette 1200 - 4', 'Fette 1200 - 5', 'Fette 1200 - 6',
        'Fette 2200 - 1', 'Fette 2200 - 2', 'Fette 3200 - 1', 'Fette 3200 - 2',
        'Fette 3200 - 3', 'Fette 3090'
    ];

    // Dashboard States
    const [dashPeriodoInicio, setDashPeriodoInicio] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [dashPeriodoFim, setDashPeriodoFim] = useState(new Date().toISOString().split('T')[0]);
    const [dashClassificacao, setDashClassificacao] = useState('Todos'); 
    const [dashSelectedPI, setDashSelectedPI] = useState('');
    const [dashEquipamento, setDashEquipamento] = useState('Todos');
    const [dashSortOrder, setDashSortOrder] = useState('desc');
    const [selectedLoteDetails, setSelectedLoteDetails] = useState(null);
    const [showDashFilters, setShowDashFilters] = useState(true);
    const [showOffenders, setShowOffenders] = useState(false);
    const [showProductSummaryModal, setShowProductSummaryModal] = useState(false);

    const safeNumber = (val) => {
        if (val === null || val === undefined || isNaN(val)) return '-';
        return Number(val).toFixed(2);
    };

    // --- CADASTRO LOGIC ---
    const handleCadastroSubmit = (e) => {
        e.preventDefault();
        const numPattern = /^\d+$/;
        if (!numPattern.test(codigoPI) || !numPattern.test(codigoPA)) {
            showError('Códigos PI e PA devem conter apenas números.');
            return;
        }

        const min = parseFloat(espessuraMin.replace(',', '.'));
        const max = parseFloat(espessuraMax.replace(',', '.'));
        if (isNaN(min) || isNaN(max)) {
            showError('Espessuras devem ser números válidos.');
            return;
        }
        if (max <= min) {
            showError('A espessura máxima deve ser obrigatoriamente maior que a mínima.');
            return;
        }

        addProduto({
            codigoPI,
            codigoPA,
            produtoPI,
            produtoPA,
            espessuraMin: min,
            espessuraMax: max,
            espessuraMedia: (min + max) / 2
        });

        setCodigoPI(''); setCodigoPA(''); setProdutoPI(''); setProdutoPA('');
        setEspessuraMin(''); setEspessuraMax('');
        showSuccess('Produto cadastrado com sucesso!');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                const novos = data.map(row => {
                    const keys = Object.keys(row);
                    const pi = row[keys[0]]?.toString();
                    const pa = row[keys[1]]?.toString();
                    const prodPI = row[keys[2]];
                    const prodPA = row[keys[3]];
                    const minStr = row[keys[4]]?.toString().replace(',', '.');
                    const maxStr = row[keys[5]]?.toString().replace(',', '.');
                    const min = parseFloat(minStr);
                    const max = parseFloat(maxStr);

                    if (!pi || !pa || isNaN(min) || isNaN(max) || max <= min) return null;

                    return {
                        codigoPI: pi,
                        codigoPA: pa,
                        produtoPI: prodPI || '',
                        produtoPA: prodPA || '',
                        espessuraMin: min,
                        espessuraMax: max,
                        espessuraMedia: (min + max) / 2
                    };
                }).filter(p => p !== null);

                if (novos.length > 0) {
                    addProdutosEmMassa(novos);
                    showSuccess(`${novos.length} produtos importados!`);
                } else {
                    showError('Nenhum dado válido. Verifique a ordem e garanta que Máxima > Mínima.');
                }
            } catch (err) {
                showError('Erro ao ler a planilha.');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const filteredProdutos = useMemo(() => {
        const q = cadastroSearch.toLowerCase();
        if (!q) return produtos;
        return produtos.filter(p => 
            p.codigoPI.toLowerCase().includes(q) ||
            p.codigoPA.toLowerCase().includes(q) ||
            p.produtoPI.toLowerCase().includes(q) ||
            p.produtoPA.toLowerCase().includes(q)
        );
    }, [produtos, cadastroSearch]);

    // --- LANÇAMENTO LOGIC ---
    const handleLancamentoSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduto) {
            showError('Selecione um produto válido primeiro.');
            return;
        }

        const minR = parseFloat(espessuraMinReal.replace(',', '.'));
        const maxR = parseFloat(espessuraMaxReal.replace(',', '.'));
        
        if (isNaN(minR) || isNaN(maxR)) {
            showError('As espessuras reais devem ser números válidos.');
            return;
        }
        if (maxR <= minR) {
            showError('A espessura máxima real deve ser obrigatoriamente maior que a mínima.');
            return;
        }

        const medR = (minR + maxR) / 2;

        addLancamento({
            codigoPI: selectedProduto.codigoPI,
            espessuraMinReal: minR,
            espessuraMaxReal: maxR,
            espessuraMediaReal: medR,
            equipamento,
            lotePI,
            dataHora: new Date().toISOString(),
            responsavel: currentUser?.nome || 'Usuário Local'
        });

        setSearchPI(''); setSelectedProduto(null);
        setEspessuraMinReal(''); setEspessuraMaxReal('');
        setEquipamento(''); setLotePI('');
        showSuccess('Lote lançado com sucesso!');
    };

    const searchPIOptions = produtos.filter(p => p.codigoPI.includes(searchPI) || p.produtoPI.toLowerCase().includes(searchPI.toLowerCase()));

    // --- DASHBOARD LOGIC ---
    const filteredLancamentos = useMemo(() => {
        return lancamentos.filter(l => {
            if (!l.dataHora) return false;
            const lDate = l.dataHora.split('T')[0];
            return lDate >= dashPeriodoInicio && lDate <= dashPeriodoFim;
        });
    }, [lancamentos, dashPeriodoInicio, dashPeriodoFim]);

    const dashboardAgrupado = useMemo(() => {
        const groups = {};
        filteredLancamentos.forEach(l => {
            if (!groups[l.codigoPI]) {
                const prod = produtos.find(p => p.codigoPI === l.codigoPI);
                groups[l.codigoPI] = { produto: prod, lotes: [], qtdLotes: 0 };
            }
            groups[l.codigoPI].lotes.push(l);
            groups[l.codigoPI].qtdLotes++;
        });
        return Object.values(groups).sort((a, b) => b.qtdLotes - a.qtdLotes);
    }, [filteredLancamentos, produtos]);

    const classificarLote = (lote, prod) => {
        if (!prod) return 'Desconhecido';
        if (lote.espessuraMinReal >= prod.espessuraMin && lote.espessuraMaxReal <= prod.espessuraMax) {
            return 'Conforme';
        }
        if (lote.espessuraMinReal < prod.espessuraMin) return 'Espessura abaixo do mínimo';
        if (lote.espessuraMaxReal > prod.espessuraMax) return 'Espessura acima do máximo';
        return 'Não Conforme';
    };

    const getDashboardDataParaProduto = () => {
        const agp = dashboardAgrupado.find(g => g.produto && g.produto.codigoPI === dashSelectedPI);
        if (!agp) return null;

        let lotesFiltro = agp.lotes;
        if (dashClassificacao !== 'Todos') {
            lotesFiltro = lotesFiltro.filter(l => classificarLote(l, agp.produto) === dashClassificacao);
        }
        if (dashEquipamento !== 'Todos') {
            lotesFiltro = lotesFiltro.filter(l => l.equipamento === dashEquipamento);
        }

        lotesFiltro = lotesFiltro.sort((a, b) => {
            const tA = new Date(a.dataHora || 0).getTime();
            const tB = new Date(b.dataHora || 0).getTime();
            return dashSortOrder === 'desc' ? tB - tA : tA - tB;
        });

        const lotesDesvio = agp.lotes.filter(l => classificarLote(l, agp.produto) !== 'Conforme');

        return {
            produto: agp.produto,
            lotesExibidos: lotesFiltro,
            totalProduzidos: agp.lotes.length,
            totalDesvio: lotesDesvio.length,
            equipamentos: [...new Set(agp.lotes.map(l => l.equipamento).filter(Boolean))]
        };
    };

    const dashData = getDashboardDataParaProduto();

    const topOffenders = useMemo(() => {
        const offenders = [];
        dashboardAgrupado.forEach(agp => {
            const lotesAbaixo = agp.lotes.filter(l => classificarLote(l, agp.produto) === 'Espessura abaixo do mínimo').length;
            const lotesAcima = agp.lotes.filter(l => classificarLote(l, agp.produto) === 'Espessura acima do máximo').length;
            const totalDesvios = lotesAbaixo + lotesAcima;
            if (totalDesvios > 0) {
                offenders.push({
                    produto: agp.produto,
                    totalDesvios,
                    lotesAbaixo,
                    lotesAcima
                });
            }
        });
        return offenders.sort((a, b) => b.totalDesvios - a.totalDesvios);
    }, [dashboardAgrupado]);

    // --- RENDERS ---
    const renderAlerts = () => (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {successMessage && <div className="alert flex items-center gap-2" style={{ backgroundColor: 'var(--success-color)', color: '#fff', padding: '1rem', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}><CheckCircle2 size={18}/> {successMessage}</div>}
            {errorMessage && <div className="alert flex items-center gap-2" style={{ backgroundColor: 'var(--danger-color)', color: '#fff', padding: '1rem', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}><AlertCircle size={18}/> {errorMessage}</div>}
        </div>
    );

    const renderCadastro = () => (
        <div className="animate-fade-in" style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
            {/* Lista Lateral Ocultável */}
            <div style={{ 
                width: showCadastroList ? '350px' : '40px', 
                transition: 'width 0.3s', 
                backgroundColor: '#fff', 
                borderRight: '1px solid var(--border-color)', 
                display: 'flex', flexDirection: 'column', 
                position: 'relative',
                borderRadius: '8px'
            }}>
                <button onClick={() => setShowCadastroList(!showCadastroList)} style={{ position: 'absolute', top: '10px', right: '-15px', zIndex: 10, background: '#fff', border: '1px solid var(--border-color)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {showCadastroList ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
                
                {showCadastroList && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h4 style={{ margin: '0 0 1rem 0' }}>Itens Cadastrados</h4>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input type="text" className="form-control" placeholder="Buscar PI, PA ou Nome..." style={{ paddingLeft: '32px', margin: 0 }} value={cadastroSearch} onChange={e => setCadastroSearch(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: '1rem' }}>
                            {filteredProdutos.length === 0 ? (
                                <p className="text-secondary text-center p-4">Nenhum encontrado.</p>
                            ) : (
                                filteredProdutos.map(p => (
                                    <div key={p.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{p.codigoPI}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.produtoPI}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{p.espessuraMin} - {p.espessuraMax}</div>
                                        </div>
                                        <button className="btn btn-icon text-danger" onClick={() => deleteProduto(p.id)}><Trash2 size={16} /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Formulário Principal */}
            <div className="card p-6" style={{ flex: 1, overflowY: 'auto' }}>
                <h3 className="mb-4 text-primary" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Novo Produto</h3>
                <form onSubmit={handleCadastroSubmit}>
                    <div className="flex gap-4 mb-4">
                        <div className="form-group flex-1 m-0"><label>Código PI (Apenas Números)</label><input type="text" className="form-control" required value={codigoPI} onChange={e => setCodigoPI(e.target.value)} /></div>
                        <div className="form-group flex-1 m-0"><label>Código PA (Apenas Números)</label><input type="text" className="form-control" required value={codigoPA} onChange={e => setCodigoPA(e.target.value)} /></div>
                    </div>
                    <div className="flex gap-4 mb-4">
                        <div className="form-group flex-1 m-0"><label>Produto PI</label><input type="text" className="form-control" required value={produtoPI} onChange={e => setProdutoPI(e.target.value)} /></div>
                        <div className="form-group flex-1 m-0"><label>Produto PA</label><input type="text" className="form-control" required value={produtoPA} onChange={e => setProdutoPA(e.target.value)} /></div>
                    </div>
                    
                    <div className="flex gap-4 mb-6">
                        <div className="form-group flex-1 m-0"><label>Espessura Mínima Espec. (mm)</label><input type="text" className="form-control" required value={espessuraMin} onChange={e => setEspessuraMin(e.target.value)} /></div>
                        <div className="form-group flex-1 m-0"><label>Espessura Máxima Espec. (mm)</label><input type="text" className="form-control" required value={espessuraMax} onChange={e => setEspessuraMax(e.target.value)} /></div>
                        <div className="form-group flex-1 m-0">
                            <label>Média (Auto)</label>
                            <input type="text" className="form-control" disabled style={{ backgroundColor: '#f1f5f9' }} value={(!isNaN(parseFloat(espessuraMin.replace(',', '.'))) && !isNaN(parseFloat(espessuraMax.replace(',', '.')))) ? ((parseFloat(espessuraMin.replace(',', '.')) + parseFloat(espessuraMax.replace(',', '.'))) / 2).toFixed(2) : ''} />
                        </div>
                    </div>
                    
                    <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2"><Save size={18} /> Cadastrar Manualmente</button>
                </form>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <h4 className="m-0 text-secondary">Importação em Massa</h4>
                        <Info size={16} className="text-secondary cursor-pointer" onClick={() => setShowExcelInfo(!showExcelInfo)} />
                    </div>
                    {showExcelInfo && (
                        <div style={{ backgroundColor: '#eef2ff', color: '#4f46e5', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            A planilha deve conter as colunas nesta ordem (sem cabeçalho ou pulando-o): <strong>Código PI, Código PA, Produto PI, Produto PA, Espessura Mín., Espessura Máx.</strong>
                        </div>
                    )}
                    <input type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
                    <button className="btn btn-secondary w-full flex items-center justify-center gap-2" onClick={() => fileInputRef.current.click()}><Upload size={18} /> Fazer Upload de Planilha</button>
                </div>
            </div>
        </div>
    );

    const renderLancamento = () => {
        const minReal = parseFloat(espessuraMinReal.replace(',', '.'));
        const maxReal = parseFloat(espessuraMaxReal.replace(',', '.'));
        const mediaRealAuto = (!isNaN(minReal) && !isNaN(maxReal)) ? ((minReal + maxReal) / 2).toFixed(2) : '';

        return (
            <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card p-6 mb-4">
                    <div className="form-group mb-0" style={{ position: 'relative' }}>
                        <label style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-color)' }}>Buscar e Selecionar Produto (Por Código PI ou Nome)</label>
                        <input 
                            type="text" 
                            className="form-control mt-2" 
                            placeholder="Digite para filtrar produtos..." 
                            style={{ fontSize: '1.1rem', padding: '0.75rem' }} 
                            value={searchPI} 
                            onChange={e => {
                                setSearchPI(e.target.value);
                                setShowPIOptions(true);
                                setSelectedProduto(null);
                            }}
                            onFocus={() => setShowPIOptions(true)}
                        />
                        {showPIOptions && searchPI && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                {searchPIOptions.length === 0 ? (
                                    <div className="p-3 text-secondary text-sm">Nenhum produto encontrado.</div>
                                ) : (
                                    searchPIOptions.map(p => (
                                        <div key={p.id} 
                                            style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                                            onClick={() => {
                                                setSelectedProduto(p);
                                                setSearchPI(`${p.codigoPI} - ${p.produtoPI}`);
                                                setShowPIOptions(false);
                                            }}
                                            className="hover:bg-light"
                                        >
                                            <strong>{p.codigoPI}</strong> - {p.produtoPI}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {selectedProduto && (
                    <form className="card p-6 animate-fade-in" onSubmit={handleLancamentoSubmit}>
                        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <span className="text-secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Especificações Alvo</span>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-color)' }}>{selectedProduto.produtoPI}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cód. PI: <strong>{selectedProduto.codigoPI}</strong></div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <div style={{ backgroundColor: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '4px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MÍNIMA</div>
                                        <div style={{ fontWeight: 700 }}>{selectedProduto.espessuraMin}</div>
                                    </div>
                                    <div style={{ backgroundColor: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '4px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MÁXIMA</div>
                                        <div style={{ fontWeight: 700 }}>{selectedProduto.espessuraMax}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h3 className="mb-4 text-primary">Medição Real</h3>
                        
                        <div className="flex gap-4 mb-4">
                            <div className="form-group flex-1 m-0">
                                <label>Lote PI</label>
                                <input type="text" className="form-control" required value={lotePI} onChange={e => setLotePI(e.target.value)} />
                            </div>
                            <div className="form-group flex-1 m-0">
                                <label>Equipamento</label>
                                <select className="form-control" required value={equipamento} onChange={e => setEquipamento(e.target.value)}>
                                    <option value="" disabled>-- Selecione --</option>
                                    {EQUIPAMENTOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <div className="form-group flex-1 m-0">
                                <label>Esp. Mínima Real (mm)</label>
                                <input type="text" className="form-control" required value={espessuraMinReal} onChange={e => setEspessuraMinReal(e.target.value)} />
                            </div>
                            <div className="form-group flex-1 m-0">
                                <label>Esp. Máxima Real (mm)</label>
                                <input type="text" className="form-control" required value={espessuraMaxReal} onChange={e => setEspessuraMaxReal(e.target.value)} />
                            </div>
                            <div className="form-group flex-1 m-0">
                                <label>Média Real (Calculada)</label>
                                <input type="text" className="form-control" disabled style={{ backgroundColor: '#f1f5f9', fontWeight: 600, color: 'var(--primary-color)' }} value={mediaRealAuto} />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                            <div className="flex gap-4 text-xs text-secondary opacity-70">
                                <span className="flex items-center gap-1"><Clock size={14}/> {currentTime.toLocaleString()}</span>
                                <span className="flex items-center gap-1"><List size={14}/> Resp: {currentUser?.nome || 'Usuário'}</span>
                            </div>
                            <button type="submit" className="btn btn-primary flex items-center justify-center gap-2 py-2 px-6"><Save size={18} /> Confirmar Lançamento</button>
                        </div>
                    </form>
                )}
            </div>
        );
    };

    const renderDashboard = () => {
        try {
            return (
        <div className="animate-fade-in" style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 180px)' }}>
            
            {/* LEFT BAR: FILTERS (Collapsible) */}
            <div style={{ 
                width: showDashFilters ? '280px' : '0px', 
                transition: 'width 0.3s', 
                backgroundColor: '#fff', 
                borderRight: '1px solid var(--border-color)', 
                display: 'flex', flexDirection: 'column', 
                position: 'relative',
                borderRadius: '8px',
                overflow: 'visible',
                minHeight: 0
            }}>
                <button onClick={() => setShowDashFilters(!showDashFilters)} style={{ position: 'absolute', top: '10px', right: '-15px', zIndex: 10, background: '#fff', border: '1px solid var(--border-color)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {showDashFilters ? <ChevronLeft size={16} /> : <Filter size={14} />}
                </button>
                
                <div style={{ padding: '1.5rem', display: showDashFilters ? 'flex' : 'none', flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                    <div>
                        <h4 className="mb-3 text-primary flex items-center gap-2"><Calendar size={18}/> Período</h4>
                        <div className="form-group mb-2">
                            <label className="text-xs">Data Inicial</label>
                            <input type="date" className="form-control" value={dashPeriodoInicio} onChange={e => setDashPeriodoInicio(e.target.value)} />
                        </div>
                        <div className="form-group mb-0">
                            <label className="text-xs">Data Final</label>
                            <input type="date" className="form-control" value={dashPeriodoFim} onChange={e => setDashPeriodoFim(e.target.value)} />
                        </div>
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }}></div>

                    <div>
                        <h4 className="mb-3 text-primary flex items-center gap-2"><Filter size={18}/> Classificação</h4>
                        <div className="form-group m-0">
                            <select className="form-control" value={dashClassificacao} onChange={e => setDashClassificacao(e.target.value)}>
                                <option value="Todos">Todos os Lançamentos</option>
                                <option value="Conforme">Conforme</option>
                                <option value="Espessura abaixo do mínimo">Abaixo do Mínimo</option>
                                <option value="Espessura acima do máximo">Acima do Máximo</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', flexShrink: 0 }}></div>

                    <div>
                        <h4 className="mb-3 text-primary flex items-center gap-2"><List size={18}/> Selecione o Produto</h4>
                        {dashboardAgrupado.length === 0 ? (
                            <p className="text-xs text-secondary">Nenhum lote no período.</p>
                        ) : (
                            <select 
                                className="form-control m-0" 
                                value={dashSelectedPI} 
                                onChange={e => setDashSelectedPI(e.target.value)}
                            >
                                <option value="" disabled>-- Selecione --</option>
                                {dashboardAgrupado.map(agp => (
                                    <option key={agp.produto?.codigoPI} value={agp.produto?.codigoPI}>
                                        {agp.produto?.codigoPI} - {agp.produto?.produtoPI}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: CONTENT */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '1rem' }}>
                
                {topOffenders.length > 0 && (
                    <div className="card p-0" style={{ border: '1px solid var(--danger-color)', overflow: 'hidden', flexShrink: 0 }}>
                        <div 
                            style={{ padding: '0.4rem 1rem', backgroundColor: '#fef2f2', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => setShowOffenders(!showOffenders)}
                        >
                            <div className="flex items-center gap-2 text-danger" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                <AlertTriangle size={15}/> Principais Ofensores do Período ({topOffenders.length} produtos com desvio)
                            </div>
                            {showOffenders ? <ChevronLeft size={16} style={{ transform: 'rotate(90deg)' }}/> : <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }}/>}
                        </div>
                        {showOffenders && (
                            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #fecaca', backgroundColor: '#fff', maxHeight: '150px', overflowY: 'auto' }}>
                                <table className="table" style={{ fontSize: '0.8rem', margin: 0 }}>
                                    <thead>
                                        <tr>
                                            <th>Produto</th>
                                            <th>Total de Lotes com Desvio</th>
                                            <th>Abaixo do Mínimo</th>
                                            <th>Acima do Máximo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topOffenders.map(off => (
                                            <tr key={off.produto?.codigoPI}>
                                                <td>{off.produto?.codigoPI} - {off.produto?.produtoPI}</td>
                                                <td className="text-danger" style={{ fontWeight: 600 }}>{off.totalDesvios}</td>
                                                <td>{off.lotesAbaixo}</td>
                                                <td>{off.lotesAcima}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {!dashSelectedPI || !dashData ? (
                    <div className="card flex items-center justify-center text-secondary h-full" style={{ flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc', border: 'none' }}>
                        <Filter size={48} style={{ opacity: 0.2 }} />
                        <h2 style={{ opacity: 0.5 }}>Selecione um produto no painel lateral</h2>
                    </div>
                ) : (
                    <div className="card flex-1 p-0" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', flexShrink: 0, minHeight: '500px' }}>
                        {/* Minimalist Header */}
                        <div style={{ padding: '2rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 className="m-0 text-primary flex items-center gap-3" style={{ fontSize: '1.5rem' }}>
                                    {dashData.produto.produtoPI}
                                    
                                    {/* Sort and Summary Buttons */}
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setDashSortOrder(dashSortOrder === 'desc' ? 'asc' : 'desc')} 
                                            className="btn btn-icon text-secondary" 
                                            title={dashSortOrder === 'desc' ? "Classificar: Mais Antigos Primeiro" : "Classificar: Mais Novos Primeiro"} 
                                            style={{ padding: '0.25rem', height: 'auto', width: 'auto', backgroundColor: '#f1f5f9' }}
                                        >
                                            <ArrowUpDown size={18} />
                                        </button>
                                        <button 
                                            onClick={() => setShowProductSummaryModal(true)} 
                                            className="btn btn-icon text-secondary" 
                                            title="Resumo do Produto" 
                                            style={{ padding: '0.25rem', height: 'auto', width: 'auto', backgroundColor: '#f1f5f9' }}
                                        >
                                            <BarChart2 size={18} />
                                        </button>
                                    </div>
                                </h2>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-secondary text-sm">Código PI: {dashData.produto.codigoPI}</span>
                                    
                                    {/* Equipment Filter Dropdown */}
                                    {dashData.equipamentos.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-secondary text-sm" style={{ fontWeight: 600 }}>Equipamento:</span>
                                            <select 
                                                className="form-control" 
                                                style={{ padding: '0.2rem 0.5rem', height: 'auto', fontSize: '0.8rem', width: 'auto' }}
                                                value={dashEquipamento}
                                                onChange={e => setDashEquipamento(e.target.value)}
                                            >
                                                <option value="Todos">Todos</option>
                                                {dashData.equipamentos.map(eq => (
                                                    <option key={eq} value={eq}>{eq}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-center">
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>Mínimo</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{safeNumber(dashData.produto?.espessuraMin)}</div>
                                </div>
                                <div className="text-center">
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>Máximo</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{safeNumber(dashData.produto?.espessuraMax)}</div>
                                </div>
                                <div className="text-center">
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>Média</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{safeNumber(dashData.produto?.espessuraMedia)}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Minimalist List */}
                        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8fafc', padding: '1.5rem' }}>
                            {dashData.lotesExibidos.length === 0 ? (
                                <div className="text-center py-12 text-secondary">Nenhum lançamento corresponde aos filtros.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {dashData.lotesExibidos.map(lote => {
                                        const clazz = classificarLote(lote, dashData.produto);
                                        const isOk = clazz === 'Conforme';
                                        
                                        return (
                                            <div key={lote.id} 
                                                onClick={() => setSelectedLoteDetails(lote)}
                                                style={{ 
                                                    backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', 
                                                    border: '1px solid #e2e8f0', borderLeft: `4px solid ${isOk ? 'var(--success-color)' : 'var(--danger-color)'}`,
                                                    cursor: 'pointer', transition: 'box-shadow 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Lote {lote.lotePI}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lote.dataHora ? new Date(lote.dataHora).toLocaleDateString() : '-'} às {lote.dataHora ? new Date(lote.dataHora).toLocaleTimeString() : '-'}</div>
                                                    </div>
                                                    {isOk ? <CheckCircle2 size={20} className="text-success" /> : <AlertCircle size={20} className="text-danger" />}
                                                </div>
                                                
                                                <div className="flex justify-between">
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>MÍNIMA</div>
                                                        <div style={{ fontWeight: 600, color: lote.espessuraMinReal < dashData.produto?.espessuraMin ? 'var(--danger-color)' : '#0f172a' }}>{safeNumber(lote.espessuraMinReal)}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>MÉDIA</div>
                                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{safeNumber(lote.espessuraMediaReal)}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>MÁXIMA</div>
                                                        <div style={{ fontWeight: 600, color: lote.espessuraMaxReal > dashData.produto?.espessuraMax ? 'var(--danger-color)' : '#0f172a' }}>{safeNumber(lote.espessuraMaxReal)}</div>
                                                    </div>
                                                </div>
                                                
                                                {!isOk && (
                                                    <div style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: 'var(--danger-color)', fontWeight: 600 }}>
                                                        {clazz}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showProductSummaryModal && dashData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card p-6 animate-fade-in" style={{ width: '400px', maxWidth: '90%' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="m-0 text-primary flex items-center gap-2"><BarChart2 size={20}/> Resumo do Produto</h3>
                            <button onClick={() => setShowProductSummaryModal(false)} className="btn btn-icon"><X size={20}/></button>
                        </div>
                        
                        {(() => {
                            const agp = dashboardAgrupado.find(g => g.produto?.codigoPI === dashData.produto.codigoPI);
                            if(!agp) return null;
                            const total = agp.lotes.length;
                            const lotesAbaixo = agp.lotes.filter(l => classificarLote(l, agp.produto) === 'Espessura abaixo do mínimo').length;
                            const lotesAcima = agp.lotes.filter(l => classificarLote(l, agp.produto) === 'Espessura acima do máximo').length;
                            const conformes = total - lotesAbaixo - lotesAcima;
                            
                            return (
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-secondary">Lotes Lançados</span>
                                        <span style={{ fontWeight: 600 }}>{total}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-success" style={{ fontWeight: 500 }}>Conformes</span>
                                        <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>{conformes}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-danger" style={{ fontWeight: 500 }}>Abaixo do Mínimo</span>
                                        <span style={{ fontWeight: 600, color: lotesAbaixo > 0 ? 'var(--danger-color)' : 'inherit' }}>{lotesAbaixo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-danger" style={{ fontWeight: 500 }}>Acima do Máximo</span>
                                        <span style={{ fontWeight: 600, color: lotesAcima > 0 ? 'var(--danger-color)' : 'inherit' }}>{lotesAcima}</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {selectedLoteDetails && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card p-6 animate-fade-in" style={{ width: '450px', maxWidth: '90%' }}>
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="m-0 text-primary flex items-center gap-2">Detalhes do Lote {selectedLoteDetails.lotePI}</h3>
                            <button onClick={() => setSelectedLoteDetails(null)} className="btn btn-icon"><X size={20}/></button>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-secondary">Data e Hora</span>
                                <span style={{ fontWeight: 500 }}>{selectedLoteDetails.dataHora ? new Date(selectedLoteDetails.dataHora).toLocaleString() : '-'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-secondary">Equipamento</span>
                                <span style={{ fontWeight: 500 }}>{selectedLoteDetails.equipamento || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-secondary">Responsável</span>
                                <span style={{ fontWeight: 500 }}>{selectedLoteDetails.responsavel || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-secondary">Mínima Aferida</span>
                                <span style={{ fontWeight: 600 }}>{safeNumber(selectedLoteDetails.espessuraMinReal)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-secondary">Média Real</span>
                                <span style={{ fontWeight: 600 }}>{safeNumber(selectedLoteDetails.espessuraMediaReal)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-secondary">Máxima Aferida</span>
                                <span style={{ fontWeight: 600 }}>{safeNumber(selectedLoteDetails.espessuraMaxReal)}</span>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t flex items-center gap-2">
                                <strong style={{ color: 'var(--text-color)' }}>Status:</strong> 
                                <span style={{ 
                                    padding: '0.2rem 0.5rem', 
                                    borderRadius: '4px', 
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    backgroundColor: classificarLote(selectedLoteDetails, dashData?.produto) === 'Conforme' ? '#dcfce7' : '#fee2e2',
                                    color: classificarLote(selectedLoteDetails, dashData?.produto) === 'Conforme' ? 'var(--success-color)' : 'var(--danger-color)'
                                }}>
                                    {classificarLote(selectedLoteDetails, dashData?.produto)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
            );
        } catch (err) {
            return (
                <div className="card p-6 border-danger bg-light" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                    <h3 className="text-danger flex items-center gap-2 mb-2"><AlertCircle size={20} /> Erro ao renderizar Dashboard</h3>
                    <p>Ocorreu um erro inesperado: <strong>{err.message}</strong></p>
                    <pre style={{ fontSize: '0.75rem', overflowX: 'auto', background: '#fff', padding: '1rem', border: '1px solid #ccc', marginTop: '1rem' }}>
                        {err.stack}
                    </pre>
                </div>
            );
        }
    };

    return (
        <>
            {renderAlerts()}
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão de Espessuras' }]} />
            <div className="container" style={{ position: 'relative', minHeight: '80vh', maxWidth: '1400px' }}>
                <div className="flex items-center gap-2 mb-4">
                    <Link to="/home" className="btn btn-icon"><ArrowLeft /></Link>
                    <h2>Gestão de Espessuras</h2>
                </div>

                <div className="tabs mb-4" style={{ display: 'inline-flex', padding: '0.25rem', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>
                    {[
                        { id: 'lancamento', label: 'Lançar espessura' },
                        { id: 'cadastro', label: 'Cadastro de produtos' },
                        { id: 'dashboard', label: 'Dashboard' }
                    ].map(t => (
                        <button key={t.id} 
                            onClick={() => setCurrentTab(t.id)}
                            style={{
                                padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.95rem',
                                backgroundColor: currentTab === t.id ? '#ffffff' : 'transparent',
                                color: currentTab === t.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                                boxShadow: currentTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {currentTab === 'lancamento' && renderLancamento()}
                {currentTab === 'cadastro' && renderCadastro()}
                {currentTab === 'dashboard' && renderDashboard()}
            </div>
        </>
    );
}
