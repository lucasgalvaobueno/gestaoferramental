import React, { useState, useMemo } from 'react';
import { useEmbalagem } from '../contexts/EmbalagemContext';
import { useColaboradoresEmbalagem } from '../contexts/ColaboradoresEmbalagemContext';
import { useMovimentacoesEmbalagem } from '../contexts/MovimentacoesEmbalagemContext';
import { useAuth } from '../contexts/UserContext';
import { ArrowRight, ArrowLeft, History, AlertTriangle, Eye, X, CheckSquare, CheckCircle2, AlertCircle, Filter, ChevronUp, Search } from 'lucide-react';

export default function MovimentacaoEmbalagemBPF550Aba() {
    const { items, updateItem } = useEmbalagem();
    const { colaboradores } = useColaboradoresEmbalagem();
    const { movimentacoes, addSaida, registrarDevolucao } = useMovimentacoesEmbalagem();
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.nivel === 'admin';

    const [currentTab, setCurrentTab] = useState('saida');
    const [subTabCadastros, setSubTabCadastros] = useState('Todas');
    const [successMessage, setSuccessMessage] = useState('');
    const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };
    const [errorMessage, setErrorMessage] = useState('');
    const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };

    const [itemParaObsoleto, setItemParaObsoleto] = useState(null);

    const [showFiltersCadastros, setShowFiltersCadastros] = useState(false);
    const [searchQueryCadastros, setSearchQueryCadastros] = useState('');
    const [sortAscCadastros, setSortAscCadastros] = useState(true);

    // --- DADOS BPF5-50 ---
    const myItems = useMemo(() => items.filter(i => i.equipamento === 'BPF5-50'), [items]);
    const myMovimentacoes = useMemo(() => movimentacoes.filter(m => m.equipamentoNome === 'BPF5-50'), [movimentacoes]);

    const itensCadastradosAtivos = myItems.filter(i => i.status !== 'Obsoleto');
    const emUso = myMovimentacoes.filter(m => m.status === 'Em Uso');
    const historico = myMovimentacoes.filter(m => m.status === 'Devolvido');

    // Categorias Separadas
    const getItemsByCat = (cat) => itensCadastradosAtivos.filter(i => i.subcategoria === cat && !i.statusDanificado);

    const getIdentificacao = (item) => {
        if (!item) return '';
        if (item.tag) return item.tag;
        if (item.numFerramenta) return item.numFerramenta;
        if (item.tamanhoBlister) return `Blíster: ${item.tamanhoBlister}`;
        if (item.qtdBlisters) return `Qtd Blíster: ${item.qtdBlisters}`;
        return 'S/ Identificação';
    };

    // --- ESTADOS SAÍDA ---
    const [formSup, setFormSup] = useState('');
    const [formInf, setFormInf] = useState('');
    const [guiaAlim, setGuiaAlim] = useState('');
    const [guiaCorte, setGuiaCorte] = useState('');
    const [selSup, setSelSup] = useState('');
    const [selInf, setSelInf] = useState('');
    const [tipoAlimentador, setTipoAlimentador] = useState(''); // 'dedicado' ou 'universal'
    const [alimDedicado, setAlimDedicado] = useState('');
    const [formDedicado, setFormDedicado] = useState('');
    const [alimUniversal, setAlimUniversal] = useState('');

    const [equipDestinoTag, setEquipDestinoTag] = useState('');
    const [lote, setLote] = useState('');
    const [produtoCodigo, setProdutoCodigo] = useState('');
    const [produtoNome, setProdutoNome] = useState('');
    const [recebedorCracha, setRecebedorCracha] = useState('');
    const [recebedorInfo, setRecebedorInfo] = useState(null);

    // Checkboxes Base
    const [chkProfundidade, setChkProfundidade] = useState(false);
    const [chkFerramenta, setChkFerramenta] = useState(false);
    const [chkApresentacao, setChkApresentacao] = useState(false);
    const [chkAvarias, setChkAvarias] = useState(false);

    // Checkboxes Dedicado
    const [chkBuchas, setChkBuchas] = useState(false);
    const [chkPinos, setChkPinos] = useState(false);
    const [chkPistoes, setChkPistoes] = useState(false);
    const [chkTeste, setChkTeste] = useState(false);
    const [chkVibradores, setChkVibradores] = useState(false);
    const [chkParafuso, setChkParafuso] = useState(false);
    const [chkTubos, setChkTubos] = useState(false);

    // Checkboxes Universal
    const [chkAcoplamentos, setChkAcoplamentos] = useState(false);
    const [chkBorrachas, setChkBorrachas] = useState(false);
    const [chkEixosEscovas, setChkEixosEscovas] = useState(false);
    const [chkEixosAcop, setChkEixosAcop] = useState(false);
    const [chkEscovasLivres, setChkEscovasLivres] = useState(false);
    const [chkCaixa, setChkCaixa] = useState(false);
    const [chkEscovasDiam, setChkEscovasDiam] = useState(false);

    // --- ESTADOS DEVOLUÇÃO ---
    const [devolucaoModal, setDevolucaoModal] = useState(null);
    const [devRecebedorCracha, setDevRecebedorCracha] = useState('');
    const [devRecebedorInfo, setDevRecebedorInfo] = useState(null);
    // Para cada item retornado, guardaremos { itemId: '', condicao: '', observacoes: '' }
    const [devItems, setDevItems] = useState({});

    // --- ESTADOS HISTÓRICO ---
    const [histNumSearch, setHistNumSearch] = useState('');
    const [histDataInicio, setHistDataInicio] = useState('');
    const [histDataFim, setHistDataFim] = useState('');
    const [showHistFilters, setShowHistFilters] = useState(false);
    const [viewMovimentacao, setViewMovimentacao] = useState(null);

    const historicoFiltrado = useMemo(() => {
        let filtered = historico;
        if (histNumSearch) {
            filtered = filtered.filter(m => 
                (m.equipDestino || '').toLowerCase().includes(histNumSearch.toLowerCase())
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
    }, [historico, histNumSearch, histDataInicio, histDataFim]);

    // --- FUNÇÕES DE INTERFACE SAÍDA ---
    const handleCrachaChange = (val, isDevolucao = false) => {
        if(isDevolucao) setDevRecebedorCracha(val);
        else setRecebedorCracha(val);

        if(val.length >= 3) {
            const found = colaboradores.find(c => c.cracha === val);
            if(isDevolucao) setDevRecebedorInfo(found || null);
            else setRecebedorInfo(found || null);
        } else {
            if(isDevolucao) setDevRecebedorInfo(null);
            else setRecebedorInfo(null);
        }
    };

    // Filtros em cascata Baseados na Formação Inferior
    const guiasAlimentacaoValidos = useMemo(() => {
        if (!formInf) return [];
        const fInfItem = myItems.find(i => i.id === formInf);
        if (!fInfItem || !fInfItem.selectedGuiasAlimentacao) return [];
        return getItemsByCat('Guias de alimentação').filter(g => fInfItem.selectedGuiasAlimentacao.includes(g.id));
    }, [formInf, myItems]);

    const guiasCorteValidos = useMemo(() => {
        if (!formInf) return [];
        const fInfItem = myItems.find(i => i.id === formInf);
        if (!fInfItem || !fInfItem.selectedGuiasCorte) return [];
        return getItemsByCat('Guias do corte').filter(g => fInfItem.selectedGuiasCorte.includes(g.id));
    }, [formInf, myItems]);

    // Itens selecionados para exibir detalhes
    const itemGuiaAlim = myItems.find(i => i.id === guiaAlim);
    const itemGuiaCorte = myItems.find(i => i.id === guiaCorte);
    const itemSelInf = myItems.find(i => i.id === selInf);
    const itemFormDedicado = myItems.find(i => i.id === formDedicado);
    const itemAlimUniversal = myItems.find(i => i.id === alimUniversal);

    const produtosDedicadosValidos = useMemo(() => {
        if (!formInf) return [];
        const fInfItem = myItems.find(i => i.id === formInf);
        return fInfItem?.produtosDedicados || [];
    }, [formInf, myItems]);

    const handleProdutoChange = (e) => {
        const val = e.target.value;
        setProdutoCodigo(val);
        const prod = produtosDedicadosValidos.find(p => p.codigo === val);
        if (prod) {
            setProdutoNome(prod.nome);
        } else {
            setProdutoNome('');
        }
    };

    const handleSaida = (e) => {
        e.preventDefault();
        if (!recebedorInfo) {
            showError("Crachá inválido ou não encontrado.");
            return;
        }

        // Validação de Checkboxes
        if (!chkProfundidade || !chkFerramenta || !chkApresentacao || !chkAvarias) {
            showError("Marque todos os itens base como conferidos.");
            return;
        }
        if (tipoAlimentador === 'dedicado') {
            if (!chkBuchas || !chkPinos || !chkPistoes || !chkTeste || !chkVibradores || !chkParafuso || !chkTubos) {
                showError("Marque todos os itens do Alimentador Dedicado como conferidos.");
                return;
            }
        } else if (tipoAlimentador === 'universal') {
            if (!chkAcoplamentos || !chkBorrachas || !chkEixosEscovas || !chkEixosAcop || !chkEscovasLivres || !chkCaixa || !chkEscovasDiam) {
                showError("Marque todos os itens do Alimentador Universal como conferidos.");
                return;
            }
        }

        const itemsIds = [formSup, formInf, guiaAlim, guiaCorte, selSup, selInf].filter(Boolean);
        if (tipoAlimentador === 'dedicado') {
            if(alimDedicado) itemsIds.push(alimDedicado);
            if(formDedicado) itemsIds.push(formDedicado);
        } else if (tipoAlimentador === 'universal') {
            if(alimUniversal) itemsIds.push(alimUniversal);
        }

        const itemsDetalhes = itemsIds.map(id => {
            const it = myItems.find(i => i.id === id);
            return {
                id,
                tag: it?.tag || '',
                subcategoria: it?.subcategoria || ''
            };
        });

        addSaida({
            equipamentoNome: 'BPF5-50',
            equipDestino: 'BPF5-50 ' + equipDestinoTag,
            lote,
            produtoCodigo,
            produtoNome,
            recebedorCracha,
            recebedorNome: recebedorInfo.nome,
            itemsIds,
            itemsDetalhes,
            tipoAlimentador,
            checkBase: { chkProfundidade, chkFerramenta, chkApresentacao, chkAvarias },
            checkDedicado: tipoAlimentador === 'dedicado' ? { chkBuchas, chkPinos, chkPistoes, chkTeste, chkVibradores, chkParafuso, chkTubos } : null,
            checkUniversal: tipoAlimentador === 'universal' ? { chkAcoplamentos, chkBorrachas, chkEixosEscovas, chkEixosAcop, chkEscovasLivres, chkCaixa, chkEscovasDiam } : null
        });

        showSuccess("Disponibilização realizada com sucesso!");
        
        // Limpar form
        setFormSup(''); setFormInf(''); setGuiaAlim(''); setGuiaCorte(''); setSelSup(''); setSelInf('');
        setTipoAlimentador(''); setAlimDedicado(''); setFormDedicado(''); setAlimUniversal('');
        setRecebedorCracha(''); setRecebedorInfo(null); setEquipDestinoTag(''); setLote('');
        setProdutoCodigo(''); setProdutoNome('');
        setChkProfundidade(false); setChkFerramenta(false); setChkApresentacao(false); setChkAvarias(false);
        setChkBuchas(false); setChkPinos(false); setChkPistoes(false); setChkTeste(false); setChkVibradores(false); setChkParafuso(false); setChkTubos(false);
        setChkAcoplamentos(false); setChkBorrachas(false); setChkEixosEscovas(false); setChkEixosAcop(false); setChkEscovasLivres(false); setChkCaixa(false); setChkEscovasDiam(false);
    };

    const openDevolucao = (mov) => {
        setDevolucaoModal(mov);
        setDevRecebedorCracha('');
        setDevRecebedorInfo(null);
        
        const initialDevItems = {};
        mov.itemsDetalhes.forEach(it => {
            initialDevItems[it.id] = { condicao: 'Sem avarias', observacoes: '' };
        });
        setDevItems(initialDevItems);
    };

    const handleDevItemChange = (id, field, value) => {
        setDevItems(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleDevolucao = (e) => {
        e.preventDefault();
        if (!devRecebedorInfo) {
            showError("Crachá inválido ou não encontrado.");
            return;
        }

        // Valida se os itens com avaria tem observação
        for (let id in devItems) {
            const di = devItems[id];
            if ((di.condicao === 'Com avarias' || di.condicao === 'Desgaste de uso') && !di.observacoes.trim()) {
                showError("Preencha os comentários para todos os itens marcados com avaria ou desgaste.");
                return;
            }
        }

        const itemsEnvolvidos = devolucaoModal.itemsDetalhes.map(it => {
            const condicao = devItems[it.id]?.condicao || 'Sem avarias';
            const observacoes = devItems[it.id]?.observacoes || '';

            // Atualiza status do item globalmente
            if (condicao === 'Com avarias' || condicao === 'Desgaste de uso') {
                updateItem(it.id, { statusDanificado: true, historicoDanos: observacoes });
            } else {
                updateItem(it.id, { statusDanificado: false, historicoDanos: '' });
            }

            return {
                itemId: it.id,
                condicao,
                observacoes
            };
        });

        registrarDevolucao(devolucaoModal.id, {
            devRecebedorCracha,
            devRecebedorNome: devRecebedorInfo.nome,
            itemsEnvolvidos
        });

        setDevolucaoModal(null);
        showSuccess("Devolução registrada com sucesso!");
    };


    return (
        <div className="h-full flex flex-col">
            {successMessage && <div className="mb-4 p-3 bg-success/10 border border-success text-success rounded flex items-center gap-2"><CheckSquare size={18} /> {successMessage}</div>}
            {errorMessage && <div className="mb-4 p-3 bg-danger/10 border border-danger text-danger rounded flex items-center gap-2"><AlertCircle size={18} /> {errorMessage}</div>}

            <div className="tabs mb-4 flex gap-2 flex-wrap">
                <button className={`btn btn-sm ${currentTab === 'saida' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCurrentTab('saida')}>Saída</button>
                <button className={`btn btn-sm ${currentTab === 'em-uso' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCurrentTab('em-uso')}>Em Uso ({emUso.length})</button>
                <button className={`btn btn-sm ${currentTab === 'cadastros' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCurrentTab('cadastros')}>Itens Cadastrados</button>
                <button className={`btn btn-sm ${currentTab === 'historico' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCurrentTab('historico')}>Histórico</button>
                <button className={`btn btn-sm ${currentTab === 'obsoletos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCurrentTab('obsoletos')}>Obsoletos/Descarte</button>
            </div>

            {/* ABA SAÍDA */}
            {currentTab === 'saida' && (
                <div className="card max-w-4xl p-6 mx-auto animate-fade-in">
                    <h3 className="mb-4 text-primary border-b pb-2">Saída de Formatos BPF5-50</h3>
                    <form onSubmit={handleSaida}>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="form-group mb-0">
                                <label>TAG Formação superior</label>
                                <select className="form-control" value={formSup} onChange={e => setFormSup(e.target.value)} required>
                                    <option value="" style={{ color: '#000' }}>Selecione...</option>
                                    {getItemsByCat('Formação superior').map(i => <option key={i.id} value={i.id} style={{ color: '#000' }}>{getIdentificacao(i)}</option>)}
                                </select>
                            </div>
                            <div className="form-group mb-0">
                                <label>TAG Formação inferior</label>
                                <select className="form-control" value={formInf} onChange={e => { setFormInf(e.target.value); setGuiaAlim(''); setGuiaCorte(''); setProdutoCodigo(''); setProdutoNome(''); }} required>
                                    <option value="" style={{ color: '#000' }}>Selecione...</option>
                                    {getItemsByCat('Formação inferior').map(i => <option key={i.id} value={i.id} style={{ color: '#000' }}>{getIdentificacao(i)}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="form-group mb-0">
                                <label>TAG Guia de alimentação <small className="text-secondary">(Vinculado à Form. Inferior)</small></label>
                                <select className="form-control" value={guiaAlim} onChange={e => setGuiaAlim(e.target.value)} required disabled={!formInf}>
                                    <option value="" style={{ color: '#000' }}>Selecione...</option>
                                    {guiasAlimentacaoValidos.map(i => <option key={i.id} value={i.id} style={{ color: '#000' }}>{getIdentificacao(i)}</option>)}
                                </select>
                                {itemGuiaAlim && (
                                    <div className="mt-2 text-xs text-secondary bg-light p-2 rounded">
                                        <strong>Info do Guia:</strong> {itemGuiaAlim.observacao || 'Sem observações'}
                                    </div>
                                )}
                            </div>
                            <div className="form-group mb-0">
                                <label>TAG Guia do corte <small className="text-secondary">(Vinculado à Form. Inferior)</small></label>
                                <select className="form-control" value={guiaCorte} onChange={e => setGuiaCorte(e.target.value)} required disabled={!formInf}>
                                    <option value="" style={{ color: '#000' }}>Selecione...</option>
                                    {guiasCorteValidos.map(i => <option key={i.id} value={i.id} style={{ color: '#000' }}>{getIdentificacao(i)}</option>)}
                                </select>
                                {itemGuiaCorte && (
                                    <div className="mt-2 text-xs text-secondary bg-light p-2 rounded">
                                        <strong>Info do Guia:</strong> {itemGuiaCorte.observacao || 'Sem observações'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="form-group mb-0">
                                <label>TAG Selagem superior</label>
                                <select className="form-control" value={selSup} onChange={e => setSelSup(e.target.value)} required>
                                    <option value="" style={{ color: '#000' }}>Selecione...</option>
                                    {getItemsByCat('Selagem superior').map(i => <option key={i.id} value={i.id} style={{ color: '#000' }}>{getIdentificacao(i)}</option>)}
                                </select>
                            </div>
                            <div className="form-group mb-0">
                                <label>TAG Selagem inferior</label>
                                <select className="form-control" value={selInf} onChange={e => setSelInf(e.target.value)} required>
                                    <option value="" style={{ color: '#000' }}>Selecione...</option>
                                    {getItemsByCat('Selagem inferior').map(i => <option key={i.id} value={i.id} style={{ color: '#000' }}>{getIdentificacao(i)}</option>)}
                                </select>
                                {itemSelInf && (
                                    <div className="mt-2 text-xs text-secondary bg-light p-2 rounded">
                                        <strong>Tamanho Blister:</strong> {itemSelInf.tamanhoBlister || '-'} | <strong>Faca:</strong> {itemSelInf.faca || '-'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-6 p-4 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                            <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><CheckCircle2 size={16}/> Conferido:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={chkProfundidade} onChange={e=>setChkProfundidade(e.target.checked)}/> Profundidade da bolha compatível</label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={chkFerramenta} onChange={e=>setChkFerramenta(e.target.checked)}/> Ferramenta compatível com OP (PVC/PVDC)</label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={chkApresentacao} onChange={e=>setChkApresentacao(e.target.checked)}/> Apresentação compatível com OP</label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={chkAvarias} onChange={e=>setChkAvarias(e.target.checked)}/> Conjunto livre de avarias</label>
                            </div>
                        </div>

                        <div className="mb-6 border rounded p-4" style={{ marginTop: '2.5rem' }}>
                            <h4 className="text-sm font-bold mb-3">Tipo de Alimentador</h4>
                            <div className="flex gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="tipoAlim" value="dedicado" checked={tipoAlimentador === 'dedicado'} onChange={() => setTipoAlimentador('dedicado')} required/> Alimentador Dedicado
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="tipoAlim" value="universal" checked={tipoAlimentador === 'universal'} onChange={() => setTipoAlimentador('universal')} required/> Alimentador Universal
                                </label>
                            </div>

                            {tipoAlimentador === 'dedicado' && (
                                <div className="animate-fade-in bg-light p-4 rounded">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="form-group mb-0">
                                            <label>TAG Alimentador dedicado</label>
                                            <select className="form-control" value={alimDedicado} onChange={e => setAlimDedicado(e.target.value)} required>
                                                <option value="" style={{ color: '#000' }}>Selecione...</option>
                                                {getItemsByCat('Alimentador dedicado').map(i => <option key={i.id} value={i.id} style={{ color: '#000' }}>{getIdentificacao(i)}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group mb-0">
                                            <label>TAG Formato dedicado</label>
                                            <select className="form-control" value={formDedicado} onChange={e => setFormDedicado(e.target.value)} required>
                                                <option value="" style={{ color: '#000' }}>Selecione...</option>
                                                {getItemsByCat('Formato dedicado').map(i => <option key={i.id} value={i.id} style={{ color: '#000' }}>{getIdentificacao(i)}</option>)}
                                            </select>
                                            {itemFormDedicado && (
                                                <div className="mt-2 text-xs text-secondary bg-white border p-2 rounded">
                                                    <strong>Espessura do Tubo:</strong> Mín {itemFormDedicado.espessuraMin || '-'} | Máx {itemFormDedicado.espessuraMax || '-'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><CheckCircle2 size={16}/> Conferido:</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkBuchas} onChange={e=>setChkBuchas(e.target.checked)}/> Buchas do formato</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkPinos} onChange={e=>setChkPinos(e.target.checked)}/> Pinos de bloqueio</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkPistoes} onChange={e=>setChkPistoes(e.target.checked)}/> Pistões Posicionador</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkTeste} onChange={e=>setChkTeste(e.target.checked)}/> Teste de bancada</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkVibradores} onChange={e=>setChkVibradores(e.target.checked)}/> Vibradores</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkParafuso} onChange={e=>setChkParafuso(e.target.checked)}/> Parafuso calha vibração</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkTubos} onChange={e=>setChkTubos(e.target.checked)}/> Tubos livres de avarias</label>
                                    </div>
                                </div>
                            )}

                            {tipoAlimentador === 'universal' && (
                                <div className="animate-fade-in bg-light p-4 rounded">
                                    <div className="form-group mb-4">
                                        <label>TAG Alimentador universal</label>
                                        <select className="form-control" value={alimUniversal} onChange={e => setAlimUniversal(e.target.value)} required>
                                            <option value="" style={{ color: '#000' }}>Selecione...</option>
                                            {getItemsByCat('Alimentador universal').map(i => <option key={i.id} value={i.id} style={{ color: '#000' }}>{getIdentificacao(i)}</option>)}
                                        </select>
                                        {itemAlimUniversal && (
                                            <div className="mt-2 text-xs text-secondary bg-white border p-2 rounded">
                                                <strong>Cunha compatível:</strong> {itemAlimUniversal.cunhaCompativel || '-'}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><CheckCircle2 size={16}/> Conferido:</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkAcoplamentos} onChange={e=>setChkAcoplamentos(e.target.checked)}/> Acoplamentos</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkBorrachas} onChange={e=>setChkBorrachas(e.target.checked)}/> Borrachas e suportes</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkEixosEscovas} onChange={e=>setChkEixosEscovas(e.target.checked)}/> Eixos das escovas</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkEixosAcop} onChange={e=>setChkEixosAcop(e.target.checked)}/> Eixos do acoplamento</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkEscovasLivres} onChange={e=>setChkEscovasLivres(e.target.checked)}/> Escovas livres avarias</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkCaixa} onChange={e=>setChkCaixa(e.target.checked)}/> Caixa de alimentação</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chkEscovasDiam} onChange={e=>setChkEscovasDiam(e.target.checked)}/> Escovas c/ diâm. correto</label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="form-group mb-0">
                                <label>Código do Produto</label>
                                <input list="produtos-list" className="form-control" placeholder="Selecione ou digite..." value={produtoCodigo} onChange={handleProdutoChange} required disabled={!formInf} />
                                <datalist id="produtos-list">
                                    {produtosDedicadosValidos.map(p => <option key={p.codigo} value={p.codigo}>{p.nome}</option>)}
                                </datalist>
                                {!formInf && <small className="text-secondary mt-1 block">Selecione a Formação Inferior primeiro.</small>}
                            </div>
                            <div className="form-group mb-0">
                                <label>Nome do Produto</label>
                                <input type="text" className="form-control" style={{ backgroundColor: '#f8f9fa' }} value={produtoNome} readOnly placeholder="Automático ao selecionar código" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="form-group mb-0">
                                <label>Equipamento Destino (TAG)</label>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold whitespace-nowrap" style={{ color: 'var(--text-color)' }}>BPF5-50</span>
                                    <input type="text" className="form-control flex-1" value={equipDestinoTag} onChange={e => setEquipDestinoTag(e.target.value)} required placeholder="Ex: TAG-123" />
                                </div>
                            </div>
                            <div className="form-group mb-0">
                                <label>Lote</label>
                                <input type="text" className="form-control" value={lote} onChange={e => setLote(e.target.value)} required placeholder="Ex: 123456" />
                            </div>
                            <div className="form-group mb-0">
                                <label>Responsável pelo Recebimento (Crachá)</label>
                                <input type="password" required className="form-control" value={recebedorCracha} onChange={e => handleCrachaChange(e.target.value)} />
                                {recebedorCracha && !recebedorInfo && <small className="text-danger mt-1 block">Crachá não cadastrado.</small>}
                                {recebedorInfo && (
                                    <div className="mt-2 p-2 bg-success/10 border border-success rounded text-sm text-success">
                                        <strong>Encontrado:</strong> {recebedorInfo.nome} | {recebedorInfo.matricula}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-6 p-4 border rounded text-sm flex items-center justify-between" style={{ backgroundColor: '#f8f9fa' }}>
                            <div>
                                <span className="text-secondary">Responsável pela Disponibilização: </span>
                                <strong>{currentUser?.nome || 'Usuário Logado'}</strong>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full py-3 text-lg flex justify-center">Registrar Saída</button>
                    </form>
                </div>
            )}

            {/* ABA EM USO */}
            {currentTab === 'em-uso' && (
                <div className="card p-0 animate-fade-in">
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="table m-0 text-sm">
                        <thead>
                            <tr className="text-xs">
                                <th>Eqp</th>
                                <th>Produto</th>
                                <th>Lote</th>
                                <th>Saída</th>
                                <th>Recebedor</th>
                                <th>Data/Hora Saída</th>
                                <th className="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emUso.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-4 text-secondary">Nenhum conjunto em uso.</td></tr>
                            ) : emUso.map(m => (
                                <tr key={m.id}>
                                    <td className="align-middle"><strong>{m.equipDestino}</strong></td>
                                    <td className="align-middle leading-tight">{m.produtoCodigo ? <><div className="font-bold text-xs">{m.produtoCodigo}</div><div className="text-[10px] text-secondary">{m.produtoNome}</div></> : '-'}</td>
                                    <td className="align-middle text-xs">{m.lote || '-'}</td>
                                    <td className="align-middle text-xs">{m.responsavelSaida}</td>
                                    <td className="align-middle text-xs">{m.recebedorNome}</td>
                                    <td className="align-middle text-xs">{new Date(m.dataSaida).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                    <td className="text-center align-middle">
                                        <div className="flex justify-center gap-1">
                                            <button className="btn btn-sm text-secondary bg-light border border-border flex items-center justify-center p-1" onClick={() => setViewMovimentacao(m)} title="Detalhes dos Itens"><Eye size={16}/></button>
                                            <button className="btn btn-sm text-xs py-1 px-2" style={{ background: 'var(--success-color)', color: 'white' }} onClick={() => openDevolucao(m)}>Devolver</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* ABA CADASTROS */}
            {currentTab === 'cadastros' && (
                <div className="animate-fade-in card p-6">
                    <div className="flex justify-end items-start mb-4">
                        <button className="btn btn-secondary flex items-center gap-2" onClick={() => setShowFiltersCadastros(!showFiltersCadastros)}>
                            <Filter size={18} /> Filtros e Busca
                        </button>
                    </div>

                    {showFiltersCadastros && (
                        <div className="card p-4 animate-fade-in flex flex-wrap gap-4 items-end mb-4" style={{ backgroundColor: 'var(--background-color)' }}>
                            <div className="form-group mb-0" style={{ flex: 1, minWidth: '200px' }}>
                                <label>Categoria Específica</label>
                                <select className="form-control" value={subTabCadastros} onChange={e => setSubTabCadastros(e.target.value)}>
                                    {['Todas', 'Formação superior', 'Formação inferior', 'Guias de alimentação', 'Guias do corte', 'Selagem superior', 'Selagem inferior', 'Alimentador dedicado', 'Formato dedicado', 'Alimentador universal'].map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group mb-0" style={{ flex: 2, minWidth: '200px' }}>
                                <label>Buscar (Tag/Medida/Ferramenta)</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} className="text-secondary" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="text" className="form-control" style={{ paddingLeft: '35px' }} placeholder="Digite para buscar..." value={searchQueryCadastros} onChange={e => setSearchQueryCadastros(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group mb-0" style={{ minWidth: '150px' }}>
                                <label>Ordenação (A-Z)</label>
                                <button className="btn btn-secondary w-full" onClick={() => setSortAscCadastros(!sortAscCadastros)}>
                                    {sortAscCadastros ? '▲ Crescente (A-Z)' : '▼ Decrescente (Z-A)'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="table-container mt-4">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>EQUIPAMENTO</th>
                                    <th>TIPO DE CADASTRO</th>
                                    <th>IDENTIFICAÇÃO</th>
                                    <th>STATUS</th>
                                    {isAdmin && <th className="text-center">AÇÕES</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    let res = myItems;
                                    if (subTabCadastros !== 'Todas') {
                                        res = res.filter(i => i.subcategoria === subTabCadastros);
                                    }
                                    if (searchQueryCadastros.trim()) {
                                        const q = searchQueryCadastros.toLowerCase();
                                        res = res.filter(i => 
                                            (i.tag && i.tag.toLowerCase().includes(q)) || 
                                            (i.tamanhoBlister && i.tamanhoBlister.toLowerCase().includes(q)) || 
                                            (i.numFerramenta && i.numFerramenta.toLowerCase().includes(q)) ||
                                            (i.cunha && i.cunha.toLowerCase().includes(q)) ||
                                            (i.faca && i.faca.toLowerCase().includes(q))
                                        );
                                    }
                                    res = res.sort((a, b) => {
                                        const valA = getIdentificacao(a).toLowerCase();
                                        const valB = getIdentificacao(b).toLowerCase();
                                        if (valA < valB) return sortAscCadastros ? -1 : 1;
                                        if (valA > valB) return sortAscCadastros ? 1 : -1;
                                        return 0;
                                    });
                                    
                                    if (res.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={isAdmin ? 5 : 4} className="text-center py-4 text-secondary">Nenhum item encontrado.</td>
                                            </tr>
                                        );
                                    }
                                    
                                    return res.map(i => (
                                        <tr key={i.id}>
                                            <td><strong>{i.equipamento}</strong></td>
                                            <td>{i.subcategoria}</td>
                                            <td>{getIdentificacao(i)}</td>
                                            <td>{i.statusDanificado ? <span className="badge bg-danger/10 text-danger border border-danger/20 text-xs">Danificado</span> : <span className="badge bg-success/10 text-success border border-success/20 text-xs text-black">Operacional</span>}</td>
                                            {isAdmin && (
                                                <td className="text-center">
                                                    {i.statusDanificado ? (
                                                        <button className="btn btn-sm text-xs text-danger border border-danger" onClick={() => setItemParaObsoleto(i.id)}>Mover p/ Obsoletos</button>
                                                    ) : (
                                                        <span className="text-secondary text-xs">-</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ));
                                })()}
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
                                    <label className="text-xs text-secondary">Equipamento Destino / TAG</label>
                                    <input type="text" className="form-control" placeholder="Buscar..." value={histNumSearch} onChange={e => setHistNumSearch(e.target.value)} />
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
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="table m-0 text-sm">
                            <thead>
                            <tr className="text-xs">
                                <th>Equipamento</th>
                                <th>Saída</th>
                                <th>Devolução</th>
                                <th>Condição Geral</th>
                                <th className="text-center">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historicoFiltrado.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-4 text-secondary">Nenhum histórico encontrado com esses filtros.</td></tr>
                            ) : historicoFiltrado.map(mov => {
                                const temAvaria = mov.itemsEnvolvidos?.some(e => e.condicao !== 'Sem avarias');
                                return (
                                <tr key={mov.id}>
                                    <td className="align-middle"><strong>{mov.equipDestino}</strong></td>
                                    <td className="align-middle text-xs">{new Date(mov.dataSaida).toLocaleDateString()}</td>
                                    <td className="align-middle text-xs">{mov.dataDevolucao ? new Date(mov.dataDevolucao).toLocaleDateString() : '-'}</td>
                                    <td className="align-middle">
                                        <span className={temAvaria ? 'text-danger flex items-center gap-1 text-xs' : 'text-success text-xs'}>
                                            {temAvaria ? <><AlertTriangle size={14}/> Avarias Registradas</> : 'Conjunto OK'}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button className="btn btn-icon text-secondary" onClick={() => setViewMovimentacao(mov)} title="Expandir"><Eye size={18}/></button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* ABA OBSOLETOS */}
            {currentTab === 'obsoletos' && (
                <div className="card p-0 mt-4 animate-fade-in">
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="table m-0 text-sm">
                        <thead>
                            <tr className="text-xs">
                                <th>TAG</th>
                                <th>Categoria</th>
                                <th>Motivo / Histórico Danos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myItems.filter(i => i.status === 'Obsoleto').length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-4 text-secondary">Nenhum item obsoleto.</td></tr>
                            ) : myItems.filter(i => i.status === 'Obsoleto').map(i => (
                                <tr key={i.id} style={{ opacity: 0.7 }}>
                                    <td className="align-middle"><strong>{i.tag}</strong></td>
                                    <td className="align-middle text-xs">{i.subcategoria}</td>
                                    <td className="align-middle text-xs"><small>{i.historicoDanos || 'Movido para descarte'}</small></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* MODAL DE DEVOLUÇÃO */}
            {devolucaoModal && (
                <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                    <div className="modal-content" style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="m-0">Devolução - {devolucaoModal.equipDestino}</h3>
                            <button className="btn btn-icon" onClick={() => setDevolucaoModal(null)}><X /></button>
                        </div>
                        
                        <form onSubmit={handleDevolucao}>
                            <div className="form-group mb-6">
                                <label>Crachá do Responsável pela Devolução</label>
                                <input type="password" required className="form-control" value={devRecebedorCracha} onChange={e => handleCrachaChange(e.target.value, true)} />
                                {devRecebedorCracha && !devRecebedorInfo && <small className="text-danger mt-1 block">Crachá não encontrado.</small>}
                                {devRecebedorInfo && (
                                    <div className="mt-2 p-2 bg-light border rounded text-sm">
                                        <div className="text-success font-bold mb-1">Colaborador Localizado: {devRecebedorInfo.nome}</div>
                                        <div className="text-secondary"><strong>Recebido por:</strong> {currentUser?.nome || 'Logado'}</div>
                                    </div>
                                )}
                            </div>

                            <h4 className="font-bold mb-4">Condição das Peças do Conjunto</h4>
                            
                            <div className="mb-6">
                                {devolucaoModal.itemsDetalhes.map(it => {
                                    const temAvaria = devItems[it.id]?.condicao === 'Com avarias' || devItems[it.id]?.condicao === 'Desgaste de uso';
                                    return (
                                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ minWidth: '250px', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                            {it.subcategoria}: <span className="text-primary">{it.tag}</span>
                                        </div>
                                        <div style={{ width: '160px', flexShrink: 0 }}>
                                            <select className="form-control text-sm m-0" value={devItems[it.id]?.condicao || ''} onChange={e => handleDevItemChange(it.id, 'condicao', e.target.value)} required>
                                                <option value="Sem avarias">Sem avarias</option>
                                                <option value="Com avarias">Com avarias</option>
                                                <option value="Desgaste de uso">Desgaste de uso</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            {temAvaria && (
                                                <input type="text" className="form-control text-sm m-0" placeholder="Descreva os detalhes da avaria..." value={devItems[it.id]?.observacoes || ''} onChange={e => handleDevItemChange(it.id, 'observacoes', e.target.value)} required />
                                            )}
                                        </div>
                                    </div>
                                )})}
                            </div>

                            <button type="submit" className="btn btn-primary w-full py-3">Finalizar Devolução</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL VIEW HISTORICO */}
            {viewMovimentacao && (
                <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                    <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="m-0 flex items-center gap-2"><History size={20}/> Detalhes do Histórico</h3>
                            <button className="btn btn-icon" onClick={() => setViewMovimentacao(null)}><X /></button>
                        </div>
                        
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4 bg-light p-3 rounded">
                                <div><span className="text-secondary block text-xs">Equipamento Destino</span><strong>{viewMovimentacao.equipDestino}</strong></div>
                                <div><span className="text-secondary block text-xs">Lote</span><strong>{viewMovimentacao.lote || '-'}</strong></div>
                                <div className="col-span-2"><span className="text-secondary block text-xs">Produto</span><strong>{viewMovimentacao.produtoCodigo ? `${viewMovimentacao.produtoCodigo} - ${viewMovimentacao.produtoNome}` : '-'}</strong></div>
                                <div><span className="text-secondary block text-xs">Alimentador</span><strong>{viewMovimentacao.tipoAlimentador?.toUpperCase()}</strong></div>
                                <div><span className="text-secondary block text-xs">Data Saída</span>{new Date(viewMovimentacao.dataSaida).toLocaleString()}</div>
                                <div><span className="text-secondary block text-xs">Data Devolução</span>{viewMovimentacao.dataDevolucao ? new Date(viewMovimentacao.dataDevolucao).toLocaleString() : '-'}</div>
                                <div><span className="text-secondary block text-xs">Resp. Saída</span>{viewMovimentacao.responsavelSaida}</div>
                                <div><span className="text-secondary block text-xs">Resp. Devolução</span>{viewMovimentacao.responsavelRecebimento || '-'}</div>
                                <div><span className="text-secondary block text-xs">Recebedor Saída (Crachá)</span>{viewMovimentacao.recebedorNome}</div>
                                <div><span className="text-secondary block text-xs">Devolvedor (Crachá)</span>{viewMovimentacao.devRecebedorNome || '-'}</div>
                            </div>
                            
                            <h4 className="font-bold border-b pb-1">Peças e Condições</h4>
                            <ul className="list-disc pl-5 space-y-2">
                                {viewMovimentacao.itemsDetalhes.map(it => {
                                    const envolvido = viewMovimentacao.itemsEnvolvidos?.find(e => e.itemId === it.id);
                                    const condicao = envolvido ? envolvido.condicao : 'Sem avarias';
                                    const obs = envolvido?.observacoes;
                                    return (
                                        <li key={it.id}>
                                            <strong>{it.subcategoria}</strong>: {it.tag} <br/>
                                            <span className={condicao === 'Sem avarias' ? 'text-success' : 'text-danger'}>Condição: {condicao}</span>
                                            {obs && <div className="text-xs text-secondary italic">Obs: {obs}</div>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Confirmação de Obsoleto */}
            {itemParaObsoleto && (
                <div className="modal-overlay active animate-fade-in flex items-center justify-center" style={{ zIndex: 1000 }}>
                    <div className="modal-content animate-slide-up" style={{ padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
                        <h3 className="mb-4 flex items-center gap-2" style={{ color: 'var(--danger-color)' }}><AlertTriangle size={24} /> Confirmar Ação</h3>
                        <p className="mb-6 text-dark">Tem certeza que deseja mover este item para os Obsoletos? Esta ação mudará o status do item de forma permanente.</p>
                        <div className="flex justify-end gap-2">
                            <button className="btn btn-secondary" onClick={() => setItemParaObsoleto(null)}>Cancelar</button>
                            <button className="btn btn-primary" style={{ background: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} onClick={() => {
                                updateItem(itemParaObsoleto, { status: 'Obsoleto', statusDanificado: false });
                                setItemParaObsoleto(null);
                            }}>
                                Confirmar e Mover
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
