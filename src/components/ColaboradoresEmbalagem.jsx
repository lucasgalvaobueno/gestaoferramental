import React, { useState } from 'react';
import { useColaboradoresEmbalagem } from '../contexts/ColaboradoresEmbalagemContext';
import { useAuth } from '../contexts/UserContext';
import { Search, Plus, List, Trash2, X, CheckSquare } from 'lucide-react';

export default function ColaboradoresEmbalagem() {
    const { colaboradores, addColaborador, deleteColaborador } = useColaboradoresEmbalagem();
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.nivel === 'admin';

    const [currentTab, setCurrentTab] = useState('cadastro');
    const [nome, setNome] = useState('');
    const [matricula, setMatricula] = useState('');
    const [cracha, setCracha] = useState('');
    const [turno, setTurno] = useState('1º turno');
    const [searchTerm, setSearchTerm] = useState('');

    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        addColaborador({ nome, matricula, cracha, turno });
        setSuccessMessage('Colaborador cadastrado com sucesso!');
        setNome('');
        setMatricula('');
        setCracha('');
        setTurno('1º turno');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const colaboradoresFiltrados = colaboradores.filter(c => 
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.matricula.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.cracha.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="card animate-fade-in p-6">
            {successMessage && (
                <div className="mb-4 p-3 bg-success/10 border border-success text-success rounded flex items-center gap-2">
                    <CheckSquare size={18} /> {successMessage}
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
                <form onSubmit={handleSubmit} className="animate-fade-in max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="form-group mb-0">
                            <label>Nome do Colaborador</label>
                            <input type="text" required className="form-control" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João Silva" />
                        </div>
                        <div className="form-group mb-0">
                            <label>Matrícula</label>
                            <input type="text" required className="form-control" value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="Ex: 12345" />
                        </div>
                        <div className="form-group mb-0">
                            <label>Número do Crachá</label>
                            <input type="password" required className="form-control" value={cracha} onChange={e => setCracha(e.target.value)} placeholder="Aproxime o crachá do leitor" />
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
                <div className="animate-fade-in">
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
                        <table className="table m-0">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Matrícula</th>
                                    <th>Turno</th>
                                    <th>Data Cadastro</th>
                                    {isAdmin && <th className="text-center">Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {colaboradoresFiltrados.length === 0 ? (
                                    <tr><td colSpan={isAdmin ? "5" : "4"} className="text-center py-4 text-secondary">Nenhum colaborador encontrado.</td></tr>
                                ) : (
                                    colaboradoresFiltrados.map(c => (
                                        <tr key={c.id}>
                                            <td><strong>{c.nome}</strong></td>
                                            <td>{c.matricula}</td>
                                            <td>{c.turno}</td>
                                            <td>{new Date(c.dataCadastro).toLocaleDateString()}</td>
                                            {isAdmin && (
                                                <td className="text-center">
                                                    <button className="btn btn-icon text-danger" onClick={() => {
                                                        if(window.confirm('Excluir este colaborador?')) deleteColaborador(c.id);
                                                    }} title="Excluir"><Trash2 size={18} /></button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
