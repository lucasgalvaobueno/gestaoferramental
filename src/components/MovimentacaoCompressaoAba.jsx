import React, { useState, useMemo } from 'react';
import { useCompressao } from '../contexts/CompressaoContext';
import { useMovimentacoesCompressao } from '../contexts/MovimentacoesCompressaoContext';
import { useColaboradoresCompressao } from '../contexts/ColaboradoresCompressaoContext';
import { useEspessura } from '../contexts/EspessuraContext';
import { useAuth } from '../contexts/UserContext';
import { Search, Plus, List, ArrowLeft, X, AlertTriangle, ArrowRight, Eye, FileText, Filter, ChevronUp } from 'lucide-react';

export default function MovimentacaoCompressaoAba({ categorias, titulo }) {
    const { items: itensCadastrados, updateItem } = useCompressao();
    const { movimentacoes, addSaida, registrarDevolucao } = useMovimentacoesCompressao();
    const { colaboradores } = useColaboradoresCompressao();
    const { produtos } = useEspessura();
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.nivel === 'admin';

    // Filtra itens ativos da categoria atual (Compressão ou Encapsulamento)
    const itensCadastradosAtivos = useMemo(() => {
        return itensCadastrados.filter(i => categorias.includes(i.categoria) && i.status !== 'Obsoleto');
    }, [itensCadastrados, categorias]);

    const [currentTab, setCurrentTab] = useState('disponibilizacao');
    const [numSearch, setNumSearch] = useState('');
    const [filterEquipamento, setFilterEquipamento] = useState('');
    const [filterPadrao, setFilterPadrao] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    const itensCadastradosAtivosFiltrados = useMemo(() => {
        return itensCadastradosAtivos.filter(i => {
            const num = i.numIdentificacao || i.numFormato || '';
            const matchNum = num.toLowerCase().includes(numSearch.toLowerCase());
            
            const equip = i.categoria === 'Compressão' ? (i.equipamentos?.join(', ') || '') : (i.equipamento || '');
            const matchEquip = filterEquipamento ? equip.toLowerCase().includes(filterEquipamento.toLowerCase()) : true;

            const padrao = i.padraoPuncoes || '';
            const matchPadrao = filterPadrao ? padrao.toLowerCase().includes(filterPadrao.toLowerCase()) : true;

            return matchNum && matchEquip && matchPadrao;
        });
    }, [itensCadastradosAtivos, numSearch, filterEquipamento, filterPadrao]);

    const emUso = useMemo(() => movimentacoes.filter(m => m.status === 'Em Uso'), [movimentacoes]);
    const historico = useMemo(() => movimentacoes.filter(m => m.status === 'Devolvido'), [movimentacoes]);

    const [itemToObsolete, setItemToObsolete] = useState(null);
    const [viewMovimentacao, setViewMovimentacao] = useState(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfToView, setPdfToView] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const uniqueNumeros = useMemo(() => Array.from(new Set(itensCadastradosAtivos.map(i => i.numIdentificacao || i.numFormato).filter(Boolean))), [itensCadastradosAtivos]);
    const uniquePadroes = useMemo(() => Array.from(new Set(itensCadastradosAtivos.map(i => i.padraoPuncoes).filter(Boolean))), [itensCadastradosAtivos]);
    const uniqueEquips = useMemo(() => {
        const eqs = new Set();
        itensCadastradosAtivos.forEach(i => {
            if (i.categoria === 'Compressão' && i.equipamentos) i.equipamentos.forEach(e => eqs.add(e));
            else if (i.equipamento) eqs.add(i.equipamento);
        });
        return Array.from(eqs);
    }, [itensCadastradosAtivos]);

    // -- ESTADOS SAÍDA --
    const [destinoEquipamento, setDestinoEquipamento] = useState('');
    const [destinoTag, setDestinoTag] = useState('');
    const [codProduto, setCodProduto] = useState('');
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [lote, setLote] = useState('');
    
    // Checkboxes (comuns ou específicos)
    const [conformeOP, setConformeOP] = useState(false);
    const [cabecaAdequada, setCabecaAdequada] = useState(false);
    const [pontaAdequada, setPontaAdequada] = useState(false);
    const [livreAvarias, setLivreAvarias] = useState(false);
    
    // Qtds Saída
    const [qtdSuperioresSaida, setQtdSuperioresSaida] = useState('');
    const [qtdInferioresSaida, setQtdInferioresSaida] = useState('');
    const [qtdMatrizesSaida, setQtdMatrizesSaida] = useState('');

    const [observacoes, setObservacoes] = useState('');
    const [recebedorCracha, setRecebedorCracha] = useState('');
    const [recebedorInfo, setRecebedorInfo] = useState(null);

    // -- ESTADOS DEVOLUÇÃO --
    const [devolucaoModal, setDevolucaoModal] = useState(null);
    const [devRecebedorCracha, setDevRecebedorCracha] = useState('');
    const [devRecebedorInfo, setDevRecebedorInfo] = useState(null);
    const [devCondicao, setDevCondicao] = useState('');
    const [devObservacoes, setDevObservacoes] = useState('');
    const [comprimidosProduzidos, setComprimidosProduzidos] = useState('');

    // -- FILTROS HISTORICO --
    const [histNumSearch, setHistNumSearch] = useState('');
    const [histDataInicio, setHistDataInicio] = useState('');
    const [histDataFim, setHistDataFim] = useState('');
    const [showHistFilters, setShowHistFilters] = useState(false);

    const historicoFiltrado = useMemo(() => {
        let filtered = historico.filter(m => categorias.includes(m.itemCategoria));
        
        if (histNumSearch) {
            filtered = filtered.filter(m => 
                (m.itemNumIdentificacao || '').toLowerCase().includes(histNumSearch.toLowerCase())
            );
        }
        
        if (histDataInicio) {
            const inicio = new Date(histDataInicio + 'T00:00:00');
            filtered = filtered.filter(m => new Date(m.dataSaida) >= inicio);
        }
        
        if (histDataFim) {
            const fim = new Date(histDataFim + 'T23:59:59');
            filtered = filtered.filter(m => new Date(m.dataSaida) <= fim);
        }
        
        return filtered;
    }, [historico, categorias, histNumSearch, histDataInicio, histDataFim]);

    // -- ALERTAS GERAIS --
    const [alertMsg, setAlertMsg] = useState(null);
    const [alertType, setAlertType] = useState('');
    const showSuccess = (msg) => { setAlertMsg(msg); setAlertType('success'); setTimeout(() => setAlertMsg(null), 3000); };
    const showError = (msg) => { setAlertMsg(msg); setAlertType('error'); setTimeout(() => setAlertMsg(null), 4000); };

    // Buscar item por numIdentificacao ou numFormato
    const handleNumSearchChange = (val) => {
        setNumSearch(val);
        const found = itensCadastradosAtivos.find(i => 
            (i.numIdentificacao && i.numIdentificacao.toLowerCase() === val.toLowerCase()) || 
            (i.numFormato && i.numFormato.toLowerCase() === val.toLowerCase())
        );
        setSelectedItem(found || null);
        setDestinoEquipamento('');
        setDestinoTag('');
        setCodProduto('');
        setProdutoSelecionado(null);
    };

    const handleCodProdutoChange = (val) => {
        setCodProduto(val);
        const prod = produtos.find(p => p.codigoPI === val);
        setProdutoSelecionado(prod ? { codigo: prod.codigoPI, nome: prod.produtoPI } : null);
    };

    const handleCrachaChange = (val, isDevolucao = false) => {
        if(isDevolucao) {
            setDevRecebedorCracha(val);
            setDevRecebedorInfo(colaboradores.find(c => c.cracha === val) || null);
        } else {
            setRecebedorCracha(val);
            setRecebedorInfo(colaboradores.find(c => c.cracha === val) || null);
        }
    };

    const handleSaveSaida = (e) => {
        e.preventDefault();
        
        const missingFields = [];
        if (!selectedItem) missingFields.push('Número válido');
        if (!destinoEquipamento) missingFields.push('Equipamento');
        if (!destinoTag) missingFields.push('TAG do Equipamento');
        if (!codProduto) missingFields.push('Código do Produto');
        if (!lote) missingFields.push('Lote');
        if (!recebedorCracha) missingFields.push('Responsável pelo Recebimento (Crachá)');
        
        if (categorias.includes('Compressão')) {
            if (!qtdSuperioresSaida || !qtdInferioresSaida || !qtdMatrizesSaida) missingFields.push('Quantidades (Sup/Inf/Matrizes)');
        }

        if (missingFields.length > 0) return showError(`Preencha: ${missingFields.join(', ')}`);

        if (selectedItem.statusDanificado) return showError('Este item está marcado como danificado. Não pode ser disponibilizado.');
        if (emUso.some(m => m.itemId === selectedItem.id)) return showError('Este item já está em uso.');
        if (!recebedorInfo) return showError('Recebedor não encontrado (Crachá inválido ou não cadastrado).');
        if (!produtoSelecionado) return showError('Produto não cadastrado. Insira um código válido.');

        if (categorias.includes('Compressão')) {
            if (Number(qtdSuperioresSaida) > Number(selectedItem.qtdSuperiores)) return showError(`A quantidade de punções superiores excede o cadastro (${selectedItem.qtdSuperiores}).`);
            if (Number(qtdInferioresSaida) > Number(selectedItem.qtdInferiores)) return showError(`A quantidade de punções inferiores excede o cadastro (${selectedItem.qtdInferiores}).`);
            if (Number(qtdMatrizesSaida) > Number(selectedItem.qtdMatrizesSegmentos)) return showError(`A quantidade de matrizes/segmentos excede o cadastro (${selectedItem.qtdMatrizesSegmentos}).`);
        }

        addSaida({
            itemId: selectedItem.id,
            itemCategoria: selectedItem.categoria,
            itemNumIdentificacao: selectedItem.numIdentificacao || selectedItem.numFormato,
            destinoEquipamento,
            destinoTag,
            produtoCodigo: produtoSelecionado.codigo,
            produtoNome: produtoSelecionado.nome,
            lote,
            qtdSuperioresSaida,
            qtdInferioresSaida,
            qtdMatrizesSaida,
            conformeOP,
            cabecaAdequada,
            pontaAdequada,
            livreAvarias,
            observacoes,
            recebedorColaboradorId: recebedorInfo.id,
            recebedorNome: recebedorInfo.nome
        });

        showSuccess('Disponibilização salva com sucesso!');
        setNumSearch(''); setSelectedItem(null); setDestinoEquipamento(''); setDestinoTag(''); setCodProduto(''); setProdutoSelecionado(null); setLote('');
        setQtdSuperioresSaida(''); setQtdInferioresSaida(''); setQtdMatrizesSaida('');
        setConformeOP(false); setCabecaAdequada(false); setPontaAdequada(false); setLivreAvarias(false); 
        setObservacoes(''); setRecebedorCracha(''); setRecebedorInfo(null);
        setCurrentTab('em-uso');
    };

    const handleSaveDevolucao = (e) => {
        e.preventDefault();
        const missingFields = [];
        if (!devRecebedorCracha) missingFields.push('Responsável pela Devolução (Crachá)');
        if (!devCondicao) missingFields.push('Condição da Devolução');
        if ((devCondicao === 'Com avarias' || devCondicao === 'Desgaste de uso') && !devObservacoes.trim()) missingFields.push('Observações');
        if (categorias.includes('Compressão') && !comprimidosProduzidos) missingFields.push('Comprimidos Produzidos');

        if (missingFields.length > 0) return showError(`Preencha: ${missingFields.join(', ')}`);
        if (!devRecebedorInfo) return showError('Responsável pela devolução não encontrado (Crachá inválido).');

        registrarDevolucao(devolucaoModal.id, {
            colaboradorDevolucaoNome: devRecebedorInfo.nome,
            condicao: devCondicao,
            observacoesDevolucao: devObservacoes,
            comprimidosProduzidos: comprimidosProduzidos ? Number(comprimidosProduzidos) : 0
        });

        showSuccess('Devolução registrada com sucesso!');
        setDevolucaoModal(null);
        setDevRecebedorCracha(''); setDevRecebedorInfo(null); setDevCondicao(''); setDevObservacoes(''); setComprimidosProduzidos('');
    };

    const confirmMarkAsObsolete = () => {
        if (!itemToObsolete) return;
        updateItem(itemToObsolete.id, { status: 'Obsoleto' });
        showSuccess('Item movido para obsoletos.');
        setItemToObsolete(null);
    };

    const openPdf = (pdfBase64) => {
        setPdfToView(pdfBase64);
        setShowPdfModal(true);
    };

    const limitReached = selectedItem && categorias.includes('Compressão') 
        ? ((selectedItem.comprimidosProduzidosTotais || 0) / (selectedItem.estimativaProducao || 1)) >= 0.7 
        : false;

    return (
        <>
        <div className="card p-6 animate-fade-in relative">
            {alertMsg && (
                <div style={{
                    position: 'absolute', top: '1rem', right: '1rem', padding: '1rem 2rem', 
                    background: alertType === 'error' ? 'var(--danger-color)' : 'var(--success-color)', 
                    color: '#fff', borderRadius: '4px', fontWeight: 'bold', zIndex: 1050,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    {alertMsg}
                </div>
            )}

            <div className="tabs mb-4" style={{ display: 'inline-flex', padding: '0.25rem', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>
                <button className={`tab ${currentTab === 'disponibilizacao' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('disponibilizacao')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>
                    Saída (Disponibilização)
                </button>
                <button className={`tab ${currentTab === 'em-uso' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('em-uso')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>
                    Em Uso
                </button>
                <button className={`tab ${currentTab === 'cadastrados' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('cadastrados')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>
                    Itens Cadastrados
                </button>
                <button className={`tab ${currentTab === 'historico' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('historico')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>
                    Histórico
                </button>
                {isAdmin && (
                    <button className={`tab ${currentTab === 'obsoletos' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('obsoletos')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>
                        Obsoletos / Descarte
                    </button>
                )}
            </div>

            {currentTab === 'disponibilizacao' && (
                <form onSubmit={handleSaveSaida}>
                    <div className="form-group">
                        <label>Número de Identificação do Conjunto / Formato</label>
                        <input type="text" className="form-control" required value={numSearch} onChange={e => handleNumSearchChange(e.target.value)} list="num-list" placeholder="Digite para buscar..." />
                        <datalist id="num-list">
                            {itensCadastradosAtivos.map(i => <option key={i.id} value={i.numIdentificacao || i.numFormato} />)}
                        </datalist>
                        {numSearch && !selectedItem && <small className="text-danger mt-1 block">Item não encontrado ou obsoleto.</small>}
                        {selectedItem && selectedItem.statusDanificado && <small className="text-danger mt-1 block font-bold">Este item está danificado e não pode ser utilizado.</small>}
                        {selectedItem && emUso.some(m => m.itemId === selectedItem.id) && <small className="text-danger mt-1 block font-bold">Este item já está registrado como "Em Uso".</small>}
                    </div>

                    {categorias.includes('Compressão') && selectedItem && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                            <div className="form-group mb-0">
                                <label>Padrão dos Punções</label>
                                <input type="text" className="form-control bg-light" disabled value={selectedItem?.padraoPuncoes || ''} />
                            </div>
                            <div className="form-group mb-0">
                                <label>Medida do Punção</label>
                                <input type="text" className="form-control bg-light" disabled value={selectedItem?.medidaPuncao || ''} />
                            </div>
                            <div className="form-group mb-0">
                                <label>Raio</label>
                                <input type="text" className="form-control bg-light" disabled value={selectedItem?.raio || ''} />
                            </div>
                            <div className="form-group mb-0">
                                <label>Tipo de Matriz (Conj. Inferior)</label>
                                <input type="text" className="form-control bg-light" disabled value={selectedItem?.tipoMatriz || ''} />
                            </div>
                        </div>
                    )}

                    {categorias.includes('Compressão') && selectedItem && (
                        <div className={`mb-4 p-3 rounded border ${limitReached ? 'bg-warning-light border-warning text-warning-dark' : 'bg-light border-light'}`}>
                            <h4 className="mb-2" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {limitReached && <AlertTriangle size={18} />}
                                Comprimidos Produzidos vs Estimativa
                            </h4>
                            <strong>{(selectedItem.comprimidosProduzidosTotais || 0).toLocaleString()}</strong> / {(Number(selectedItem.estimativaProducao) || 0).toLocaleString()}
                        </div>
                    )}

                    {categorias.includes('Compressão') && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }} className="mb-4">
                            <div className="form-group mb-0">
                                <label>Punções Superiores {selectedItem && `(Máx: ${selectedItem.qtdSuperiores})`}</label>
                                <input type="number" className="form-control" disabled={!selectedItem} required={categorias.includes('Compressão')} value={qtdSuperioresSaida} onChange={e => setQtdSuperioresSaida(e.target.value)} />
                            </div>
                            <div className="form-group mb-0">
                                <label>Punções Inferiores {selectedItem && `(Máx: ${selectedItem.qtdInferiores})`}</label>
                                <input type="number" className="form-control" disabled={!selectedItem} required={categorias.includes('Compressão')} value={qtdInferioresSaida} onChange={e => setQtdInferioresSaida(e.target.value)} />
                            </div>
                            <div className="form-group mb-0">
                                <label>Matrizes/Segmentos {selectedItem && `(Máx: ${selectedItem.qtdMatrizesSegmentos})`}</label>
                                <input type="number" className="form-control" disabled={!selectedItem} required={categorias.includes('Compressão')} value={qtdMatrizesSaida} onChange={e => setQtdMatrizesSaida(e.target.value)} />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem' }} className="mb-4">
                        <div className="form-group mb-0">
                            <label>Lote</label>
                            <input type="text" className="form-control" required value={lote} onChange={e => setLote(e.target.value)} />
                        </div>
                        <div className="form-group mb-0">
                            <label>Código do Produto</label>
                            <input type="text" className="form-control" required value={codProduto} onChange={e => handleCodProdutoChange(e.target.value)} list="produtos-list" disabled={!selectedItem} />
                            <datalist id="produtos-list">
                                {produtos.map(p => <option key={p.id} value={p.codigoPI} />)}
                            </datalist>
                        </div>
                        <div className="form-group mb-0">
                            <label>Nome do Produto</label>
                            <input type="text" className="form-control bg-light" disabled value={produtoSelecionado?.nome || 'Não selecionado'} />
                        </div>
                    </div>

                    <div className="mb-4 flex flex-col gap-2 p-3 bg-light rounded border">
                        {categorias.includes('Compressão') ? (
                            <>
                                <label className="flex items-center gap-2 m-0" style={{ cursor: 'pointer' }}>
                                    <input type="checkbox" checked={conformeOP} onChange={e => setConformeOP(e.target.checked)} />
                                    Em conformidade com a Ordem de Produção
                                </label>
                                <label className="flex items-center gap-2 m-0" style={{ cursor: 'pointer' }}>
                                    <input type="checkbox" checked={cabecaAdequada} onChange={e => setCabecaAdequada(e.target.checked)} />
                                    Cabeça dos punções em condições adequadas para uso
                                </label>
                                <label className="flex items-center gap-2 m-0" style={{ cursor: 'pointer' }}>
                                    <input type="checkbox" checked={pontaAdequada} onChange={e => setPontaAdequada(e.target.checked)} />
                                    Ponta dos punções em condições adequadas para uso
                                </label>
                            </>
                        ) : (
                            <>
                                <label className="flex items-center gap-2 m-0" style={{ cursor: 'pointer' }}>
                                    <input type="checkbox" checked={livreAvarias} onChange={e => setLivreAvarias(e.target.checked)} />
                                    Livre de avarias
                                </label>
                                <label className="flex items-center gap-2 m-0" style={{ cursor: 'pointer' }}>
                                    <input type="checkbox" checked={conformeOP} onChange={e => setConformeOP(e.target.checked)} />
                                    Em conformidade com a Ordem de Produção
                                </label>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                        <div className="form-group mb-0">
                            <label>Equipamento</label>
                            <select className="form-control" required disabled={!selectedItem} value={destinoEquipamento} onChange={e => setDestinoEquipamento(e.target.value)}>
                                <option value="">Selecione...</option>
                                {selectedItem?.categoria === 'Compressão' 
                                    ? selectedItem.equipamentos?.map(eq => <option key={eq} value={eq}>{eq}</option>)
                                    : (selectedItem?.equipamento && <option value={selectedItem.equipamento}>{selectedItem.equipamento}</option>)
                                }
                            </select>
                        </div>
                        {destinoEquipamento && (
                            <div className="form-group mb-0">
                                <label>TAG do Equipamento</label>
                                <input type="text" className="form-control" required value={destinoTag} onChange={e => setDestinoTag(e.target.value)} />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Responsável pelo Recebimento (Número do Crachá)</label>
                        <input type="password" required className="form-control" value={recebedorCracha} onChange={e => handleCrachaChange(e.target.value)} />
                        {recebedorCracha && !recebedorInfo && <small className="text-danger mt-1 block">Crachá não cadastrado no módulo de Compressão.</small>}
                        {recebedorInfo && (
                            <div className="mt-2 p-2 bg-light border rounded text-sm">
                                <div className="text-success font-bold mb-1">Colaborador Localizado:</div>
                                <div><strong>Nome:</strong> {recebedorInfo.nome} | <strong>Matrícula:</strong> {recebedorInfo.matricula} | <strong>Turno:</strong> {recebedorInfo.turno}</div>
                                <div className="mt-1 text-secondary"><strong>Disponibilizado por:</strong> {currentUser?.nome || 'Logado'}</div>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Observações</label>
                        <textarea className="form-control" rows="3" value={observacoes} onChange={e => setObservacoes(e.target.value)}></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary w-full flex justify-center py-3">
                        Salvar Disponibilização
                    </button>
                </form>
            )}

            {currentTab === 'em-uso' && (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Destino</th>
                                <th>Responsável Saída</th>
                                <th>Recebedor</th>
                                <th>Data/Hora Saída</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emUso.filter(m => categorias.includes(m.itemCategoria)).length === 0 ? (
                                <tr><td colSpan="6" className="text-center text-secondary py-4">Nenhum item em uso no momento.</td></tr>
                            ) : (
                                emUso.filter(m => categorias.includes(m.itemCategoria)).map(m => (
                                    <tr key={m.id}>
                                        <td><strong>{m.itemNumIdentificacao}</strong></td>
                                        <td>{m.destinoEquipamento} ({m.destinoTag})</td>
                                        <td>{m.responsavelSaida}</td>
                                        <td>{m.recebedorNome}</td>
                                        <td>{new Date(m.dataSaida).toLocaleString()}</td>
                                        <td>
                                            <button className="btn btn-sm" style={{ background: 'var(--success-color)', color: 'white' }} onClick={() => setDevolucaoModal(m)}>Devolver</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}


        </div>

        {/* ABA CADASTRADOS */}
        {currentTab === 'cadastrados' && (
            <div className="animate-fade-in mt-4">
                <div className="mb-4">
                    <button className="btn btn-secondary btn-sm flex items-center gap-2 mb-2" onClick={() => setShowFilters(!showFilters)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                        {showFilters ? <ChevronUp size={16} /> : <Filter size={16} />}
                        {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                    
                    {showFilters && (
                        <div className="card p-3 animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                            <div className="form-group mb-0">
                                <label className="text-xs text-secondary">Número</label>
                                <input type="text" list="numeros-list" className="form-control" placeholder="Buscar número..." value={numSearch} onChange={e => setNumSearch(e.target.value)} />
                                <datalist id="numeros-list">
                                    {uniqueNumeros.map(n => <option key={n} value={n} />)}
                                </datalist>
                            </div>
                            {categorias.includes('Compressão') && (
                                <div className="form-group mb-0">
                                    <label className="text-xs text-secondary">Padrão</label>
                                    <input type="text" list="padroes-list" className="form-control" placeholder="Buscar padrão..." value={filterPadrao} onChange={e => setFilterPadrao(e.target.value)} />
                                    <datalist id="padroes-list">
                                        {uniquePadroes.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                </div>
                            )}
                            <div className="form-group mb-0">
                                <label className="text-xs text-secondary">Equipamento</label>
                                <input type="text" list="equips-list" className="form-control" placeholder="Buscar equipamento..." value={filterEquipamento} onChange={e => setFilterEquipamento(e.target.value)} />
                                <datalist id="equips-list">
                                    {uniqueEquips.map(e => <option key={e} value={e} />)}
                                </datalist>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card p-0">
                    <table className="table m-0">
                        <thead>
                            <tr>
                                <th>Número</th>
                                {categorias.includes('Compressão') && <th>Padrão</th>}
                                <th>Equipamento(s)</th>
                                {categorias.includes('Compressão') && <th>Uso Estimado</th>}
                                <th>Status</th>
                                <th className="text-center">PDF do projeto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itensCadastradosAtivosFiltrados.length === 0 ? (
                                <tr><td colSpan={categorias.includes('Compressão') ? "6" : "4"} className="text-center py-4 text-secondary">Nenhum item encontrado.</td></tr>
                            ) : itensCadastradosAtivosFiltrados.map(i => {
                                const isCompressao = i.categoria === 'Compressão';
                                const produced = Number(i.comprimidosProduzidosTotais) || 0;
                                const estimativa = Number(i.estimativaProducao) || 1; 
                                const percent = isCompressao ? (produced / estimativa) * 100 : 0;
                                const limitReached = isCompressao && percent >= 70;
                                const trStyle = limitReached ? { backgroundColor: '#FEF2F2', borderLeft: '4px solid var(--danger-color)' } : (i.statusDanificado ? { backgroundColor: '#FEF2F2' } : {});

                                return (
                                    <tr key={i.id} style={trStyle}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {limitReached && <AlertTriangle size={16} className="text-danger" title="Atenção: Este conjunto atingiu 70% ou mais da estimativa de produção!" />}
                                                <strong>{i.numIdentificacao || i.numFormato}</strong>
                                            </div>
                                        </td>
                                        {categorias.includes('Compressão') && <td>{i.padraoPuncoes}</td>}
                                        <td>{isCompressao ? (i.equipamentos?.join(', ') || '-') : i.equipamento}</td>
                                        {categorias.includes('Compressão') && (
                                            <td>
                                                {i.estimativaProducao ? (
                                                    <div className="text-sm">
                                                        <div><strong>{produced.toLocaleString()}</strong> / {Number(i.estimativaProducao).toLocaleString()}</div>
                                                        <div className={limitReached ? 'text-danger font-bold' : 'text-secondary'}>{percent.toFixed(1)}% utilizado</div>
                                                    </div>
                                                ) : <span className="text-secondary">-</span>}
                                            </td>
                                        )}
                                        <td>
                                            {i.statusDanificado ? (
                                                <span className="text-danger flex items-center gap-1 text-sm"><AlertTriangle size={14}/> Danificado</span>
                                            ) : (
                                                <span className="text-success text-sm">Operacional</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <div className="flex justify-center gap-2">
                                                {i.anexoPdf && <button className="btn btn-icon text-primary" onClick={() => openPdf(i.anexoPdf)} title="Ver PDF"><FileText size={18}/></button>}
                                                {isAdmin && i.statusDanificado && (
                                                    <button className="btn btn-icon text-secondary" onClick={() => setItemToObsolete(i)} title="Mover para Obsoletos/Descarte"><ArrowRight size={18}/></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* ABA HISTÓRICO */}
        {currentTab === 'historico' && (
            <div className="card p-0 mt-4 animate-fade-in">
                <div className="p-4 border-b">
                    <button className="btn btn-secondary btn-sm flex items-center gap-2" onClick={() => setShowHistFilters(!showHistFilters)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                        {showHistFilters ? <ChevronUp size={16} /> : <Filter size={16} />}
                        {showHistFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </button>
                    {showHistFilters && (
                        <div className="mt-4 flex gap-4 items-end flex-wrap animate-fade-in bg-light p-3 rounded border">
                            <div className="form-group mb-0" style={{ minWidth: '200px', flex: 1 }}>
                                <label className="text-xs text-secondary">Número de Identificação</label>
                                <input type="text" className="form-control" placeholder="Buscar número..." value={histNumSearch} onChange={e => setHistNumSearch(e.target.value)} />
                            </div>
                            <div className="form-group mb-0" style={{ minWidth: '150px' }}>
                                <label className="text-xs text-secondary">Data Saída Inicial</label>
                                <input type="date" className="form-control" value={histDataInicio} onChange={e => setHistDataInicio(e.target.value)} />
                            </div>
                            <div className="form-group mb-0" style={{ minWidth: '150px' }}>
                                <label className="text-xs text-secondary">Data Saída Final</label>
                                <input type="date" className="form-control" value={histDataFim} onChange={e => setHistDataFim(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>
                <table className="table m-0">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Categoria</th>
                            <th>Saída</th>
                            <th>Devolução</th>
                            <th>Condição</th>
                            <th className="text-center">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historicoFiltrado.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-4 text-secondary">Nenhum histórico encontrado com esses filtros.</td></tr>
                        ) : historicoFiltrado.map(mov => (
                            <tr key={mov.id}>
                                <td><strong>{mov.itemNumIdentificacao}</strong></td>
                                <td>{mov.itemCategoria}</td>
                                <td>{new Date(mov.dataSaida).toLocaleDateString()}</td>
                                <td>{mov.dataDevolucao ? new Date(mov.dataDevolucao).toLocaleDateString() : '-'}</td>
                                <td>
                                    <span className={(mov.condicao === 'Com avarias' || mov.condicao === 'Desgaste de uso') ? 'text-danger' : 'text-success'}>
                                        {mov.condicao || 'Em Uso'}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <button className="btn btn-icon text-secondary" onClick={() => setViewMovimentacao(mov)} title="Expandir"><Eye size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* ABA OBSOLETOS */}
        {currentTab === 'obsoletos' && isAdmin && (
            <div className="card p-0 mt-4 animate-fade-in">
                <table className="table m-0">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Categoria</th>
                            <th>Histórico/Motivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itensCadastrados.filter(i => categorias.includes(i.categoria) && i.status === 'Obsoleto').length === 0 ? (
                            <tr><td colSpan="3" className="text-center py-4 text-secondary">Nenhum item obsoleto.</td></tr>
                        ) : itensCadastrados.filter(i => categorias.includes(i.categoria) && i.status === 'Obsoleto').map(i => (
                            <tr key={i.id} style={{ opacity: 0.7 }}>
                                <td><strong>{i.numIdentificacao || i.numFormato}</strong></td>
                                <td>{i.categoria}</td>
                                <td><small>{i.historicoDanos || 'Movido para descarte'}</small></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* MODAL DE DEVOLUÇÃO */}
        {devolucaoModal && (
            <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="m-0">Devolução - {devolucaoModal.itemNumIdentificacao}</h3>
                        <button className="btn btn-icon" onClick={() => {
                            setDevolucaoModal(null);
                            setDevRecebedorCracha(''); setDevRecebedorInfo(null); setDevCondicao(''); setDevObservacoes(''); setComprimidosProduzidos('');
                        }}><X /></button>
                    </div>
                    
                    <form onSubmit={handleSaveDevolucao}>
                        <div className="form-group">
                            <label>Crachá do Responsável pela Devolução</label>
                            <input type="password" required className="form-control" value={devRecebedorCracha} onChange={e => handleCrachaChange(e.target.value, true)} />
                            {devRecebedorCracha && !devRecebedorInfo && <small className="text-danger mt-1 block">Crachá não encontrado no módulo de Compressão.</small>}
                            {devRecebedorInfo && (
                                <div className="mt-2 p-2 bg-light border rounded text-sm">
                                    <div className="text-success font-bold mb-1">Colaborador Localizado:</div>
                                    <div><strong>Nome:</strong> {devRecebedorInfo.nome} | <strong>Matrícula:</strong> {devRecebedorInfo.matricula} | <strong>Turno:</strong> {devRecebedorInfo.turno}</div>
                                    <div className="mt-1 text-secondary"><strong>Recebido por:</strong> {currentUser?.nome || 'Logado'}</div>
                                </div>
                            )}
                        </div>

                        {categorias.includes('Compressão') && (
                            <div className="form-group">
                                <label>Quantidade de comprimidos produzidos nesta rodada</label>
                                <input type="number" required className="form-control" value={comprimidosProduzidos} onChange={e => setComprimidosProduzidos(e.target.value)} />
                                <small className="text-secondary block mt-1">Este valor será somado ao histórico do conjunto.</small>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Condição do Item</label>
                            <select required className="form-control" value={devCondicao} onChange={e => setDevCondicao(e.target.value)}>
                                <option value="">Selecione...</option>
                                <option value="Sem avarias">Sem avarias</option>
                                <option value="Com avarias">Com avarias</option>
                                <option value="Desgaste de uso">Desgaste de uso</option>
                            </select>
                        </div>

                        {(devCondicao === 'Com avarias' || devCondicao === 'Desgaste de uso') && (
                            <div className="form-group">
                                <label>Observações sobre a Avaria / Desgaste (Obrigatório)</label>
                                <textarea required className="form-control" rows="3" value={devObservacoes} onChange={e => setDevObservacoes(e.target.value)}></textarea>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full mt-4">Finalizar Devolução</button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL DE OBSOLETOS */}
        {itemToObsolete && (
            <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                <div className="modal-content text-center" style={{ maxWidth: '400px' }}>
                    <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
                    <h3>Atenção</h3>
                    <p className="mb-6">Deseja realmente mover o item <strong>{itemToObsolete.numIdentificacao || itemToObsolete.numFormato}</strong> para Obsoletos? Ele não estará mais disponível para uso.</p>
                    <div className="flex gap-4 justify-center">
                        <button className="btn" onClick={() => setItemToObsolete(null)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={confirmMarkAsObsolete} style={{ background: 'var(--danger-color)', color: '#fff', border: 'none' }}>Sim, Mover</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL VIEW DETALHES */}
        {viewMovimentacao && (
            <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div className="flex justify-between items-center mb-6 pb-2 border-b">
                        <h3 className="m-0">Detalhes da Movimentação</h3>
                        <button className="btn btn-icon" onClick={() => setViewMovimentacao(null)}><X size={20}/></button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><span className="text-secondary text-sm block">Número</span><strong>{viewMovimentacao.itemNumIdentificacao}</strong></div>
                            <div><span className="text-secondary text-sm block">Destino</span><strong>{viewMovimentacao.destinoEquipamento} ({viewMovimentacao.destinoTag})</strong></div>
                            <div><span className="text-secondary text-sm block">Produto</span><strong>{viewMovimentacao.produtoNome} ({viewMovimentacao.produtoCodigo})</strong></div>
                        </div>
                        
                        <div className="p-3 bg-light rounded border mt-2">
                            <h4 className="text-sm text-secondary mb-2 uppercase">Disponibilização</h4>
                            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div><span className="text-secondary text-sm">Data:</span> {new Date(viewMovimentacao.dataSaida).toLocaleString()}</div>
                                <div><span className="text-secondary text-sm">Responsável (Saída):</span> {viewMovimentacao.responsavelSaida}</div>
                                <div><span className="text-secondary text-sm">Recebedor:</span> {viewMovimentacao.recebedorNome}</div>
                                <div><span className="text-secondary text-sm">Lote:</span> {viewMovimentacao.lote || '-'}</div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t">
                                <h5 className="text-sm mb-2 text-secondary">Verificações de Saída</h5>
                                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {categorias.includes('Compressão') ? (
                                        <>
                                            <div><span className="text-secondary text-sm">Conf. OP:</span> {viewMovimentacao.conformeOP ? 'Sim' : 'Não'}</div>
                                            <div><span className="text-secondary text-sm">Cabeça:</span> {viewMovimentacao.cabecaAdequada ? 'Adequada' : 'Não Adequada'}</div>
                                            <div><span className="text-secondary text-sm">Ponta:</span> {viewMovimentacao.pontaAdequada ? 'Adequada' : 'Não Adequada'}</div>
                                            <div><span className="text-secondary text-sm">Superiores Saída:</span> {viewMovimentacao.qtdSuperioresSaida}</div>
                                            <div><span className="text-secondary text-sm">Inferiores Saída:</span> {viewMovimentacao.qtdInferioresSaida}</div>
                                            <div><span className="text-secondary text-sm">Matrizes Saída:</span> {viewMovimentacao.qtdMatrizesSaida}</div>
                                        </>
                                    ) : (
                                        <>
                                            <div><span className="text-secondary text-sm">Conf. OP:</span> {viewMovimentacao.conformeOP ? 'Sim' : 'Não'}</div>
                                            <div><span className="text-secondary text-sm">Livre de Avarias:</span> {viewMovimentacao.livreAvarias ? 'Sim' : 'Não'}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {viewMovimentacao.observacoes && <div className="mt-2"><span className="text-secondary text-sm block">Obs:</span> {viewMovimentacao.observacoes}</div>}
                        </div>

                        {viewMovimentacao.status === 'Devolvido' && (
                            <div className="p-3 bg-light rounded border">
                                <h4 className="text-sm text-secondary mb-2 uppercase">Devolução</h4>
                                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div><span className="text-secondary text-sm">Data:</span> {new Date(viewMovimentacao.dataDevolucao).toLocaleString()}</div>
                                    <div><span className="text-secondary text-sm">Responsável (Receb.):</span> {viewMovimentacao.responsavelRecebimento}</div>
                                    <div><span className="text-secondary text-sm">Devolvido por:</span> {viewMovimentacao.colaboradorDevolucaoNome}</div>
                                    <div><span className="text-secondary text-sm">Condição:</span> <strong className={(viewMovimentacao.condicao === 'Com avarias' || viewMovimentacao.condicao === 'Desgaste de uso') ? 'text-danger' : 'text-success'}>{viewMovimentacao.condicao}</strong></div>
                                    {categorias.includes('Compressão') && (
                                        <div><span className="text-secondary text-sm">Comprimidos Prod.:</span> {viewMovimentacao.comprimidosProduzidos || 0}</div>
                                    )}
                                </div>
                                {viewMovimentacao.observacoesDevolucao && <div className="mt-2"><span className="text-secondary text-sm block">Obs:</span> <span className="text-danger">{viewMovimentacao.observacoesDevolucao}</span></div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* MODAL PDF */}
        {showPdfModal && (
            <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                <div className="modal-content" style={{ width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="m-0 flex items-center gap-2"><FileText size={20} /> Visualizador de PDF</h3>
                        <button className="btn btn-icon" onClick={() => setShowPdfModal(false)}><X size={20} /></button>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f8f9fa', borderRadius: '4px', overflow: 'hidden' }}>
                        <iframe src={pdfToView} title="PDF" style={{ width: '100%', height: '100%', border: 'none' }} />
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
