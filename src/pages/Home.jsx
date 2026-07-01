import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useUsers } from '../contexts/UserContext';
import { Briefcase, FlaskConical, BoxSelect, Package, Layers, Lock, AlertTriangle, PackageX, Bell, ChevronRight, ChevronDown, ChevronUp, UserCog, CheckSquare, X, Ruler, Users } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const PANELS = [
    { key: 'gestao-ferramental', label: 'Gestão Ferramental', icon: Briefcase, to: '/gestao-ferramental' },
    { key: 'gestao-espessuras',  label: 'Gestão de Espessuras', icon: Ruler,     to: '/gestao-espessuras' },
    { key: 'manipulacao',        label: 'Manipulação',        icon: FlaskConical, to: '/manipulacao' },
    { key: 'compressao',         label: 'Compressão',         icon: BoxSelect,   to: '/compressao' },
    { key: 'embalagem',          label: 'Embalagem',          icon: Package,     to: '/embalagem' },
    { key: 'nao-solidos',        label: 'Não Sólidos',        icon: Layers,      to: null },
];

export default function Home() {
    const { hasPanelAccess, currentUser } = useUsers();
    const isAdmin = currentUser?.nivel === 'admin';
    const { ativosPendentes, rcsAtrasadas, vagasAbertas, tarefasAtrasadasOuProximas, novasTarefasAtribuidas, itensDanificadosManipulacao, itensDanificadosCompressao, itensDanificadosEmbalagem, conjuntosCompressaoNoLimite, totalNotificacoes, marcarTarefaComoLida } = useNotifications();
    const [isAttentionPanelOpen, setIsAttentionPanelOpen] = useState(true);
    const renderPanels = () => (
        <div className="dashboard-grid">
            <Link to="/troca-de-turno" className="dashboard-card">
                <Users size={48} style={{ color: 'var(--primary-color)' }} />
                <h3>Troca de Turno</h3>
            </Link>
            {PANELS.map(({ key, label, icon: Icon, to }) => {
                const allowed = hasPanelAccess(key);

                if (allowed && to) {
                    return (
                        <Link key={key} to={to} className="dashboard-card">
                            <Icon size={48} style={{ color: 'var(--primary-color)' }} />
                            <h3>{label}</h3>
                        </Link>
                    );
                }

                if (allowed && !to) {
                    return (
                        <div key={key} className="dashboard-card" onClick={() => alert('Em construção')}>
                            <Icon size={48} style={{ color: 'var(--primary-color)' }} />
                            <h3>{label}</h3>
                        </div>
                    );
                }

                return (
                    <div key={key} className="dashboard-card dashboard-card--locked" title={`Sem acesso ao painel: ${label}`}>
                        <div style={{ position: 'relative', display: 'inline-flex' }}>
                            <Icon size={48} />
                            <Lock size={18} style={{ position: 'absolute', bottom: -4, right: -8 }} />
                        </div>
                        <h3>{label}</h3>
                        <span style={{ fontSize: '0.72rem', marginTop: '-0.5rem' }}>Sem permissão</span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso' }]} />
            <div className="container animate-fade-in">
                <div className="mb-4 text-center">
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-hover)', marginBottom: '0.5rem' }}>
                        Olá, {currentUser?.nome || currentUser?.name || 'Usuário'}! Bem vindo ao sistema de Gestão do Ferramental.
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>O que deseja fazer?</p>
                </div>
                
                {isAdmin ? (
                    <div className="home-admin-grid mt-4">
                        <div className="admin-attention-panel">
                            <h3 
                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', justifyContent: 'space-between', margin: 0, paddingBottom: isAttentionPanelOpen ? '1rem' : '0' }}
                                onClick={() => setIsAttentionPanelOpen(!isAttentionPanelOpen)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Bell size={20} /> Painel de Atenção
                                </div>
                                {isAttentionPanelOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </h3>
                            
                            {isAttentionPanelOpen && (
                                totalNotificacoes === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
                                        Nenhuma pendência no momento. Tudo certo!
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {ativosPendentes.length > 0 && (
                                            <div className="notification-item" style={{ padding: '0.5rem 0' }}>
                                                <div className="notification-icon" style={{ background: '#FEF2F2', color: 'var(--danger-color)' }}><PackageX size={16} /></div>
                                                <div className="notification-content">
                                                    <strong>{ativosPendentes.length} {ativosPendentes.length === 1 ? 'Ativo' : 'Ativos'} aguardando descarte</strong>
                                                    <Link to="/gestao-ativos">Revisar descartes</Link>
                                                </div>
                                            </div>
                                        )}
                                        {rcsAtrasadas.length > 0 && (
                                            <div className="notification-item" style={{ padding: '0.5rem 0' }}>
                                                <div className="notification-icon" style={{ background: '#FFFBEB', color: '#D97706' }}><AlertTriangle size={16} /></div>
                                                <div className="notification-content">
                                                    <strong>{rcsAtrasadas.length} {rcsAtrasadas.length === 1 ? 'RC pendente/atrasada' : 'RCs pendentes/atrasadas'}</strong>
                                                    <Link to="/follow-up">Ver Requisições</Link>
                                                </div>
                                            </div>
                                        )}
                                        {vagasAbertas.length > 0 && (
                                            <div className="notification-item" style={{ padding: '0.5rem 0', borderBottom: 'none' }}>
                                                <div className="notification-icon" style={{ background: '#F0FDF4', color: 'var(--success-color)' }}><Briefcase size={16} /></div>
                                                <div className="notification-content">
                                                    <strong>{vagasAbertas.length} {vagasAbertas.length === 1 ? 'Vaga em aberto' : 'Vagas em aberto'}</strong>
                                                    <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {vagasAbertas.slice(0, 5).map(v => (
                                                            <li key={v.id}>{v.cargo} ({v.diasEmAberto} dias)</li>
                                                        ))}
                                                        {vagasAbertas.length > 5 && <li>E mais {vagasAbertas.length - 5}...</li>}
                                                    </ul>
                                                    <Link to="/organograma">Ver Organograma</Link>
                                                </div>
                                            </div>
                                        )}
                                        {tarefasAtrasadasOuProximas?.length > 0 && (
                                            <div className="notification-item" style={{ padding: '0.5rem 0' }}>
                                                <div className="notification-icon" style={{ background: '#FEF2F2', color: 'var(--danger-color)' }}><CheckSquare size={16} /></div>
                                                <div className="notification-content">
                                                    <strong>{tarefasAtrasadasOuProximas.length} {tarefasAtrasadasOuProximas.length === 1 ? 'Tarefa atrasada/próxima' : 'Tarefas atrasadas/próximas'}</strong>
                                                    <Link to="/gestao-tarefas">Ver Minhas Tarefas</Link>
                                                </div>
                                            </div>
                                        )}
                                        {novasTarefasAtribuidas?.length > 0 && (
                                            <div className="notification-item" style={{ padding: '0.5rem 0' }}>
                                                <div className="notification-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}><CheckSquare size={16} /></div>
                                                <div className="notification-content">
                                                    <strong>{novasTarefasAtribuidas.length} {novasTarefasAtribuidas.length === 1 ? 'Nova tarefa atribuída' : 'Novas tarefas atribuídas'}</strong>
                                                    <ul style={{ margin: '0.25rem 0 0', paddingLeft: '0', fontSize: '0.8rem', color: 'var(--text-secondary)', listStyle: 'none' }}>
                                                        {novasTarefasAtribuidas.slice(0, 3).map(t => (
                                                            <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                                <span>{t.titulo}</span>
                                                                <button className="btn btn-icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); marcarTarefaComoLida(t.id); }} title="Limpar" style={{ padding: '0.1rem', height: 'auto', width: 'auto' }}>
                                                                    <X size={12} />
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <Link to="/gestao-tarefas">Ver Minhas Tarefas</Link>
                                                </div>
                                            </div>
                                        )}
                                        {itensDanificadosManipulacao?.length > 0 && (
                                            <div className="notification-item" style={{ padding: '0.5rem 0' }}>
                                                <div className="notification-icon" style={{ background: '#FEF2F2', color: 'var(--danger-color)' }}><AlertTriangle size={16} /></div>
                                                <div className="notification-content">
                                                    <strong>{itensDanificadosManipulacao.length} {itensDanificadosManipulacao.length === 1 ? 'Item danificado na Manipulação' : 'Itens danificados na Manipulação'}</strong>
                                                    <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {itensDanificadosManipulacao.slice(0, 5).map(i => (
                                                            <li key={i.id}>{i.tag || i.tipo}</li>
                                                        ))}
                                                        {itensDanificadosManipulacao.length > 5 && <li>E mais {itensDanificadosManipulacao.length - 5}...</li>}
                                                    </ul>
                                                    <Link to="/manipulacao">Verificar em Manipulação</Link>
                                                </div>
                                            </div>
                                        )}
                                        {itensDanificadosCompressao?.length > 0 && (
                                            <div className="notification-item" style={{ padding: '0.5rem 0' }}>
                                                <div className="notification-icon" style={{ background: '#FEF2F2', color: 'var(--danger-color)' }}><AlertTriangle size={16} /></div>
                                                <div className="notification-content">
                                                    <strong>{itensDanificadosCompressao.length} {itensDanificadosCompressao.length === 1 ? 'Item danificado na Compressão' : 'Itens danificados na Compressão'}</strong>
                                                    <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {itensDanificadosCompressao.slice(0, 5).map(i => (
                                                            <li key={i.id}>{i.numIdentificacao || i.numFormato}</li>
                                                        ))}
                                                        {itensDanificadosCompressao.length > 5 && <li>E mais {itensDanificadosCompressao.length - 5}...</li>}
                                                    </ul>
                                                    <Link to="/compressao">Verificar em Compressão</Link>
                                                </div>
                                            </div>
                                        )}
                                        {conjuntosCompressaoNoLimite?.length > 0 && (
                                            <div className="notification-item" style={{ padding: '0.5rem 0' }}>
                                                <div className="notification-icon" style={{ background: '#FFFBEB', color: '#D97706' }}><AlertTriangle size={16} /></div>
                                                <div className="notification-content">
                                                    <strong>{conjuntosCompressaoNoLimite.length} {conjuntosCompressaoNoLimite.length === 1 ? 'Conjunto de Compressão no limite de uso' : 'Conjuntos de Compressão no limite de uso'}</strong>
                                                    <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {conjuntosCompressaoNoLimite.slice(0, 5).map(i => (
                                                            <li key={i.id}>{i.numIdentificacao || i.numFormato}</li>
                                                        ))}
                                                        {conjuntosCompressaoNoLimite.length > 5 && <li>E mais {conjuntosCompressaoNoLimite.length - 5}...</li>}
                                                    </ul>
                                                    <Link to="/compressao">Verificar na Compressão</Link>
                                                </div>
                                            </div>
                                        )}
                                        {itensDanificadosEmbalagem?.length > 0 && (
                                            <div className="notification-item" style={{ padding: '0.5rem 0' }}>
                                                <div className="notification-icon" style={{ background: '#FEF2F2', color: 'var(--danger-color)' }}><AlertTriangle size={16} /></div>
                                                <div className="notification-content">
                                                    <strong>{itensDanificadosEmbalagem.length} {itensDanificadosEmbalagem.length === 1 ? 'Item danificado na Embalagem' : 'Itens danificados na Embalagem'}</strong>
                                                    <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {itensDanificadosEmbalagem.slice(0, 5).map(i => (
                                                            <li key={i.id}>{i.tag || i.subcategoria}</li>
                                                        ))}
                                                        {itensDanificadosEmbalagem.length > 5 && <li>E mais {itensDanificadosEmbalagem.length - 5}...</li>}
                                                    </ul>
                                                    <Link to="/gestao-ferramental/embalagem">Verificar na Embalagem</Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                        <div>
                            {renderPanels()}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4">
                        {renderPanels()}
                    </div>
                )}
            </div>
        </>
    );
}
