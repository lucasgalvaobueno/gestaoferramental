import React, { useState } from 'react';
import { useColaboradores } from '../contexts/ColaboradoresContext';
import { Edit2, Trash2, History, X, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ColaboradoresManipulacao() {
    const { colaboradores, addColaborador, editColaborador, deleteColaborador } = useColaboradores();

    const [currentTab, setCurrentTab] = useState('cadastro');

    const [successMessage, setSuccessMessage] = useState('');
    const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };
    const [errorMessage, setErrorMessage] = useState('');
    const showError = (msg) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 3000); };
    
    // Form states
    const [cracha, setCracha] = useState('');
    const [nome, setNome] = useState('');
    const [matricula, setMatricula] = useState('');
    const [turno, setTurno] = useState('');

    const [itemToEdit, setItemToEdit] = useState(null);
    const [editCracha, setEditCracha] = useState('');
    const [editNome, setEditNome] = useState('');
    const [editMatricula, setEditMatricula] = useState('');
    const [editTurno, setEditTurno] = useState('');

    const [itemToDelete, setItemToDelete] = useState(null);

    const turnos = ['1º turno', '2º turno', '3º turno', 'ADM', '12 X 36 Noturno', '12 x 36 Diurno'];

    const handleMatriculaChange = (e, setter) => {
        const val = e.target.value.replace(/\D/g, '');
        setter(val);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (colaboradores.some(c => c.cracha === cracha)) {
            showError('Já existe um colaborador com esse crachá.');
            return;
        }
        addColaborador({ cracha, nome, matricula, turno });
        showSuccess('Colaborador cadastrado com sucesso!');
        setCracha(''); setNome(''); setMatricula(''); setTurno('');
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (colaboradores.some(c => c.cracha === editCracha && c.id !== itemToEdit.id)) {
            showError('Já existe outro colaborador com esse crachá.');
            return;
        }
        editColaborador(itemToEdit.id, { cracha: editCracha, nome: editNome, matricula: editMatricula, turno: editTurno });
        showSuccess('Colaborador atualizado!');
        setItemToEdit(null);
    };

    const startEdit = (c) => {
        setItemToEdit(c);
        setEditCracha(c.cracha);
        setEditNome(c.nome);
        setEditMatricula(c.matricula);
        setEditTurno(c.turno);
    };

    return (
        <>
        <div className="animate-fade-in">
            {successMessage && <div className="card bg-success text-white mb-4 flex items-center gap-2"><CheckCircle2 size={20}/> {successMessage}</div>}
            {errorMessage && <div className="card bg-danger text-white mb-4 flex items-center gap-2"><AlertCircle size={20}/> {errorMessage}</div>}
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
                <form onSubmit={handleSave} className="card p-6" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h3 className="mb-4">Cadastrar Colaborador</h3>
                    <div className="form-group">
                        <label>Número do Crachá</label>
                        <input type="password" required className="form-control" value={cracha} onChange={e => setCracha(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <input type="text" required className="form-control" value={nome} onChange={e => setNome(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Matrícula</label>
                        <input type="text" required className="form-control" value={matricula} onChange={e => handleMatriculaChange(e, setMatricula)} placeholder="Apenas números" />
                    </div>
                    <div className="form-group">
                        <label>Turno</label>
                        <select required className="form-control" value={turno} onChange={e => setTurno(e.target.value)}>
                            <option value="">Selecione...</option>
                            {turnos.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary mt-2">Salvar Colaborador</button>
                </form>
            )}

            {currentTab === 'lista' && (
                <div className="table-container bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Matrícula</th>
                                <th>Turno</th>
                                <th className="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {colaboradores.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-4 text-secondary">Nenhum colaborador cadastrado.</td></tr>
                            ) : (
                                colaboradores.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.nome}</td>
                                        <td>{c.matricula}</td>
                                        <td>{c.turno}</td>
                                        <td className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <button className="btn btn-icon" onClick={() => startEdit(c)} title="Editar"><Edit2 size={18} /></button>
                                                <button className="btn btn-icon text-danger" onClick={() => setItemToDelete(c)} title="Excluir"><Trash2 size={18} color="var(--danger-color)" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

            {/* Edit Modal */}
            {itemToEdit && (
                <div className="modal-overlay active" style={{ zIndex: 1000, padding: '1rem' }}>
                    <div className="modal-content" style={{ maxWidth: '800px', display: 'flex', gap: '2rem', maxHeight: '90vh', overflowY: 'auto', width: '100%' }}>
                        
                        <div style={{ flex: 1 }}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="m-0 flex items-center gap-2"><Edit2 size={20} /> Editar Colaborador</h3>
                                <button className="btn btn-icon" onClick={() => setItemToEdit(null)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdate}>
                                <div className="form-group">
                                    <label>Número do Crachá</label>
                                    <input type="password" required className="form-control" value={editCracha} onChange={e => setEditCracha(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Nome Completo</label>
                                    <input type="text" required className="form-control" value={editNome} onChange={e => setEditNome(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Matrícula</label>
                                    <input type="text" required className="form-control" value={editMatricula} onChange={e => handleMatriculaChange(e, setEditMatricula)} />
                                </div>
                                <div className="form-group">
                                    <label>Turno</label>
                                    <select required className="form-control" value={editTurno} onChange={e => setEditTurno(e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {turnos.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary mt-2 w-full flex justify-center"><Save size={18} className="mr-2"/> Salvar Alterações</button>
                            </form>
                        </div>

                        {/* Histórico Lateral */}
                        <div style={{ width: '300px', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                            <h4 className="flex items-center gap-2 mb-4 text-secondary"><History size={18} /> Histórico</h4>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {itemToEdit.historico?.map((h, i) => (
                                    <div key={i} style={{ fontSize: '0.85rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{h.acao}</div>
                                        <div className="text-secondary mt-1">{new Date(h.data).toLocaleString()}</div>
                                        <div className="text-secondary">Por: {h.usuario}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {itemToDelete && (
                <div className="modal-overlay active" style={{ zIndex: 1005 }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className="flex flex-col items-center justify-center mb-4 text-danger">
                            <Trash2 size={48} style={{ opacity: 0.8 }} />
                        </div>
                        <h3 className="mb-4">Confirmar Exclusão</h3>
                        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Deseja realmente excluir este colaborador? <br/>
                            <strong style={{ color: 'var(--text-color)' }}>{itemToDelete.nome}</strong>
                        </p>
                        <div className="flex justify-center gap-4 mt-2">
                            <button className="btn btn-secondary" onClick={() => setItemToDelete(null)}>Cancelar</button>
                            <button className="btn btn-danger" onClick={() => {
                                deleteColaborador(itemToDelete.id);
                                setItemToDelete(null);
                                showSuccess('Excluído com sucesso.');
                            }}>Sim, excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
