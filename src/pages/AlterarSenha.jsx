import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../contexts/UserContext';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export default function AlterarSenha() {
    const { currentUser, changeOwnPassword } = useUsers();
    const navigate = useNavigate();

    const [nova,      setNova]      = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [show,      setShow]      = useState(false);
    const [error,     setError]     = useState('');

    const handleSubmit = e => {
        e.preventDefault();
        setError('');
        if (nova.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
        if (nova !== confirmar) { setError('As senhas não coincidem.'); return; }
        changeOwnPassword(nova);
        navigate('/home');
    };

    return (
        <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="text-center mb-2">
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <KeyRound size={28} color="white" />
                    </div>
                    <h2>Alterar Senha</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Olá, <strong>{currentUser?.nome}</strong>!<br/>
                        Você está usando uma senha temporária. Por segurança, defina uma nova senha para continuar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                    <div className="form-group">
                        <label>Nova Senha</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={show ? 'text' : 'password'}
                                className="form-control"
                                value={nova}
                                onChange={e => setNova(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                style={{ paddingRight: '2.5rem' }}
                                required
                            />
                            <button type="button" onClick={() => setShow(p => !p)}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirmar Nova Senha</label>
                        <input
                            type={show ? 'text' : 'password'}
                            className="form-control"
                            value={confirmar}
                            onChange={e => setConfirmar(e.target.value)}
                            placeholder="Repita a nova senha"
                            required
                        />
                    </div>

                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.75rem', fontSize: '0.875rem', color: '#dc2626', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#f59e0b', borderColor: '#f59e0b' }}>
                        <KeyRound size={16} /> Definir Nova Senha
                    </button>
                </form>
            </div>
        </div>
    );
}
