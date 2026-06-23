import React, { useState, useRef, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { useEspessura } from '../contexts/EspessuraContext';
import { Save, Upload, Trash2, CheckCircle2, AlertCircle, Info, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CadastroProdutosEspessura() {
    const { produtos, addProduto, addProdutosEmMassa, deleteProduto } = useEspessura();

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

    // Formulário de Cadastro
    const [codigoPI, setCodigoPI] = useState('');
    const [codigoPA, setCodigoPA] = useState('');
    const [produtoPI, setProdutoPI] = useState('');
    const [produtoPA, setProdutoPA] = useState('');
    const [isComprimido, setIsComprimido] = useState(false);
    const [espessuraMin, setEspessuraMin] = useState('');
    const [espessuraMax, setEspessuraMax] = useState('');
    const [showExcelInfo, setShowExcelInfo] = useState(false);
    const fileInputRef = useRef(null);

    // Lista de Cadastro (Lateral)
    const [showCadastroList, setShowCadastroList] = useState(true);
    const [cadastroSearch, setCadastroSearch] = useState('');

    const handleCadastroSubmit = (e) => {
        e.preventDefault();
        const numPattern = /^\d+$/;
        if (!numPattern.test(codigoPI) || !numPattern.test(codigoPA)) {
            showError('Códigos PI e PA devem conter apenas números.');
            return;
        }

        let min = null;
        let max = null;

        if (isComprimido) {
            min = parseFloat(espessuraMin.replace(',', '.'));
            max = parseFloat(espessuraMax.replace(',', '.'));
            if (isNaN(min) || isNaN(max)) {
                showError('Espessuras devem ser números válidos.');
                return;
            }
            if (max <= min) {
                showError('A espessura máxima deve ser obrigatoriamente maior que a mínima.');
                return;
            }
        }

        addProduto({
            codigoPI,
            codigoPA,
            produtoPI,
            produtoPA,
            isComprimido,
            espessuraMin: min,
            espessuraMax: max,
            espessuraMedia: (min !== null && max !== null) ? (min + max) / 2 : null
        });

        setCodigoPI(''); setCodigoPA(''); setProdutoPI(''); setProdutoPA('');
        setIsComprimido(false); setEspessuraMin(''); setEspessuraMax('');
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
                    
                    let min = null;
                    let max = null;
                    let isComprimido = false;

                    if (minStr && maxStr) {
                        const parsedMin = parseFloat(minStr);
                        const parsedMax = parseFloat(maxStr);
                        if (!isNaN(parsedMin) && !isNaN(parsedMax)) {
                            min = parsedMin;
                            max = parsedMax;
                            isComprimido = true;
                        }
                    }

                    if (!pi || !pa) return null;
                    if (isComprimido && max <= min) return null;

                    return {
                        codigoPI: pi,
                        codigoPA: pa,
                        produtoPI: prodPI || '',
                        produtoPA: prodPA || '',
                        isComprimido,
                        espessuraMin: min,
                        espessuraMax: max,
                        espessuraMedia: isComprimido ? (min + max) / 2 : null
                    };
                }).filter(p => p !== null);

                if (novos.length > 0) {
                    addProdutosEmMassa(novos);
                    showSuccess(`${novos.length} produtos importados!`);
                } else {
                    showError('Nenhum dado válido. Verifique se Produto PI e PA estão preenchidos.');
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

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'Cadastro de produtos' }]} />
            
            <div className="container mx-auto p-4 flex-1 flex flex-col" style={{ maxWidth: '100%' }}>
                <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {successMessage && <div className="alert flex items-center gap-2" style={{ backgroundColor: 'var(--success-color)', color: '#fff', padding: '1rem', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}><CheckCircle2 size={18}/> {successMessage}</div>}
                    {errorMessage && <div className="alert flex items-center gap-2" style={{ backgroundColor: 'var(--danger-color)', color: '#fff', padding: '1rem', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}><AlertCircle size={18}/> {errorMessage}</div>}
                </div>

                <div className="flex items-center justify-between mb-4">
                    <h2 className="m-0 text-primary">Cadastro de produtos</h2>
                </div>

                <div className="animate-fade-in flex gap-4 flex-1" style={{ height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
                    {/* Lista Lateral Ocultável */}
                    <div className="shadow-sm" style={{ 
                        width: showCadastroList ? '350px' : '40px', 
                        transition: 'width 0.3s', 
                        backgroundColor: '#fff', 
                        border: '1px solid var(--border-color)', 
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

                    {/* Área Principal (Formulário e Importação lado a lado) */}
                    <div className="flex flex-1 gap-6" style={{ overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '1rem' }}>
                        
                        {/* Coluna 1: Formulário de Novo Produto */}
                        <div className="card p-6 shadow-sm flex-1 h-fit" style={{ minWidth: '400px' }}>
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
                                
                                <div className="flex items-center gap-2 mb-4">
                                    <input type="checkbox" id="isComprimido" checked={isComprimido} onChange={e => setIsComprimido(e.target.checked)} style={{ width: 'auto', margin: 0, cursor: 'pointer' }} />
                                    <label htmlFor="isComprimido" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>Comprimido</label>
                                </div>
                                
                                {isComprimido && (
                                    <div className="flex gap-4 mb-6 animate-fade-in">
                                        <div className="form-group flex-1 m-0"><label>Espessura Mínima Espec. (mm)</label><input type="text" className="form-control" required value={espessuraMin} onChange={e => setEspessuraMin(e.target.value)} /></div>
                                        <div className="form-group flex-1 m-0"><label>Espessura Máxima Espec. (mm)</label><input type="text" className="form-control" required value={espessuraMax} onChange={e => setEspessuraMax(e.target.value)} /></div>
                                        <div className="form-group flex-1 m-0">
                                            <label>Média (Auto)</label>
                                            <input type="text" className="form-control" disabled style={{ backgroundColor: '#f1f5f9' }} value={(!isNaN(parseFloat(espessuraMin.replace(',', '.'))) && !isNaN(parseFloat(espessuraMax.replace(',', '.')))) ? ((parseFloat(espessuraMin.replace(',', '.')) + parseFloat(espessuraMax.replace(',', '.'))) / 2).toFixed(2) : ''} />
                                        </div>
                                    </div>
                                )}
                                
                                <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4"><Save size={18} /> Cadastrar Manualmente</button>
                            </form>
                        </div>

                        {/* Coluna 2: Importação em Massa */}
                        <div className="card p-6 shadow-sm h-fit" style={{ width: '450px', flexShrink: 0 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="m-0 text-primary w-full" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Importação em Massa</h3>
                                <Info size={16} className="text-secondary cursor-pointer shrink-0" onClick={() => setShowExcelInfo(!showExcelInfo)} />
                            </div>
                            
                            <p className="text-sm text-secondary mb-4">Envie uma planilha com múltiplos produtos para cadastrá-los de uma vez.</p>
                            
                            {showExcelInfo && (
                                <div style={{ backgroundColor: '#eef2ff', color: '#4f46e5', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    A planilha deve conter as colunas nesta ordem (sem cabeçalho ou pulando-o): <strong>Código PI, Código PA, Produto PI, Produto PA, Espessura Mín. (opcional), Espessura Máx. (opcional)</strong>. <br/><br/>Se as informações de espessura não forem preenchidas, será subentendido que não se trata de um comprimido.
                                </div>
                            )}
                            
                            <input type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
                            <button type="button" className="btn btn-secondary w-full flex items-center justify-center gap-2 py-3" onClick={() => fileInputRef.current.click()}><Upload size={18} /> Fazer Upload de Planilha</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
