import React, { useState } from 'react';
import { useColaboradoresCompressao } from '../contexts/ColaboradoresCompressaoContext';
import { Search, Plus, Edit2, Trash2, X, Info } from 'lucide-react';
import { useAuth } from '../contexts/UserContext';

export default function ColaboradoresCompressao() {
    const { colaboradores, addColaborador, editColaborador, deleteColaborador } = useColaboradoresCompressao();
    const { currentUser } = useAuth();
    
    const [currentTab, setCurrentTab] = useState('cadastro');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form states
    const [cracha, setCracha] = useState('');
    const [nome, setNome] = useState('');
    const [matricula, setMatricula] = useState('');
    const [turno, setTurno] = useState('1º turno');
    
    // Edit/History states
    const [itemToEdit, setItemToEdit] = useState(null);
    const [editForm, setEditForm] = useState({});
    
    const [itemToViewHistory, setItemToViewHistory] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [alertMsg, setAlertMsg] = useState(null);
    const [alertType, setAlertType] = useState('');

    const showSuccess = (msg) => {
        setAlertMsg(msg); setAlertType('success');
        setTimeout(() => setAlertMsg(null), 3000);
    };

    const showError = (msg) => {
        setAlertMsg(msg); setAlertType('error');
        setTimeout(() => setAlertMsg(null), 3000);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if(colaboradores.some(c => c.cracha === cracha)) {
            showError('Crachá já cadastrado.');
            return;
        }
        addColaborador({ cracha, nome, matricula, turno });
        showSuccess('Colaborador cadastrado com sucesso!');
        setCracha(''); setNome(''); setMatricula(''); setTurno('1º turno');
    };

    const openEdit = (colab) => {
        setItemToEdit(colab);
        setEditForm(colab);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        const crachaExists = colaboradores.find(c => c.cracha === editForm.cracha && c.id !== editForm.id);
        if (crachaExists) {
            showError('Este crachá já está em uso.');
            return;
        }
        editColaborador(editForm.id, {
            cracha: editForm.cracha,
            nome: editForm.nome,
            matricula: editForm.matricula,
            turno: editForm.turno
        });
        showSuccess('Colaborador editado com sucesso!');
        setItemToEdit(null);
    };

    const confirmDelete = () => {
        if(itemToDelete) {
            deleteColaborador(itemToDelete.id);
            showSuccess('Colaborador excluído.');
            setItemToDelete(null);
        }
    };

    const filteredList = colaboradores.filter(c => 
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.cracha.includes(searchTerm) ||
        c.matricula.includes(searchTerm)
    );

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
                <button 
                    onClick={() => setCurrentTab('cadastro')}
                    style={{
                        padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.85rem',
                        backgroundColor: currentTab === 'cadastro' ? '#ffffff' : 'transparent',
                        color: currentTab === 'cadastro' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        boxShadow: currentTab === 'cadastro' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}>
                    Novo Cadastro
                </button>
                <button 
                    onClick={() => setCurrentTab('lista')}
                    style={{
                        padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.85rem',
                        backgroundColor: currentTab === 'lista' ? '#ffffff' : 'transparent',
                        color: currentTab === 'lista' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        boxShadow: currentTab === 'lista' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}>
                    Colaboradores Cadastrados ({colaboradores.length})
                </button>
            </div>

            {currentTab === 'cadastro' && (
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                        <div className="form-group mb-0">
                            <label>Número do Crachá</label>
                            <input type="password" required className="form-control" value={cracha} onChange={e => setCracha(e.target.value)} />
                        </div>
                        <div className="form-group mb-0">
                            <label>Nome Completo</label>
                            <input type="text" required className="form-control" value={nome} onChange={e => setNome(e.target.value)} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-6">
                        <div className="form-group mb-0">
                            <label>Matrícula</label>
                            <input type="number" required className="form-control" value={matricula} onChange={e => setMatricula(e.target.value)} />
                        </div>
                        <div className="form-group mb-0">
                            <label>Turno</label>
                            <select className="form-control" required value={turno} onChange={e => setTurno(e.target.value)}>
                                <option value="1º turno">1º turno</option>
                                <option value="2º turno">2º turno</option>
                                <option value="3º turno">3º turno</option>
                                <option value="ADM">ADM</option>
                                <option value="12 X 36 Noturno">12 X 36 Noturno</option>
                                <option value="12 x 36 Diurno">12 X 36 Diurno</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full py-3 flex justify-center items-center gap-2">
                        <Plus size={20} /> Salvar Colaborador
                    </button>
                </form>
            )}

            {currentTab === 'lista' && (
                <div>
                    <div className="card mb-4 p-3 border shadow-sm bg-white">
                        <div className="form-group mb-0">
                            <div className="flex items-center relative">
                                <Search size={18} className="absolute text-secondary" style={{ left: '12px' }} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nome, crachá ou matrícula..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="form-control w-full" 
                                    style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Crachá</th>
                                    <th>Matrícula</th>
                                    <th>Turno</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center text-secondary py-4">Nenhum colaborador encontrado.</td></tr>
                                ) : (
                                    filteredList.map(c => (
                                        <tr key={c.id}>
                                            <td>{c.nome}</td>
                                            <td>{'*'.repeat(c.cracha.length || 5)}</td>
                                            <td>{c.matricula}</td>
                                            <td>{c.turno}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-icon" title="Editar" onClick={() => openEdit(c)}><Edit2 size={16} /></button>
                                                    <button className="btn btn-icon" title="Histórico" onClick={() => setItemToViewHistory(c)}><Info size={16} /></button>
                                                    <button className="btn btn-icon text-danger" title="Excluir" onClick={() => setItemToDelete(c)}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {/* MODALS */}
        {itemToEdit && (
            <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="m-0">Editar Colaborador</h3>
                        <button className="btn btn-icon" onClick={() => setItemToEdit(null)}><X /></button>
                    </div>
                    <form onSubmit={handleUpdate}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                            <div className="form-group mb-0">
                                <label>Número do Crachá</label>
                                <input type="password" required className="form-control" value={editForm.cracha} onChange={e => setEditForm({...editForm, cracha: e.target.value})} />
                            </div>
                            <div className="form-group mb-0">
                                <label>Nome Completo</label>
                                <input type="text" required className="form-control" value={editForm.nome} onChange={e => setEditForm({...editForm, nome: e.target.value})} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mb-4">
                            <div className="form-group mb-0">
                                <label>Matrícula</label>
                                <input type="number" required className="form-control" value={editForm.matricula} onChange={e => setEditForm({...editForm, matricula: e.target.value})} />
                            </div>
                            <div className="form-group mb-0">
                                <label>Turno</label>
                                <select className="form-control" required value={editForm.turno} onChange={e => setEditForm({...editForm, turno: e.target.value})}>
                                    <option value="1º turno">1º turno</option>
                                    <option value="2º turno">2º turno</option>
                                    <option value="3º turno">3º turno</option>
                                    <option value="ADM">ADM</option>
                                    <option value="12 X 36 Noturno">12 X 36 Noturno</option>
                                    <option value="12 x 36 Diurno">12 X 36 Diurno</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-full">Salvar Alterações</button>
                    </form>
                </div>
            </div>
        )}

        {itemToViewHistory && (
            <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                <div className="modal-content" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="m-0">Histórico - {itemToViewHistory.nome}</h3>
                        <button className="btn btn-icon" onClick={() => setItemToViewHistory(null)}><X /></button>
                    </div>
                    {itemToViewHistory.historico && itemToViewHistory.historico.length > 0 ? (
                        <div className="timeline">
                            {itemToViewHistory.historico.map((h, i) => (
                                <div key={i} className="mb-4 border-l-2 border-primary pl-4 relative">
                                    <div style={{ position: 'absolute', left: '-5px', top: 0, width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                                    <div className="text-sm text-secondary">{new Date(h.data).toLocaleString()} - <span className="font-bold text-primary">{h.usuario}</span></div>
                                    <div className="text-sm mt-1">{h.acao}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-secondary">Nenhum histórico disponível.</p>
                    )}
                </div>
            </div>
        )}

        {itemToDelete && (
            <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                <div className="modal-content" style={{ maxWidth: '400px', width: '100%' }}>
                    <h3 className="text-danger mb-4">Excluir Colaborador</h3>
                    <p>Tem certeza que deseja excluir <strong>{itemToDelete.nome}</strong>? Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-2 mt-6">
                        <button className="btn btn-secondary" onClick={() => setItemToDelete(null)}>Cancelar</button>
                        <button className="btn" style={{ background: 'var(--danger-color)', color: '#fff' }} onClick={confirmDelete}>Excluir Definitivamente</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
