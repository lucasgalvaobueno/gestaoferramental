import React, { useState, useMemo } from 'react';
import { useManipulacao } from '../contexts/ManipulacaoContext';
import { useColaboradores } from '../contexts/ColaboradoresContext';
import { useEspessura } from '../contexts/EspessuraContext';
import { useMovimentacoesManipulacao } from '../contexts/MovimentacoesManipulacaoContext';
import { useAuth } from '../contexts/UserContext';
import { ArrowRight, ArrowLeft, History, AlertTriangle, Eye, X, CheckSquare, CheckCircle2, AlertCircle, Filter } from 'lucide-react';

export default function MovimentacaoManipulacaoAba({ categorias, titulo }) {
    const { items, updateItem } = useManipulacao();
    const { colaboradores } = useColaboradores();
    const { produtos } = useEspessura();
    const { movimentacoes, addSaida, registrarDevolucao } = useMovimentacoesManipulacao();
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.nivel === 'admin';

    const [successMessage, setSuccessMessage] = useState('');
    const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };
    const [errorMessage, setErrorMessage] = useState('');
    const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };

    const [currentTab, setCurrentTab] = useState('saida');

    // -- ESTADOS DA SAÍDA --
    const [tagSearch, setTagSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [destino, setDestino] = useState('');
    const [codProduto, setCodProduto] = useState('');
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [livreAvarias, setLivreAvarias] = useState(false);
    const [conformeOP, setConformeOP] = useState(false);
    const [devidamenteIdentificada, setDevidamenteIdentificada] = useState(false);
    const [lote, setLote] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [recebedorCracha, setRecebedorCracha] = useState('');
    const [recebedorInfo, setRecebedorInfo] = useState(null);

    // -- ESTADOS DEVOLUÇÃO --
    const [devolucaoModal, setDevolucaoModal] = useState(null); // mov item
    const [devRecebedorCracha, setDevRecebedorCracha] = useState('');
    const [devRecebedorInfo, setDevRecebedorInfo] = useState(null);
    const [devCondicao, setDevCondicao] = useState(''); // Sem avarias, Com avarias, Desgaste de uso
    const [devObservacoes, setDevObservacoes] = useState('');

    // -- ESTADOS HISTÓRICO / MODAL VIEW / CONFIRM --
    const [viewMovimentacao, setViewMovimentacao] = useState(null);
    const [itemToObsolete, setItemToObsolete] = useState(null);

    // ── LÓGICA DE FILTRAGEM BASE ──
    const myItems = useMemo(() => items.filter(i => categorias.includes(i.categoria)), [items, categorias]);
    const itensCadastradosAtivos = myItems.filter(i => i.status !== 'Obsoleto');
    const itensObsoletos = myItems.filter(i => i.status === 'Obsoleto');

    const myMovimentacoes = useMemo(() => {
        return movimentacoes.filter(m => categorias.includes(m.itemCategoria));
    }, [movimentacoes, categorias]);

    const emUso = myMovimentacoes.filter(m => m.status === 'Em Uso');
    const historico = myMovimentacoes.filter(m => m.status === 'Devolvido');

    // -- FILTROS HISTORICO --
    const [histTagSearch, setHistTagSearch] = useState('');
    const [histDataInicio, setHistDataInicio] = useState('');
    const [histDataFim, setHistDataFim] = useState('');
    const [showHistFilters, setShowHistFilters] = useState(false);

    const historicoFiltrado = useMemo(() => {
        let filtered = historico;
        
        if (histTagSearch) {
            filtered = filtered.filter(m => 
                (m.itemTag || '').toLowerCase().includes(histTagSearch.toLowerCase())
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
    }, [historico, histTagSearch, histDataInicio, histDataFim]);

    // ── FUNÇÕES SAÍDA ──
    const handleTagSearchChange = (val) => {
        setTagSearch(val);
        const found = itensCadastradosAtivos.find(i => i.tag.toLowerCase() === val.toLowerCase());
        setSelectedItem(found || null);
        setDestino('');
        setCodProduto('');
        setProdutoSelecionado(null);
    };

    const handleCodProdutoChange = (val) => {
        setCodProduto(val);
        if (selectedItem?.categoria === 'Mangueiras' || selectedItem?.categoria === 'Filtros') {
            const prod = selectedItem.produtosDedicados?.find(p => p.codigo === val);
            setProdutoSelecionado(prod ? { codigoPI: prod.codigo, produtoPI: prod.nome } : null);
        } else {
            const found = produtos.find(p => p.codigoPI === val);
            setProdutoSelecionado(found || null);
        }
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
        if (!selectedItem) missingFields.push('TAG válida');
        if (!destino) missingFields.push('Destino (Equipamento)');
        if (!codProduto) missingFields.push('Código do Produto');
        if (!lote) missingFields.push('Lote');
        if (!recebedorCracha) missingFields.push('Responsável pelo Recebimento (Crachá)');

        if (missingFields.length > 0) {
            return showError(`Preencha os campos obrigatórios: ${missingFields.join(', ')}`);
        }

        if (selectedItem.statusDanificado) return showError('Este item está marcado como danificado. Não pode ser disponibilizado.');
        if (emUso.some(m => m.itemId === selectedItem.id)) return showError('Este item já está em uso.');
        if (!recebedorInfo) return showError('Recebedor não encontrado (Crachá inválido ou não cadastrado).');
        if (!produtoSelecionado) return showError('Produto não cadastrado. Insira um código válido.');

        addSaida({
            itemId: selectedItem.id,
            itemCategoria: selectedItem.categoria,
            itemTag: selectedItem.tag,
            itemTipo: selectedItem.tipo,
            itemMedida: selectedItem.medida,
            destino,
            produtoCodigo: produtoSelecionado ? produtoSelecionado.codigoPI : codProduto,
            produtoNome: produtoSelecionado ? produtoSelecionado.produtoPI : 'Não cadastrado',
            lote,
            livreAvarias,
            conformeOP,
            devidamenteIdentificada,
            observacoes,
            recebedorColaboradorId: recebedorInfo.id,
            recebedorNome: recebedorInfo.nome
        });

        showSuccess('Disponibilização salva com sucesso!');
        setTagSearch(''); setSelectedItem(null); setDestino(''); setCodProduto(''); setProdutoSelecionado(null); setLote('');
        setLivreAvarias(false); setConformeOP(false); setDevidamenteIdentificada(false); setObservacoes(''); setRecebedorCracha(''); setRecebedorInfo(null);
        setCurrentTab('em-uso');
    };

    // ── FUNÇÕES DEVOLUÇÃO ──
    const handleSaveDevolucao = (e) => {
        e.preventDefault();
        const missingFields = [];
        if (!devRecebedorCracha) missingFields.push('Responsável pela Devolução (Crachá)');
        if (!devCondicao) missingFields.push('Condição da Devolução');
        if (devCondicao === 'Com avarias' && !devObservacoes.trim()) missingFields.push('Observações');

        if (missingFields.length > 0) {
            return showError(`Preencha os campos obrigatórios: ${missingFields.join(', ')}`);
        }

        if (!devRecebedorInfo) return showError('Responsável pela devolução não encontrado (Crachá inválido ou não cadastrado).');

        registrarDevolucao(devolucaoModal.id, {
            colaboradorDevolucaoNome: devRecebedorInfo.nome,
            condicao: devCondicao,
            observacoesDevolucao: devObservacoes
        });

        showSuccess('Devolução registrada com sucesso!');
        setDevolucaoModal(null);
        setDevRecebedorCracha(''); setDevRecebedorInfo(null); setDevCondicao(''); setDevObservacoes('');
    };

    const confirmMarkAsObsolete = () => {
        if (!itemToObsolete) return;
        updateItem(itemToObsolete.id, { status: 'Obsoleto' });
        showSuccess('Item movido para obsoletos.');
        setItemToObsolete(null);
    };

    return (
        <>
        <div className="animate-fade-in">
            {successMessage && <div className="card bg-success text-white mb-4 flex items-center gap-2"><CheckCircle2 size={20}/> {successMessage}</div>}
            {errorMessage && <div className="card bg-danger text-white mb-4 flex items-center gap-2"><AlertCircle size={20}/> {errorMessage}</div>}
            
            <div className="tabs mb-4" style={{ display: 'inline-flex', padding: '0.25rem', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>
                <button className={`tab ${currentTab === 'saida' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('saida')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>Saída (Disponibilização)</button>
                <button className={`tab ${currentTab === 'em-uso' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('em-uso')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>Em Uso ({emUso.length})</button>
                <button className={`tab ${currentTab === 'cadastradas' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('cadastradas')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>Itens Cadastrados</button>
                <button className={`tab ${currentTab === 'historico' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('historico')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>Histórico</button>
                {isAdmin && <button className={`tab ${currentTab === 'obsoletos' ? 'active bg-white text-primary shadow-sm' : 'text-secondary bg-transparent'}`} onClick={() => setCurrentTab('obsoletos')} style={{ border: 'none', borderRadius: '4px', fontWeight: 600 }}>Obsoletos / Descarte</button>}
            </div>

            {/* ABA SAÍDA */}
            {currentTab === 'saida' && (
                <form onSubmit={handleSaveSaida} className="card p-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h3 className="mb-4">Disponibilização de {titulo}</h3>
                    
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Buscar TAG (Digite para auto-completar)</label>
                        <input type="text" className="form-control" value={tagSearch} onChange={e => handleTagSearchChange(e.target.value)} list="tags-list" placeholder="Ex: MAL-01" required />
                        <datalist id="tags-list">
                            {itensCadastradosAtivos.map(i => <option key={i.id} value={i.tag} />)}
                        </datalist>
                        {selectedItem && selectedItem.statusDanificado && (
                            <div className="text-danger text-sm mt-1 flex items-center gap-1"><AlertTriangle size={14}/> Este item está marcado como danificado e não pode ser utilizado.</div>
                        )}
                        {selectedItem && emUso.some(m => m.itemId === selectedItem.id) && (
                            <div className="text-danger text-sm mt-1 flex items-center gap-1"><AlertTriangle size={14}/> Este item já está em uso na fábrica e não pode ser disponibilizado.</div>
                        )}
                    </div>

                    {!categorias.includes('Filtros') && (
                        <div style={{ display: 'grid', gridTemplateColumns: categorias.includes('Mangueiras') ? '1fr' : '1fr 1fr', gap: '1rem' }} className="mb-4">
                            <div className="form-group mb-0">
                                <label>Tipo</label>
                                <input type="text" className="form-control bg-light" disabled value={selectedItem?.tipo || ''} />
                            </div>
                            {!categorias.includes('Mangueiras') && (
                                <div className="form-group mb-0">
                                    <label>Medida</label>
                                    <input type="text" className="form-control bg-light" disabled value={selectedItem?.medida || ''} />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Destino (Equipamento)</label>
                        <select className="form-control" required value={destino} onChange={e => setDestino(e.target.value)}>
                            <option value="">Selecione o destino...</option>
                            {selectedItem?.equipamentos?.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                        </select>
                        {selectedItem && (!selectedItem.equipamentos || selectedItem.equipamentos.length === 0) && <small className="text-danger">Este item não possui equipamentos vinculados.</small>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem' }} className="mb-4">
                        <div className="form-group mb-0">
                            <label>Lote</label>
                            <input type="text" className="form-control" required value={lote} onChange={e => setLote(e.target.value)} />
                        </div>
                        <div className="form-group mb-0">
                            <label>Código do Produto</label>
                            {categorias.includes('Mangueiras') || categorias.includes('Filtros') ? (
                                <select className="form-control" required value={codProduto} onChange={e => handleCodProdutoChange(e.target.value)} disabled={!selectedItem}>
                                    <option value="">Selecione...</option>
                                    {selectedItem?.produtosDedicados?.map(p => <option key={p.codigo} value={p.codigo}>{p.codigo}</option>)}
                                </select>
                            ) : (
                                <>
                                    <input type="text" className="form-control" required value={codProduto} onChange={e => handleCodProdutoChange(e.target.value)} list="produtos-list" disabled={!selectedItem} />
                                    <datalist id="produtos-list">
                                        {produtos.map(p => <option key={p.id} value={p.codigoPI} />)}
                                    </datalist>
                                </>
                            )}
                        </div>
                        <div className="form-group mb-0">
                            <label>Nome do Produto</label>
                            <input type="text" className="form-control bg-light" disabled value={produtoSelecionado?.produtoPI || 'Não localizado no cadastro'} />
                        </div>
                    </div>

                    <div className="mb-4 flex flex-col gap-2 p-3 bg-light rounded border">
                        {categorias.includes('Mangueiras') ? (
                            <>
                                <label className="flex items-center gap-2 m-0" style={{ cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600 }}>
                                    <input type="checkbox" checked={livreAvarias} onChange={e => setLivreAvarias(e.target.checked)} />
                                    Mangueiras Livres de Avarias
                                </label>
                                <label className="flex items-center gap-2 m-0" style={{ cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600 }}>
                                    <input type="checkbox" checked={conformeOP} onChange={e => setConformeOP(e.target.checked)} />
                                    Em conformidade com a Ordem de Produção
                                </label>
                                <label className="flex items-center gap-2 m-0" style={{ cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 600 }}>
                                    <input type="checkbox" checked={devidamenteIdentificada} onChange={e => setDevidamenteIdentificada(e.target.checked)} />
                                    Mangueiras Devidamente Identificadas
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

                    <div className="form-group">
                        <label>Observações (Opcional)</label>
                        <textarea className="form-control" rows="2" value={observacoes} onChange={e => setObservacoes(e.target.value)}></textarea>
                    </div>

                    <div className="card bg-slate-50 border-slate-200 p-4 mb-4">
                        <h4 className="mb-4 text-sm text-secondary uppercase tracking-wider">Assinaturas</h4>
                        <div className="form-group">
                            <label>Responsável pela Disponibilização</label>
                            <input type="text" className="form-control bg-light" disabled value={currentUser?.nome || 'Usuário'} />
                        </div>
                        <div className="form-group mb-0">
                            <label>Responsável pelo Recebimento (Crachá)</label>
                            <input type="password" required className="form-control" value={recebedorCracha} onChange={e => handleCrachaChange(e.target.value)} />
                            {recebedorInfo ? (
                                <div className="mt-2 text-success text-sm flex items-center gap-1"><CheckSquare size={14}/> Colaborador: {recebedorInfo.nome} ({recebedorInfo.turno})</div>
                            ) : (
                                recebedorCracha && <div className="mt-2 text-danger text-sm">Colaborador não encontrado.</div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full flex justify-center py-3">
                        Salvar Disponibilização
                    </button>
                </form>
            )}

            {/* ABA EM USO */}
            {currentTab === 'em-uso' && (
                <div className="card p-0">
                    <table className="table m-0">
                        <thead>
                            <tr>
                                <th>TAG</th>
                                <th>Destino</th>
                                <th>Disponibilizado em</th>
                                <th>Responsável (Saída)</th>
                                <th>Dias em Uso</th>
                                <th className="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emUso.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-4 text-secondary">Nenhum item em uso no momento.</td></tr>
                            ) : emUso.map(mov => {
                                const dias = Math.floor((new Date() - new Date(mov.dataSaida)) / (1000 * 60 * 60 * 24));
                                return (
                                    <tr key={mov.id}>
                                        <td><strong>{mov.itemTag}</strong></td>
                                        <td>{mov.destino}</td>
                                        <td>{new Date(mov.dataSaida).toLocaleDateString()}</td>
                                        <td>{mov.responsavelSaida}</td>
                                        <td>{dias} dia(s)</td>
                                        <td className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <button className="btn btn-icon text-secondary" onClick={() => setViewMovimentacao(mov)} title="Detalhes"><Eye size={18}/></button>
                                                <button className="btn btn-primary btn-sm" onClick={() => setDevolucaoModal(mov)}>Devolver</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ABA CADASTRADAS */}
            {currentTab === 'cadastradas' && (
                <div className="card p-0">
                    <table className="table m-0">
                        <thead>
                            <tr>
                                <th>TAG</th>
                                <th>Tipo</th>
                                <th>Medida</th>
                                <th>Equipamentos</th>
                                <th>Status</th>
                                {isAdmin && <th className="text-center">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {itensCadastradosAtivos.map(i => (
                                <tr key={i.id} style={{ backgroundColor: i.statusDanificado ? '#FEF2F2' : 'transparent' }}>
                                    <td><strong>{i.tag}</strong></td>
                                    <td>{i.tipo}</td>
                                    <td>{i.medida}</td>
                                    <td>{i.equipamentos?.join(', ') || '-'}</td>
                                    <td>
                                        {i.statusDanificado ? (
                                            <span className="text-danger flex items-center gap-1 text-sm"><AlertTriangle size={14}/> Danificado</span>
                                        ) : (
                                            <span className="text-success text-sm">Operacional</span>
                                        )}
                                    </td>
                                    {isAdmin && (
                                        <td className="text-center">
                                            {i.statusDanificado && (
                                                <button className="btn btn-icon text-secondary" onClick={() => setItemToObsolete(i)} title="Mover para Obsoletos/Descarte"><ArrowRight size={18}/></button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ABA HISTÓRICO */}
            {currentTab === 'historico' && (
                <div className="card p-0">
                    <div className="p-4 border-b">
                        <button className="btn btn-secondary btn-sm flex items-center gap-2" onClick={() => setShowHistFilters(!showHistFilters)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                            {showHistFilters ? <X size={16} /> : <Filter size={16} />}
                            {showHistFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                        </button>
                        {showHistFilters && (
                            <div className="mt-4 flex gap-4 items-end flex-wrap animate-fade-in bg-light p-3 rounded border">
                                <div className="form-group mb-0" style={{ minWidth: '200px', flex: 1 }}>
                                    <label className="text-xs text-secondary">TAG do Item</label>
                                    <input type="text" className="form-control" placeholder="Buscar TAG..." value={histTagSearch} onChange={e => setHistTagSearch(e.target.value)} />
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
                                <th>TAG</th>
                                <th>Saída</th>
                                <th>Devolução</th>
                                <th>Condição</th>
                                <th className="text-center">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historicoFiltrado.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-4 text-secondary">Nenhum histórico encontrado com esses filtros.</td></tr>
                            ) : historicoFiltrado.map(mov => (
                                <tr key={mov.id}>
                                    <td><strong>{mov.itemTag}</strong></td>
                                    <td>{new Date(mov.dataSaida).toLocaleDateString()}</td>
                                    <td>{new Date(mov.dataDevolucao).toLocaleDateString()}</td>
                                    <td>
                                        <span className={mov.condicao === 'Com avarias' ? 'text-danger' : 'text-success'}>
                                            {mov.condicao}
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
            {currentTab === 'obsoletos' && (
                <div className="card p-0">
                    <table className="table m-0">
                        <thead>
                            <tr>
                                <th>TAG</th>
                                <th>Tipo</th>
                                <th>Histórico do Dano</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itensObsoletos.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-4 text-secondary">Nenhum item obsoleto.</td></tr>
                            ) : itensObsoletos.map(i => (
                                <tr key={i.id}>
                                    <td><strong>{i.tag}</strong></td>
                                    <td>{i.tipo}</td>
                                    <td className="text-sm text-danger">{i.historicoDanos || 'Motivo não registrado'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

            {/* MODAL DE DEVOLUÇÃO */}
            {devolucaoModal && (
                <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                    <div className="modal-content" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="m-0 flex items-center gap-2"><ArrowLeft size={20}/> Devolução: {devolucaoModal.itemTag}</h3>
                            <button className="btn btn-icon" onClick={() => setDevolucaoModal(null)}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSaveDevolucao}>
                            <div className="form-group">
                                <label>Responsável pela Devolução (Crachá)</label>
                                <input type="password" required className="form-control" value={devRecebedorCracha} onChange={e => handleCrachaChange(e.target.value, true)} />
                                {devRecebedorInfo ? (
                                    <div className="mt-2 text-success text-sm flex items-center gap-1"><CheckSquare size={14}/> Colaborador: {devRecebedorInfo.nome}</div>
                                ) : (
                                    devRecebedorCracha && <div className="mt-2 text-danger text-sm">Colaborador não encontrado.</div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Responsável pelo Recebimento</label>
                                <input type="text" disabled className="form-control bg-light" value={currentUser?.nome || 'Sistema'} />
                            </div>
                            <div className="form-group">
                                <label>Condição da Devolução</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2"><input type="radio" name="cond" checked={devCondicao === 'Sem avarias'} onChange={() => setDevCondicao('Sem avarias')} /> Sem avarias</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="cond" checked={devCondicao === 'Com avarias'} onChange={() => setDevCondicao('Com avarias')} /> Com avarias</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="cond" checked={devCondicao === 'Desgaste de uso'} onChange={() => setDevCondicao('Desgaste de uso')} /> Desgaste de uso</label>
                                </div>
                            </div>
                            {devCondicao === 'Com avarias' && (
                                <div className="form-group">
                                    <label>Observações (Obrigatório)</label>
                                    <textarea required className="form-control" rows="3" value={devObservacoes} onChange={e => setDevObservacoes(e.target.value)}></textarea>
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary w-full mt-4">Finalizar Devolução</button>
                        </form>
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
                                <div><span className="text-secondary text-sm block">TAG</span><strong>{viewMovimentacao.itemTag}</strong></div>
                                <div><span className="text-secondary text-sm block">Destino</span><strong>{viewMovimentacao.destino}</strong></div>
                                <div><span className="text-secondary text-sm block">Produto</span><strong>{viewMovimentacao.produtoNome} ({viewMovimentacao.produtoCodigo})</strong></div>
                            </div>
                            
                            <div className="p-3 bg-light rounded border mt-2">
                                <h4 className="text-sm text-secondary mb-2 uppercase">Disponibilização</h4>
                                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div><span className="text-secondary text-sm">Data:</span> {new Date(viewMovimentacao.dataSaida).toLocaleString()}</div>
                                    <div><span className="text-secondary text-sm">Responsável (Saída):</span> {viewMovimentacao.responsavelSaida}</div>
                                    <div><span className="text-secondary text-sm">Recebedor:</span> {viewMovimentacao.recebedorNome}</div>
                                    <div><span className="text-secondary text-sm">Lote:</span> {viewMovimentacao.lote || '-'}</div>
                                    <div><span className="text-secondary text-sm">Conformidade OP:</span> {viewMovimentacao.conformeOP ? 'Sim' : 'Não'}</div>
                                    {viewMovimentacao.itemCategoria === 'Mangueiras' && (
                                        <div><span className="text-secondary text-sm">Devidamente Identificadas:</span> {viewMovimentacao.devidamenteIdentificada ? 'Sim' : 'Não'}</div>
                                    )}
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
                                        <div><span className="text-secondary text-sm">Condição:</span> <strong className={viewMovimentacao.condicao === 'Com avarias' ? 'text-danger' : 'text-success'}>{viewMovimentacao.condicao}</strong></div>
                                    </div>
                                    {viewMovimentacao.observacoesDevolucao && <div className="mt-2"><span className="text-secondary text-sm block">Obs:</span> <span className="text-danger">{viewMovimentacao.observacoesDevolucao}</span></div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM OBSOLETE MODAL */}
            {itemToObsolete && (
                <div className="modal-overlay active" style={{ zIndex: 1005 }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className="flex flex-col items-center justify-center mb-4 text-danger">
                            <AlertTriangle size={48} style={{ opacity: 0.8 }} />
                        </div>
                        <h3 className="mb-4">Confirmar Obsoleto</h3>
                        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Deseja mover a TAG <strong style={{ color: 'var(--text-color)' }}>{itemToObsolete.tag}</strong> para obsoletos? <br/>Ela não poderá mais ser utilizada.
                        </p>
                        <div className="flex justify-center gap-4 mt-2">
                            <button className="btn btn-secondary" onClick={() => setItemToObsolete(null)}>Cancelar</button>
                            <button className="btn btn-danger" onClick={confirmMarkAsObsolete}>Sim, Mover</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
