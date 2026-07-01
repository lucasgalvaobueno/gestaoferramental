import React, { useState, useRef, useEffect } from 'react';
import { useUsers } from '../contexts/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Users, ChevronRight, Bell, AlertTriangle, Briefcase, PackageX, CheckCircle2, CheckSquare, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useShiftHandover } from '../hooks/useShiftHandover';

export default function Navbar({ breadcrumbs }) {
    const { currentUser, logout } = useUsers();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    const isAdmin = currentUser?.nivel === 'admin';
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef(null);
    const { ativosPendentes, rcsAtrasadas, vagasAbertas, tarefasAtrasadasOuProximas, novasTarefasAtribuidas, itensDanificadosManipulacao, itensDanificadosEmbalagem, conjuntosCompressaoNoLimite, totalNotificacoes, marcarTarefaComoLida } = useNotifications();
    const { feedNotifications = [], markFeedNotificationRead } = useShiftHandover();
    const [hasUnseen, setHasUnseen] = useState(false);
    const [lastSeenCount, setLastSeenCount] = useState(() => {
        const stored = localStorage.getItem('@gestao-ferramental/lastSeenNotifications');
        return stored ? parseInt(stored, 10) : 0;
    });

    const grandTotalNotificacoes = totalNotificacoes + feedNotifications.length;

    useEffect(() => {
        if (grandTotalNotificacoes > lastSeenCount) {
            setHasUnseen(true);
        } else {
            setHasUnseen(false);
        }
    }, [grandTotalNotificacoes, lastSeenCount]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#1A2F5A', borderBottom: '1px solid #1A2F5A', position: 'sticky', top: 0, zIndex: 100 }}>
            {/* Left: User Menu & Notifications */}
            <div style={{ width: '250px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '1.5rem' }}>
                <div className="user-menu" style={{ position: 'relative' }}>
                    <div className="user-avatar" style={{ border: '2px solid #FFFFFF', background: '#FFFFFF', color: '#1A2F5A' }}>
                    {currentUser?.photo ? (
                        <img src={currentUser.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        (currentUser?.nome || currentUser?.name)
                            ? (currentUser?.nome || currentUser?.name).charAt(0).toUpperCase()
                            : <User />
                    )}
                </div>
                <div className="user-dropdown" style={{ left: 0, right: 'auto' }}>
                    <div className="user-dropdown-item" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{currentUser?.nome || currentUser?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{currentUser?.nivel || 'usuário'}</div>
                    </div>
                    {isAdmin && (
                        <Link to="/usuarios" className="user-dropdown-item" style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={18} /> Gerenciar Usuários
                        </Link>
                    )}
                    <div className="user-dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger-color)' }}>
                        <LogOut size={18} /> Sair
                    </div>
                </div>
                </div>

                <div style={{ position: 'relative' }} ref={notificationsRef}>
                    <button 
                        className="btn btn-icon" 
                        style={{ color: '#FFFFFF', position: 'relative' }} 
                            onClick={() => {
                                if (!showNotifications) {
                                    setHasUnseen(false);
                                    setLastSeenCount(grandTotalNotificacoes);
                                    localStorage.setItem('@gestao-ferramental/lastSeenNotifications', grandTotalNotificacoes.toString());
                                }
                                setShowNotifications(!showNotifications);
                            }}
                            title="Central de Notificações"
                        >
                            <Bell size={24} />
                            {(hasUnseen && grandTotalNotificacoes > 0) && (
                                <span style={{
                                    position: 'absolute', top: -2, right: -2, background: 'var(--danger-color)', 
                                    color: 'white', fontSize: '0.65rem', fontWeight: 'bold', 
                                    width: 18, height: 18, borderRadius: '50%', display: 'flex', 
                                    alignItems: 'center', justifyContent: 'center', border: '2px solid #1A2F5A'
                                }}>
                                    {grandTotalNotificacoes}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notifications-dropdown" style={{
                                position: 'absolute', top: '120%', left: 0, width: '320px', 
                                background: '#FFFFFF', borderRadius: 'var(--border-radius)', 
                                boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', 
                                zIndex: 1000, overflow: 'hidden'
                            }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: '#F8FAFC' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#1A2F5A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Bell size={18} /> Central de Notificações
                                    </h3>
                                </div>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {grandTotalNotificacoes === 0 ? (
                                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--success-color)', opacity: 0.5 }} />
                                            Nenhuma pendência no momento.
                                        </div>
                                    ) : (
                                        <>
                                            {feedNotifications.length > 0 && feedNotifications.map(notification => (
                                                <div key={notification.id} className="notification-item">
                                                    <div className="notification-icon" style={{ background: '#E0E7FF', color: '#4F46E5' }}><Users size={16} /></div>
                                                    <div className="notification-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <strong>Troca de Turno</strong>
                                                            <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{notification.message}</p>
                                                            <Link to="/troca-de-turno" onClick={() => { markFeedNotificationRead(notification.id); setShowNotifications(false); }}>Ver post</Link>
                                                        </div>
                                                        <button className="btn btn-icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); markFeedNotificationRead(notification.id); }} title="Marcar como lido" style={{ padding: '0.25rem', height: 'auto', width: 'auto' }}>
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {ativosPendentes.length > 0 && (
                                                <div className="notification-item">
                                                    <div className="notification-icon" style={{ background: '#FEF2F2', color: 'var(--danger-color)' }}><PackageX size={16} /></div>
                                                    <div className="notification-content">
                                                        <strong>{ativosPendentes.length} {ativosPendentes.length === 1 ? 'Ativo' : 'Ativos'} aguardando descarte</strong>
                                                        <Link to="/gestao-ativos" onClick={() => setShowNotifications(false)}>Revisar descartes</Link>
                                                    </div>
                                                </div>
                                            )}
                                            {rcsAtrasadas.length > 0 && (
                                                <div className="notification-item">
                                                    <div className="notification-icon" style={{ background: '#FFFBEB', color: '#D97706' }}><AlertTriangle size={16} /></div>
                                                    <div className="notification-content">
                                                        <strong>{rcsAtrasadas.length} {rcsAtrasadas.length === 1 ? 'RC pendente/atrasada' : 'RCs pendentes/atrasadas'}</strong>
                                                        <Link to="/follow-up" onClick={() => setShowNotifications(false)}>Ver Requisições</Link>
                                                    </div>
                                                </div>
                                            )}
                                            {vagasAbertas.length > 0 && (
                                                <div className="notification-item">
                                                    <div className="notification-icon" style={{ background: '#F0FDF4', color: 'var(--success-color)' }}><Briefcase size={16} /></div>
                                                    <div className="notification-content">
                                                        <strong>{vagasAbertas.length} {vagasAbertas.length === 1 ? 'Vaga em aberto' : 'Vagas em aberto'}</strong>
                                                        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {vagasAbertas.slice(0, 3).map(v => (
                                                                <li key={v.id}>{v.cargo} ({v.diasEmAberto} dias)</li>
                                                            ))}
                                                            {vagasAbertas.length > 3 && <li>E mais {vagasAbertas.length - 3}...</li>}
                                                        </ul>
                                                        <Link to="/organograma" onClick={() => setShowNotifications(false)}>Ver Organograma</Link>
                                                    </div>
                                                </div>
                                            )}
                                            {tarefasAtrasadasOuProximas?.length > 0 && (
                                                <div className="notification-item">
                                                    <div className="notification-icon" style={{ background: '#FEF2F2', color: 'var(--danger-color)' }}><AlertTriangle size={16} /></div>
                                                    <div className="notification-content">
                                                        <strong>{tarefasAtrasadasOuProximas.length} {tarefasAtrasadasOuProximas.length === 1 ? 'Tarefa atrasada/próxima' : 'Tarefas atrasadas/próximas'}</strong>
                                                        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {tarefasAtrasadasOuProximas.slice(0, 3).map(t => (
                                                                <li key={t.id}>{t.titulo}</li>
                                                            ))}
                                                        </ul>
                                                        <Link to="/gestao-tarefas" onClick={() => setShowNotifications(false)}>Ver Minhas Tarefas</Link>
                                                    </div>
                                                </div>
                                            )}
                                            {novasTarefasAtribuidas?.length > 0 && (
                                                <div className="notification-item">
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
                                                        <Link to="/gestao-tarefas" onClick={() => setShowNotifications(false)}>Ver Minhas Tarefas</Link>
                                                    </div>
                                                </div>
                                            )}
                                            {itensDanificadosManipulacao?.length > 0 && (
                                                <div className="notification-item">
                                                    <div className="notification-icon" style={{ background: '#FEF2F2', color: 'var(--danger-color)' }}><AlertTriangle size={16} /></div>
                                                    <div className="notification-content">
                                                        <strong>{itensDanificadosManipulacao.length} {itensDanificadosManipulacao.length === 1 ? 'Item danificado' : 'Itens danificados'} na Manipulação</strong>
                                                        <Link to="/manipulacao" onClick={() => setShowNotifications(false)}>Verificar em Manipulação</Link>
                                                    </div>
                                                </div>
                                            )}
                                            {itensDanificadosEmbalagem.length > 0 && (
                                                <div className="notification-item">
                                                    <div className="notification-icon" style={{ background: '#FEF2F2', color: 'var(--danger-color)' }}><AlertTriangle size={16} /></div>
                                                    <div className="notification-content">
                                                        <strong>{itensDanificadosEmbalagem.length} {itensDanificadosEmbalagem.length === 1 ? 'Item danificado na Embalagem' : 'Itens danificados na Embalagem'}</strong>
                                                        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {itensDanificadosEmbalagem.slice(0, 3).map(i => (
                                                                <li key={i.id}>{i.tag || i.subcategoria}</li>
                                                            ))}
                                                            {itensDanificadosEmbalagem.length > 3 && <li>E mais {itensDanificadosEmbalagem.length - 3}...</li>}
                                                        </ul>
                                                        <Link to="/gestao-ferramental/embalagem" onClick={() => setShowNotifications(false)}>Revisar Embalagem</Link>
                                                    </div>
                                                </div>
                                            )}
                                            {conjuntosCompressaoNoLimite?.length > 0 && (
                                                <div className="notification-item">
                                                    <div className="notification-icon" style={{ background: '#FFFBEB', color: 'var(--warning-dark)' }}><AlertTriangle size={16} /></div>
                                                    <div className="notification-content">
                                                        <strong>{conjuntosCompressaoNoLimite.length} {conjuntosCompressaoNoLimite.length === 1 ? 'Conjunto' : 'Conjuntos'} no limite de uso</strong>
                                                        <span>(Compressão) &ge; 70% da vida útil</span>
                                                        <Link to="/cadastros-compressao" onClick={() => setShowNotifications(false)}>Verificar</Link>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
            </div>

            {/* Center: Title & Breadcrumbs */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>
                    Gestão Ferramental
                </h1>
                
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.25rem' }}>
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={idx}>
                                {crumb.to ? (
                                    <Link to={crumb.to} style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }} className="breadcrumb-link">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{crumb.label}</span>
                                )}
                                {idx < breadcrumbs.length - 1 && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Logo */}
            <div style={{ width: '200px', display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                <img src="/geolab-logo-white.png" alt="Geolab" style={{ height: '90px', objectFit: 'contain', position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 0 }} />
            </div>
        </nav>
    );
}
