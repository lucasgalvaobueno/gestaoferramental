import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTasks } from '../contexts/TaskContext';
import { useUsers } from '../contexts/UserContext';
import { ArrowLeft, Plus, CheckSquare, X, Calendar, Clock, MessageSquare, Save, User as UserIcon, Trash2, Filter, ArrowDown, ArrowUp, AlertCircle } from 'lucide-react';

export default function GestaoTarefas() {
    const { tasks, addTask, updateTask, deleteTask } = useTasks();
    const { currentUser, users } = useUsers();
    
    const [currentTab, setCurrentTab] = useState('minhas'); // 'minhas' ou 'atribuir'
    
    // Filtros e Ordenação
    const [statusFilter, setStatusFilter] = useState('todas'); // 'todas', 'andamento', 'concluida', 'atrasada', 'proxima'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' = mais próximo, 'desc' = mais distante

    // Zoom & Drag do Kanban
    const [zoomLevel, setZoomLevel] = useState(1);
    const containerRef = useRef(null);
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const scrollPos = useRef({ x: 0, y: 0 });

    const handleWheel = (e) => {
        if (currentTab !== 'atribuir') return;
        if (!e.ctrlKey) return;
        e.preventDefault();
        setZoomLevel(prev => {
            const newZoom = prev - e.deltaY * 0.001;
            return Math.min(Math.max(0.5, newZoom), 2);
        });
    };

    const handleMouseDown = (e) => {
        if (currentTab !== 'atribuir') return;
        isDragging.current = true;
        startPos.current = { x: e.pageX, y: e.pageY };
        scrollPos.current = { x: containerRef.current.scrollLeft, y: containerRef.current.scrollTop };
        containerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const dx = e.pageX - startPos.current.x;
        const dy = e.pageY - startPos.current.y;
        containerRef.current.scrollLeft = scrollPos.current.x - dx;
        containerRef.current.scrollTop = scrollPos.current.y - dy;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
    };

    useEffect(() => {
        const el = containerRef.current;
        if (el && currentTab === 'atribuir') {
            el.addEventListener('wheel', handleWheel, { passive: false });
            return () => el.removeEventListener('wheel', handleWheel);
        }
    }, [currentTab]);

    // Estados dos Modais
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    
    // Modal de Delete
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    // Form de Nova Tarefa
    const [titulo, setTitulo] = useState('');
    const [detalhamento, setDetalhamento] = useState('');
    const [responsavelId, setResponsavelId] = useState('');
    const [prazo, setPrazo] = useState('');
    const [checklistItems, setChecklistItems] = useState(['']);

    const handleOpenNewTask = () => {
        setTitulo('');
        setDetalhamento('');
        setResponsavelId('');
        setPrazo('');
        setChecklistItems(['']);
        setShowTaskModal(true);
    };

    const handleSaveNewTask = (e) => {
        e.preventDefault();
        const filteredChecklist = checklistItems.filter(item => item.trim() !== '').map(item => ({
            id: 'chk-' + Date.now() + Math.random(),
            text: item,
            completed: false
        }));

        addTask({
            titulo,
            detalhamento,
            responsavelId,
            responsavelNome: users.find(u => u.email === responsavelId)?.nome || users.find(u => u.email === responsavelId)?.name || responsavelId,
            prazo,
            checklist: filteredChecklist,
            observacoes: []
        });
        setShowTaskModal(false);
    };

    // Detalhes da Tarefa (Minhas Tarefas ou Visualização)
    const [detailsChecklist, setDetailsChecklist] = useState([]);
    const [novaObservacao, setNovaObservacao] = useState('');
    const [dataConclusaoManual, setDataConclusaoManual] = useState('');

    const handleOpenDetails = (task) => {
        setEditingTask(task);
        setDetailsChecklist(task.checklist || []);
        setDataConclusaoManual(new Date().toISOString().split('T')[0]); // Default to today
        setShowDetailsModal(true);
    };

    const handleToggleChecklist = (chkId) => {
        setDetailsChecklist(prev => prev.map(c => c.id === chkId ? { ...c, completed: !c.completed } : c));
    };

    const handleCiente = () => {
        updateTask(editingTask.id, { ciente: true });
        setEditingTask({ ...editingTask, ciente: true });
    };

    const handleSaveDetails = () => {
        updateTask(editingTask.id, { checklist: detailsChecklist });
        setShowDetailsModal(false);
    };

    const handleAddObservacao = () => {
        if (!novaObservacao.trim()) return;
        const newObs = {
            id: 'obs-' + Date.now(),
            text: novaObservacao,
            date: new Date().toISOString(),
            userName: currentUser.nome || currentUser.name
        };
        const updatedObs = [...(editingTask.observacoes || []), newObs];
        updateTask(editingTask.id, { observacoes: updatedObs });
        setEditingTask({ ...editingTask, observacoes: updatedObs });
        setNovaObservacao('');
    };

    const handleConcluirTarefa = () => {
        // Validação da data de conclusão vs data de criação
        const criacao = new Date(editingTask.dataCriacao).toISOString().split('T')[0];
        if (dataConclusaoManual < criacao) {
            alert(`A data de conclusão não pode ser anterior à data de criação da tarefa (${new Date(editingTask.dataCriacao).toLocaleDateString('pt-BR')}).`);
            return;
        }

        updateTask(editingTask.id, { 
            status: 'concluida', 
            dataConclusao: dataConclusaoManual + 'T12:00:00.000Z',
            checklist: detailsChecklist
        });
        setShowDetailsModal(false);
    };

    // Helper functions para Prazos
    const getDaysDiff = (prazoStr) => {
        if (!prazoStr) return null;
        const prazo = new Date(`${prazoStr}T23:59:59`);
        const hoje = new Date();
        const diffTime = prazo - hoje;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const isAtrasada = (task) => {
        if (task.status === 'concluida') return false;
        const diff = getDaysDiff(task.prazo);
        return diff !== null && diff < 0;
    };

    const isProxima = (task) => {
        if (task.status === 'concluida') return false;
        const diff = getDaysDiff(task.prazo);
        return diff !== null && diff >= 0 && diff <= 3;
    };

    // Função de Filtro e Ordenação
    const processTasks = (taskList) => {
        // Filter
        let filtered = taskList.filter(t => {
            if (statusFilter === 'todas') return true;
            if (statusFilter === 'andamento') return t.status === 'pendente' && !isAtrasada(t);
            if (statusFilter === 'concluida') return t.status === 'concluida';
            if (statusFilter === 'atrasada') return isAtrasada(t);
            if (statusFilter === 'proxima') return isProxima(t);
            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            if (!a.prazo && !b.prazo) return 0;
            if (!a.prazo) return 1;
            if (!b.prazo) return -1;
            const tA = new Date(a.prazo).getTime();
            const tB = new Date(b.prazo).getTime();
            return sortOrder === 'asc' ? tA - tB : tB - tA;
        });

        return filtered;
    };

    // Derived Data
    const rawMinhasTarefas = tasks.filter(t => t.responsavelId === currentUser?.email);
    
    // Separa "Aguardando Ciência" das demais
    const aguardandoCiencia = rawMinhasTarefas.filter(t => !t.ciente && t.status !== 'concluida');
    const minhasTarefasCientes = rawMinhasTarefas.filter(t => t.ciente || t.status === 'concluida');
    
    // Aplica filtros apenas nas que já estou ciente (ou aplica em todas na aba minhas)
    const processedMinhasTarefas = processTasks(minhasTarefasCientes);

    // Para Kanban: Agrupar por usuário
    const tarefasCriadasPorMim = tasks.filter(t => t.atribuidoPorId === currentUser?.email);
    const kanbanUsers = Array.from(new Set(tarefasCriadasPorMim.map(t => t.responsavelId)));
    const kanbanData = kanbanUsers.map(email => {
        const user = users.find(u => u.email === email);
        const name = user?.nome || user?.name || email;
        const userTasks = processTasks(tarefasCriadasPorMim.filter(t => t.responsavelId === email));
        return { email, name, tasks: userTasks };
    }).filter(col => col.tasks.length > 0 || statusFilter === 'todas'); // Esconde colunas vazias se estiver filtrando

    const TaskCard = ({ task, onClick, isAguardando = false }) => {
        const totalChecks = task.checklist?.length || 0;
        const doneChecks = task.checklist?.filter(c => c.completed).length || 0;
        const atrasada = isAtrasada(task);
        const diff = getDaysDiff(task.prazo);
        
        let statusColor = 'var(--text-color)';
        let badgeClass = 'badge-primary';
        let badgeText = 'Em Andamento';
        let countdownText = '';

        if (task.status === 'concluida') {
            badgeClass = 'badge-success';
            badgeText = 'Concluída';
        } else if (atrasada) {
            badgeClass = 'badge-danger';
            badgeText = 'Atrasada';
            statusColor = 'var(--danger-color)';
            if (diff !== null) countdownText = `❌ Atrasada há ${Math.abs(diff)} dia(s)`;
        } else {
            if (diff === 0) countdownText = '🔥 Vence hoje';
            else if (diff > 0) countdownText = `⏳ Vence em ${diff} dia(s)`;
        }

        if (isAguardando) {
            badgeClass = 'badge-warning';
            badgeText = 'Nova';
        }

        return (
            <div className="task-card" onClick={() => onClick(task)} style={{
                background: 'var(--surface-color)',
                padding: '1rem',
                borderRadius: 'var(--border-radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                borderLeft: `4px solid ${task.status === 'concluida' ? 'var(--success-color)' : atrasada ? 'var(--danger-color)' : isAguardando ? 'var(--warning-color)' : 'var(--primary-color)'}`,
                cursor: 'pointer',
                marginBottom: '1rem',
                animation: isAguardando ? 'pulse 2s infinite' : 'none'
            }}>
                <div className="flex justify-between items-start mb-2">
                    <h4 style={{ margin: 0, color: statusColor, fontSize: '1rem' }}>{task.titulo}</h4>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{badgeText}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    {task.detalhamento.length > 60 ? task.detalhamento.substring(0, 60) + '...' : task.detalhamento}
                </div>
                {countdownText && !isAguardando && task.status !== 'concluida' && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: atrasada ? 'var(--danger-color)' : diff <= 3 ? 'var(--warning-color)' : 'var(--primary-color)', marginBottom: '0.5rem' }}>
                        {countdownText}
                    </div>
                )}
                <div className="flex items-center gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {task.prazo && (
                        <div className="flex items-center gap-1" style={{ color: atrasada ? 'var(--danger-color)' : 'inherit' }}>
                            <Calendar size={14} /> {new Date(`${task.prazo}T12:00:00`).toLocaleDateString('pt-BR')}
                        </div>
                    )}
                    {totalChecks > 0 && (
                        <div className="flex items-center gap-1">
                            <CheckSquare size={14} /> {doneChecks}/{totalChecks}
                        </div>
                    )}
                    {task.observacoes?.length > 0 && (
                        <div className="flex items-center gap-1">
                            <MessageSquare size={14} /> {task.observacoes.length}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <style>
                {`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                }
                `}
            </style>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'Atribuição de Tarefas' }]} />
            <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/gestao-ferramental" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Atribuição de Tarefas</h2>
                    </div>
                    {currentTab === 'atribuir' && (
                        <button className="btn btn-primary" onClick={handleOpenNewTask}>
                            <Plus size={18} /> Atribuir Tarefa
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="tabs" style={{ marginBottom: 0 }}>
                        <button className={`tab ${currentTab === 'minhas' ? 'active' : ''}`} onClick={() => setCurrentTab('minhas')}>Tarefas Atribuídas a Mim</button>
                        <button className={`tab ${currentTab === 'atribuir' ? 'active' : ''}`} onClick={() => setCurrentTab('atribuir')}>Visão Geral (Atribuir Tarefas)</button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2" style={{ backgroundColor: 'var(--surface-color)', padding: '0.4rem 1rem', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <Filter size={16} className="text-secondary" />
                            <select style={{ border: 'none', outline: 'none', padding: 0, fontSize: '0.85rem', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="todas">Todos os Status</option>
                                <option value="andamento">Em Andamento</option>
                                <option value="concluida">Concluídas</option>
                                <option value="atrasada">Atrasadas</option>
                                <option value="proxima">Próximas do Vencimento</option>
                            </select>
                        </div>
                        <button 
                            className="btn btn-secondary flex items-center gap-1" 
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            title="Alternar Ordenação por Prazo"
                        >
                            {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />} 
                            Prazo
                        </button>
                    </div>
                </div>

                {/* Aba Minhas Tarefas */}
                {currentTab === 'minhas' && (
                    <div className="flex gap-4" style={{ flex: 1, overflow: 'hidden' }}>
                        
                        {/* Coluna Esquerda: Aguardando Ciência */}
                        {aguardandoCiencia.length > 0 && (
                            <div style={{ width: '300px', backgroundColor: '#fef3c7', padding: '1rem', borderRadius: 'var(--border-radius)', overflowY: 'auto', border: '1px solid #fde68a' }}>
                                <div className="flex items-center gap-2 mb-4" style={{ color: '#d97706', fontWeight: 600 }}>
                                    <AlertCircle size={20} /> Aguardando Ciência
                                </div>
                                <div className="flex flex-col gap-2">
                                    {aguardandoCiencia.map(task => (
                                        <TaskCard key={task.id} task={task} onClick={handleOpenDetails} isAguardando={true} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Coluna Direita: Minhas Tarefas Normais */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {processedMinhasTarefas.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)' }}>Nenhuma tarefa encontrada com os filtros atuais.</p>
                                ) : (
                                    processedMinhasTarefas.map(task => (
                                        <TaskCard key={task.id} task={task} onClick={handleOpenDetails} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Aba Visão Geral (Kanban por Usuário) */}
                {currentTab === 'atribuir' && (
                    <div 
                        ref={containerRef}
                        style={{ 
                            flex: 1, 
                            overflow: 'auto', 
                            cursor: 'grab', 
                            backgroundColor: '#eef2f6', 
                            borderRadius: 'var(--border-radius)',
                            padding: '1.5rem'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div style={{ 
                            display: 'flex', 
                            gap: '1.5rem',
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'top left',
                            minWidth: 'max-content',
                            transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
                        }}>
                            {kanbanData.length === 0 ? (
                                <div style={{ color: 'var(--text-secondary)' }}>Nenhuma tarefa encontrada com os filtros atuais.</div>
                            ) : (
                                kanbanData.map(col => (
                                    <div key={col.email} style={{
                                        width: '320px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: 'var(--border-radius)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        maxHeight: 'calc(100vh - 250px)'
                                    }}>
                                        <div style={{ padding: '1rem', borderBottom: '2px solid var(--border-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                                            <UserIcon size={18} /> {col.name}
                                        </div>
                                        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
                                            {col.tasks.map(task => (
                                                <TaskCard key={task.id} task={task} onClick={handleOpenDetails} />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Nova Tarefa */}
            <div className={`modal-overlay ${showTaskModal ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '600px' }}>
                    <div className="modal-header">
                        <h2 className="modal-title">Atribuir Nova Tarefa</h2>
                        <button className="modal-close" onClick={() => setShowTaskModal(false)}><X /></button>
                    </div>
                    <form onSubmit={handleSaveNewTask}>
                        <div className="form-group">
                            <label>Título da Tarefa</label>
                            <input type="text" className="form-control" required value={titulo} onChange={e => setTitulo(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Detalhamento</label>
                            <textarea className="form-control" required rows="3" value={detalhamento} onChange={e => setDetalhamento(e.target.value)}></textarea>
                        </div>
                        <div className="flex gap-4">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Responsável</label>
                                <select className="form-control" required value={responsavelId} onChange={e => setResponsavelId(e.target.value)}>
                                    <option value="">Selecione um usuário...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.email}>{u.nome || u.name} ({u.nivel})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Prazo de Conclusão</label>
                                <input type="date" className="form-control" required value={prazo} onChange={e => setPrazo(e.target.value)} />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Lista de Tarefas (Checklist)</label>
                            {checklistItems.map((item, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder={`Item ${index + 1}`}
                                        value={item} 
                                        onChange={e => {
                                            const newItems = [...checklistItems];
                                            newItems[index] = e.target.value;
                                            setChecklistItems(newItems);
                                        }} 
                                    />
                                    {index === checklistItems.length - 1 && (
                                        <button type="button" className="btn btn-secondary" onClick={() => setChecklistItems([...checklistItems, ''])}><Plus size={18} /></button>
                                    )}
                                    {checklistItems.length > 1 && (
                                        <button type="button" className="btn btn-secondary text-danger" onClick={() => {
                                            const newItems = [...checklistItems];
                                            newItems.splice(index, 1);
                                            setChecklistItems(newItems);
                                        }}><X size={18} /></button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="modal-footer" style={{ marginTop: '2rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Salvar e Atribuir</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal Detalhes da Tarefa */}
            <div className={`modal-overlay ${showDetailsModal ? 'active' : ''}`}>
                <div className="modal-content" style={{ maxWidth: '700px' }}>
                    <div className="modal-header">
                        <div className="flex items-center gap-2">
                            <h2 className="modal-title">{editingTask?.titulo}</h2>
                            {editingTask?.status === 'concluida' && <span className="badge badge-success">Concluída</span>}
                            {editingTask && isAtrasada(editingTask) && <span className="badge badge-danger">Atrasada</span>}
                            {editingTask && !editingTask.ciente && <span className="badge badge-warning">Aguardando Ciência</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            {editingTask && editingTask.atribuidoPorId === currentUser?.email && (
                                <button className="btn btn-icon text-danger" onClick={() => {
                                    setTaskToDelete(editingTask);
                                    setShowConfirmDelete(true);
                                    setShowDetailsModal(false);
                                }} title="Excluir Tarefa">
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button className="modal-close" onClick={() => setShowDetailsModal(false)}><X /></button>
                        </div>
                    </div>
                    {editingTask && (
                        <div className="flex flex-col gap-4">
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Atribuído por: <strong>{editingTask.atribuidoPorNome}</strong> | Prazo: <strong>{new Date(`${editingTask.prazo}T12:00:00`).toLocaleDateString('pt-BR')}</strong>
                            </div>
                            <div style={{ backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
                                <strong>Detalhamento:</strong>
                                <p style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-line' }}>{editingTask.detalhamento}</p>
                            </div>

                            {/* Alerta e Ação de Ciência */}
                            {!editingTask.ciente && editingTask.responsavelId === currentUser?.email && (
                                <div style={{ padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', textAlign: 'center' }}>
                                    <AlertCircle size={32} style={{ color: '#d97706', margin: '0 auto 0.5rem' }} />
                                    <h4 style={{ color: '#d97706', marginBottom: '0.5rem' }}>Nova Tarefa Atribuída</h4>
                                    <p style={{ color: '#92400e', fontSize: '0.9rem', marginBottom: '1rem' }}>Esta tarefa foi atribuída a você e aguarda a sua confirmação de ciência para entrar em andamento.</p>
                                    <button className="btn btn-primary" style={{ backgroundColor: '#d97706', color: 'white', border: 'none' }} onClick={handleCiente}>
                                        <CheckSquare size={18} /> Estou ciente sobre a tarefa
                                    </button>
                                </div>
                            )}

                            {/* Conteúdo Restrito à Ciência */}
                            {editingTask.ciente && (
                                <>
                                    {/* Checklist */}
                                    {detailsChecklist.length > 0 && (
                                        <div>
                                            <h4 className="mb-2">Progresso</h4>
                                            <div className="flex flex-col gap-2">
                                                {detailsChecklist.map(chk => (
                                                    <div key={chk.id} className="checkbox-wrapper" style={{ margin: 0 }}>
                                                        <input 
                                                            type="checkbox" 
                                                            id={chk.id} 
                                                            checked={chk.completed} 
                                                            onChange={() => handleToggleChecklist(chk.id)} 
                                                            disabled={editingTask.status === 'concluida' || editingTask.responsavelId !== currentUser?.email}
                                                        />
                                                        <label htmlFor={chk.id} style={{ textDecoration: chk.completed ? 'line-through' : 'none', opacity: chk.completed ? 0.6 : 1 }}>
                                                            {chk.text}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Observações */}
                                    <div>
                                        <h4 className="mb-2">Observações</h4>
                                        <div className="flex flex-col gap-2 mb-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                            {(!editingTask.observacoes || editingTask.observacoes.length === 0) ? (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nenhuma observação.</span>
                                            ) : (
                                                editingTask.observacoes.map(obs => (
                                                    <div key={obs.id} style={{ backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem' }}>
                                                        <strong style={{ color: 'var(--primary-color)' }}>{obs.userName}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>em {new Date(obs.date).toLocaleString('pt-BR')}</span>
                                                        <p style={{ margin: '0.25rem 0 0' }}>{obs.text}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {editingTask.status !== 'concluida' && (
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    placeholder="Adicionar observação..." 
                                                    style={{ marginBottom: 0 }}
                                                    value={novaObservacao}
                                                    onChange={e => setNovaObservacao(e.target.value)}
                                                    onKeyDown={e => { if(e.key === 'Enter') handleAddObservacao(); }}
                                                />
                                                <button className="btn btn-secondary" onClick={handleAddObservacao}>Adicionar</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="modal-footer" style={{ marginTop: '1rem', alignItems: 'center' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Fechar</button>
                                
                                {editingTask.ciente && editingTask.status !== 'concluida' && editingTask.responsavelId === currentUser?.email && (
                                    <>
                                        <button type="button" className="btn btn-primary" onClick={handleSaveDetails}>Salvar Progresso</button>
                                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                                            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                                <label style={{ fontSize: '0.8rem' }}>Data de Conclusão Real</label>
                                                <input type="date" className="form-control" style={{ padding: '0.5rem' }} value={dataConclusaoManual} onChange={e => setDataConclusaoManual(e.target.value)} />
                                            </div>
                                            <button type="button" className="btn btn-success" onClick={handleConcluirTarefa}>
                                                <CheckSquare size={16} /> Finalizar Tarefa
                                            </button>
                                        </div>
                                    </>
                                )}
                                {editingTask.ciente && editingTask.status !== 'concluida' && editingTask.responsavelId !== currentUser?.email && (
                                    <button type="button" className="btn btn-primary" onClick={handleSaveDetails}>Salvar Alterações</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Delete Task Modal */}
            {showConfirmDelete && taskToDelete && (
                <div className="modal-overlay active" style={{ zIndex: 1005 }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className="flex flex-col items-center justify-center mb-4 text-danger">
                            <Trash2 size={48} style={{ opacity: 0.8 }} />
                        </div>
                        <h3 className="mb-4">Excluir Tarefa</h3>
                        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Você deseja realmente apagar a tarefa <br/>
                            <strong style={{ color: 'var(--text-color)' }}>{taskToDelete.titulo}</strong>? <br/><br/>
                            <small>Ela desaparecerá permanentemente do painel do responsável.</small>
                        </p>
                        <div className="flex justify-center gap-4 mt-2">
                            <button className="btn btn-secondary" onClick={() => {
                                setShowConfirmDelete(false);
                                setTaskToDelete(null);
                                setShowDetailsModal(true); // Return to details
                            }}>Cancelar</button>
                            <button className="btn btn-danger" onClick={() => {
                                deleteTask(taskToDelete.id);
                                setShowConfirmDelete(false);
                                setTaskToDelete(null);
                            }}>Sim, excluir tarefa</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
