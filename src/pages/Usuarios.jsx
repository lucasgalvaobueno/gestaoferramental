import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useUsers } from '../contexts/UserContext';
import {
    Users, UserPlus, Edit2, Lock, Unlock, Key,
    Shield, User, CheckCircle, XCircle, Eye, EyeOff, X, Save, ArrowLeft, Search, Settings
} from 'lucide-react';

const PANEL_KEYS = [
    { key: 'gestao-ferramental', label: 'Gestão Ferramental' },
    { key: 'manipulacao',        label: 'Manipulação'        },
    { key: 'compressao',         label: 'Compressão'         },
    { key: 'embalagem',          label: 'Embalagem'          },
    { key: 'nao-solidos',        label: 'Não Sólidos'        },
];

const EMPTY_FORM = {
    nome: '', matricula: '', email: '', cargo: '',
    senha: '', confirmarSenha: '', nivel: 'operador', paineis: [],
};

function NivelBadge({ nivel }) {
    return nivel === 'admin'
        ? <span className="user-badge user-badge-admin"><Shield size={12}/> Admin</span>
        : <span className="user-badge user-badge-op"><User size={12}/> Operador</span>;
}
function StatusBadge({ ativo }) {
    return ativo
        ? <span className="user-badge user-badge-active"><CheckCircle size={12}/> Ativo</span>
        : <span className="user-badge user-badge-inactive"><XCircle size={12}/> Inativo</span>;
}
function InitialAvatar({ nome, nivel }) {
    const bg = nivel === 'admin' ? '#4A7FA7' : '#10b981';
    return (
        <div style={{ width:36, height:36, borderRadius:'50%', background:bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem', flexShrink:0 }}>
            {nome ? nome.charAt(0).toUpperCase() : '?'}
        </div>
    );
}

function EditModal({ user, onClose, onSave }) {
    const [form, setForm] = useState({ nome: user.nome||'', matricula: user.matricula||'', email: user.email||'', cargo: user.cargo||'', nivel: user.nivel||'operador', paineis: user.paineis||[], senha:'', confirmarSenha:'' });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const togglePanel = k => setForm(p => ({ ...p, paineis: p.paineis.includes(k) ? p.paineis.filter(x => x!==k) : [...p.paineis, k] }));
    const save = () => {
        if (!form.nome || !form.email) { setError('Nome e e-mail são obrigatórios.'); return; }
        if (form.senha && form.senha !== form.confirmarSenha) { setError('Senhas não coincidem.'); return; }
        const u = { nome:form.nome, matricula:form.matricula, email:form.email, cargo:form.cargo, nivel:form.nivel, paineis:form.paineis };
        if (form.senha) u.senha = form.senha;
        onSave(user.id, u); onClose();
    };
    return (
        <div className="modal-overlay" style={{opacity:1,visibility:'visible'}}>
            <div className="modal animate-scale">
                <div className="modal-header">
                    <h3 style={{margin:0}}>Editar Usuário</h3>
                    <button className="btn btn-icon" onClick={onClose}><X size={22}/></button>
                </div>
                <div className="modal-body">
                    {error && <div className="user-form-error">{error}</div>}
                    <div className="form-grid">
                        <div className="form-group"><label>Nome *</label><input className="form-control" value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))}/></div>
                        <div className="form-group"><label>Matrícula</label><input className="form-control" value={form.matricula} onChange={e=>setForm(p=>({...p,matricula:e.target.value}))}/></div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label>E-mail *</label><input type="email" className="form-control" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
                        <div className="form-group"><label>Cargo</label><input className="form-control" value={form.cargo} onChange={e=>setForm(p=>({...p,cargo:e.target.value}))}/></div>
                    </div>
                    <div className="form-group">
                        <label>Nível de Acesso</label>
                        <div className="user-nivel-toggle">
                            <button type="button" className={`nivel-btn ${form.nivel==='admin'?'active-admin':''}`} onClick={()=>setForm(p=>({...p,nivel:'admin'}))}><Shield size={14}/> Admin</button>
                            <button type="button" className={`nivel-btn ${form.nivel==='operador'?'active-op':''}`} onClick={()=>setForm(p=>({...p,nivel:'operador'}))}><User size={14}/> Operador</button>
                        </div>
                    </div>
                    {form.nivel==='operador' && (
                        <div className="form-group"><label>Painéis Permitidos</label>
                            <div className="user-panels-grid">
                                {PANEL_KEYS.map(p=>(
                                    <label key={p.key} className={`panel-checkbox ${form.paineis.includes(p.key)?'checked':''}`}>
                                        <input type="checkbox" checked={form.paineis.includes(p.key)} onChange={()=>togglePanel(p.key)}/>{p.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nova Senha <small style={{color:'var(--text-secondary)',fontWeight:400}}>(deixe em branco para manter)</small></label>
                            <div style={{position:'relative'}}>
                                <input type={showPw?'text':'password'} className="form-control" value={form.senha} onChange={e=>setForm(p=>({...p,senha:e.target.value}))} placeholder="••••••••" style={{paddingRight:'2.5rem'}}/>
                                <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                            </div>
                        </div>
                        <div className="form-group"><label>Confirmar</label><input type={showPw?'text':'password'} className="form-control" value={form.confirmarSenha} onChange={e=>setForm(p=>({...p,confirmarSenha:e.target.value}))} placeholder="••••••••"/></div>
                    </div>
                </div>
                <div className="modal-footer" style={{padding:'1rem 1.5rem'}}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={save}><Save size={16}/> Salvar</button>
                </div>
            </div>
        </div>
    );
}

function TempPwModal({ user, onClose, onConfirm }) {
    const [senha, setSenha] = useState('');
    const [show, setShow] = useState(false);
    return (
        <div className="modal-overlay" style={{opacity:1,visibility:'visible'}}>
            <div className="modal animate-scale" style={{maxWidth:420}}>
                <div className="modal-header">
                    <h3 style={{margin:0}}>Senha Temporária — {user.nome}</h3>
                    <button className="btn btn-icon" onClick={onClose}><X size={22}/></button>
                </div>
                <div className="modal-body">
                    <p style={{fontSize:'0.875rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>O usuário deverá alterar esta senha no próximo login.</p>
                    <div className="form-group"><label>Senha Temporária</label>
                        <div style={{position:'relative'}}>
                            <input type={show?'text':'password'} className="form-control" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Digite a senha temporária" style={{paddingRight:'2.5rem'}}/>
                            <button type="button" onClick={()=>setShow(p=>!p)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                        </div>
                    </div>
                </div>
                <div className="modal-footer" style={{padding:'1rem 1.5rem'}}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" style={{background:'#f59e0b',borderColor:'#f59e0b'}} onClick={()=>{ if(senha){onConfirm(user.id,senha);onClose();}}}><Key size={16}/> Definir</button>
                </div>
            </div>
        </div>
    );
}

function ConfirmAdminPasswordModal({ verifyAdminPassword, onClose, onConfirm }) {
    const [senha, setSenha] = useState('');
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        if (!senha) {
            setError('Digite a senha.');
            return;
        }
        const isValid = await verifyAdminPassword(senha);
        if (isValid) {
            onConfirm();
        } else {
            setError('Senha de administrador incorreta.');
        }
    };

    return (
        <div className="modal-overlay" style={{opacity:1,visibility:'visible'}}>
            <div className="modal animate-scale" style={{maxWidth:420}}>
                <div className="modal-header">
                    <h3 style={{margin:0}}>Confirmação de Segurança</h3>
                    <button className="btn btn-icon" onClick={onClose}><X size={22}/></button>
                </div>
                <div className="modal-body">
                    <p style={{fontSize:'0.875rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
                        Esta ação requer privilégios de administrador. Confirme sua senha para continuar.
                    </p>
                    {error && <div className="user-form-error" style={{marginBottom:'1rem',color:'var(--danger-color)'}}>{error}</div>}
                    <div className="form-group"><label>Senha do Administrador</label>
                        <div style={{position:'relative'}}>
                            <input type={show?'text':'password'} className="form-control" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" style={{paddingRight:'2.5rem'}}/>
                            <button type="button" onClick={()=>setShow(p=>!p)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                        </div>
                    </div>
                </div>
                <div className="modal-footer" style={{padding:'1rem 1.5rem'}}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleConfirm}><Shield size={16}/> Confirmar</button>
                </div>
            </div>
        </div>
    );
}

export default function Usuarios() {
    const { users, addUser, editUser, toggleUserStatus, resetUserPassword, currentUser, inactivityTimeoutMinutes, updateInactivityTimeout, verifyAdminPassword } = useUsers();
    const [activeTab, setActiveTab] = useState('lista');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [showPw, setShowPw] = useState(false);
    const [formError, setFormError] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [tempPwUser, setTempPwUser] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [localTimeout, setLocalTimeout] = useState(inactivityTimeoutMinutes || 30);

    React.useEffect(() => {
        if (inactivityTimeoutMinutes) {
            setLocalTimeout(inactivityTimeoutMinutes);
        }
    }, [inactivityTimeoutMinutes]);

    const requireAdminPassword = (actionFn) => {
        setPendingAction(() => actionFn);
    };

    const togglePanel = k => setForm(p => ({ ...p, paineis: p.paineis.includes(k) ? p.paineis.filter(x=>x!==k) : [...p.paineis,k] }));

    const handleSubmit = e => {
        e.preventDefault(); setFormError('');
        if (!form.nome||!form.email||!form.senha) { setFormError('Nome, e-mail e senha são obrigatórios.'); return; }
        if (form.senha !== form.confirmarSenha) { setFormError('As senhas não coincidem.'); return; }
        if (users.some(u=>u.email.toLowerCase()===form.email.toLowerCase())) { setFormError('E-mail já cadastrado.'); return; }
        requireAdminPassword(async () => {
            await addUser(form); 
            setForm(EMPTY_FORM); 
            setActiveTab('lista');
        });
    };

    const filtered = users.filter(u =>
        (u.nome||'').toLowerCase().includes(search.toLowerCase()) ||
        (u.email||'').toLowerCase().includes(search.toLowerCase()) ||
        (u.cargo||'').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, { label: 'Gestão de Usuários' }]} />
            <div className="container animate-fade-in" style={{maxWidth:'1200px',width:'95%'}}>
                <div className="flex items-center gap-2 mb-4">
                    <Link to="/gestao-ferramental" className="btn btn-icon"><ArrowLeft /></Link>
                    <h2 style={{ margin: 0 }}>Cadastro de Usuários</h2>
                </div>

                {/* Resumo */}
                <div style={{display:'flex',gap:0,background:'var(--surface-color)',borderRadius:'var(--border-radius)',border:'1px solid var(--border-color)',marginBottom:'1.5rem',overflow:'hidden',flexWrap:'wrap'}}>
                    {[
                        {label:'Total',    v:users.length,             color:'#3b82f6',bg:'#eff6ff'},
                        {label:'Ativos',   v:users.filter(u=>u.ativo).length,  color:'#10b981',bg:'#ecfdf5'},
                        {label:'Inativos', v:users.filter(u=>!u.ativo).length, color:'#ef4444',bg:'#fef2f2'},
                        {label:'Admins',   v:users.filter(u=>u.nivel==='admin').length, color:'#8b5cf6',bg:'#f5f3ff'},
                        {label:'Senha Temp',v:users.filter(u=>u.senhaTemporaria).length,color:'#f59e0b',bg:'#fffbeb'},
                    ].map(s=>(
                        <div key={s.label} className="org-stat-card">
                            <div className="org-stat-icon" style={{background:s.bg,color:s.color}}><Users size={20}/></div>
                            <div className="org-stat-info">
                                <span className="org-stat-value" style={{color:s.color}}>{s.v}</span>
                                <span className="org-stat-label">{s.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="tabs mb-4">
                    <button className={`tab ${activeTab==='lista'?'active':''}`} onClick={()=>setActiveTab('lista')}><Users size={16}/> Usuários Cadastrados</button>
                    <button className={`tab ${activeTab==='novo'?'active':''}`} onClick={()=>setActiveTab('novo')}><UserPlus size={16}/> Novo Usuário</button>
                    <button className={`tab ${activeTab==='configuracoes'?'active':''}`} onClick={()=>setActiveTab('configuracoes')}><Settings size={16}/> Configurações Gerais</button>
                </div>

                {/* ── Lista ── */}
                {activeTab==='lista' && (
                    <div className="card" style={{padding:'1.5rem'}}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 style={{margin:0}}>Todos os Usuários</h3>
                            <div className="flex gap-2 items-center">
                                {search && (
                                    <span className="badge flex items-center gap-2" style={{ backgroundColor: 'var(--primary-color)', color: 'white', fontSize: '0.75rem' }}>
                                        Busca Ativa
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }} onClick={() => setSearch('')}>
                                            <X size={12} />
                                        </button>
                                    </span>
                                )}
                                <button className="btn btn-secondary flex items-center gap-2" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setShowFilters(!showFilters)}>
                                    <Search size={16} /> {showFilters ? 'Ocultar' : 'Buscar'}
                                </button>
                            </div>
                        </div>
                        {showFilters && (
                            <div className="card mb-4 animate-fade-in" style={{ padding: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <div className="flex items-center" style={{ position: 'relative' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
                                        <input type="text" className="form-control" style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.85rem' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou cargo…" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="table-container" style={{marginTop:'1rem'}}>
                            <table className="table">
                                <thead><tr>
                                    <th>Usuário</th><th>Matrícula</th><th>Cargo</th><th>Nível</th><th>Status</th><th style={{textAlign:'right'}}>Ações</th>
                                </tr></thead>
                                <tbody>
                                    {filtered.map(u=>(
                                        <tr key={u.id} style={{opacity:u.ativo?1:0.55}}>
                                            <td>
                                                <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                                                    <InitialAvatar nome={u.nome} nivel={u.nivel}/>
                                                    <div>
                                                        <div style={{fontWeight:600}}>{u.nome}</div>
                                                        <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{u.email}</div>
                                                        {u.senhaTemporaria && <span style={{fontSize:'0.65rem',background:'#fffbeb',color:'#b45309',border:'1px solid #fcd34d',borderRadius:999,padding:'1px 6px',fontWeight:700}}>Senha temporária</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{fontSize:'0.85rem'}}>{u.matricula||'—'}</td>
                                            <td style={{fontSize:'0.85rem'}}>{u.cargo||'—'}</td>
                                            <td><NivelBadge nivel={u.nivel}/></td>
                                            <td><StatusBadge ativo={u.ativo}/></td>
                                            <td>
                                                <div style={{display:'flex',gap:'0.4rem',justifyContent:'flex-end'}}>
                                                    <button className="btn btn-icon" title="Editar" onClick={()=>setEditingUser(u)} style={{color:'var(--primary-color)'}}><Edit2 size={16}/></button>
                                                    <button className="btn btn-icon" title={u.ativo?'Inativar':'Ativar'}
                                                        onClick={()=>{ if(u.id===currentUser?.id){alert('Você não pode inativar seu próprio usuário.');return;} requireAdminPassword(() => toggleUserStatus(u.id, !u.ativo)); }}
                                                        style={{color:u.ativo?'var(--danger-color)':'var(--success-color)'}}>
                                                        {u.ativo?<Lock size={16}/>:<Unlock size={16}/>}
                                                    </button>
                                                    <button className="btn btn-icon" title="Senha temporária" onClick={()=>setTempPwUser(u)} style={{color:'#f59e0b'}}><Key size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length===0 && <tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--text-secondary)'}}>Nenhum usuário encontrado.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Novo Usuário ── */}
                {activeTab==='novo' && (
                    <div className="card" style={{padding:'2rem',maxWidth:700}}>
                        <h3 style={{marginBottom:'1.5rem'}}>Cadastrar Novo Usuário</h3>
                        <form onSubmit={handleSubmit}>
                            {formError && <div className="user-form-error">{formError}</div>}
                            <div className="form-grid">
                                <div className="form-group"><label>Nome Completo *</label><input className="form-control" value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Ex: João Silva" required/></div>
                                <div className="form-group"><label>Matrícula</label><input className="form-control" value={form.matricula} onChange={e=>setForm(p=>({...p,matricula:e.target.value}))} placeholder="Ex: 10042"/></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label>E-mail *</label><input type="email" className="form-control" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="joao@empresa.com" required/></div>
                                <div className="form-group"><label>Cargo</label><input className="form-control" value={form.cargo} onChange={e=>setForm(p=>({...p,cargo:e.target.value}))} placeholder="Ex: Analista"/></div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group"><label>Senha *</label>
                                    <div style={{position:'relative'}}>
                                        <input type={showPw?'text':'password'} className="form-control" value={form.senha} onChange={e=>setForm(p=>({...p,senha:e.target.value}))} placeholder="••••••••" style={{paddingRight:'2.5rem'}} required/>
                                        <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)'}}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                                    </div>
                                </div>
                                <div className="form-group"><label>Confirmar Senha *</label><input type={showPw?'text':'password'} className="form-control" value={form.confirmarSenha} onChange={e=>setForm(p=>({...p,confirmarSenha:e.target.value}))} placeholder="••••••••" required/></div>
                            </div>
                            <div className="form-group"><label>Nível de Acesso *</label>
                                <div className="user-nivel-toggle">
                                    <button type="button" className={`nivel-btn ${form.nivel==='admin'?'active-admin':''}`} onClick={()=>setForm(p=>({...p,nivel:'admin',paineis:[]}))}><Shield size={14}/> Admin — Acesso total</button>
                                    <button type="button" className={`nivel-btn ${form.nivel==='operador'?'active-op':''}`} onClick={()=>setForm(p=>({...p,nivel:'operador'}))}><User size={14}/> Operador — Por painel</button>
                                </div>
                            </div>
                            {form.nivel==='operador' && (
                                <div className="form-group"><label>Painéis Permitidos</label>
                                    <div className="user-panels-grid">
                                        {PANEL_KEYS.map(p=>(
                                            <label key={p.key} className={`panel-checkbox ${form.paineis.includes(p.key)?'checked':''}`}>
                                                <input type="checkbox" checked={form.paineis.includes(p.key)} onChange={()=>togglePanel(p.key)}/>{p.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div style={{display:'flex',gap:'1rem',justifyContent:'flex-end',marginTop:'1.5rem'}}>
                                <button type="button" className="btn btn-secondary" onClick={()=>{setForm(EMPTY_FORM);setFormError('');}}>Limpar</button>
                                <button type="submit" className="btn btn-primary"><UserPlus size={16}/> Cadastrar</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── Configurações Gerais ── */}
                {activeTab==='configuracoes' && (
                    <div className="card" style={{padding:'2rem',maxWidth:700}}>
                        <h3 style={{marginBottom:'1.5rem'}}>Configurações do Sistema</h3>
                        <div className="form-group">
                            <label>Tempo de Inatividade (minutos)</label>
                            <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginBottom:'0.5rem'}}>
                                Se o usuário ficar inativo por este tempo, o sistema fará o logoff automaticamente.
                            </p>
                            <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    style={{maxWidth: 150}}
                                    value={localTimeout} 
                                    onChange={e => {
                                        const val = parseInt(e.target.value, 10);
                                        if (val > 0) setLocalTimeout(val);
                                        else if (e.target.value === '') setLocalTimeout('');
                                    }}
                                    min="1"
                                />
                                <button className="btn btn-primary" onClick={() => {
                                    if (localTimeout > 0) {
                                        requireAdminPassword(() => {
                                            updateInactivityTimeout(localTimeout);
                                        });
                                    }
                                }}>
                                    <Save size={16}/> Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {editingUser && <EditModal user={editingUser} onClose={()=>setEditingUser(null)} onSave={(id, u) => requireAdminPassword(() => editUser(id, u))}/>}
            {tempPwUser  && <TempPwModal  user={tempPwUser}  onClose={()=>setTempPwUser(null)}  onConfirm={(id, senha) => requireAdminPassword(() => resetUserPassword(id, senha))}/>}
            
            {pendingAction && (
                <ConfirmAdminPasswordModal
                    verifyAdminPassword={verifyAdminPassword}
                    onClose={() => setPendingAction(null)}
                    onConfirm={() => {
                        pendingAction();
                        setPendingAction(null);
                    }}
                />
            )}
        </>
    );
}
