import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPw,   setShowPw]   = useState(false);
    const [error,    setError]    = useState('');

    const { login } = useAuth();
    const navigate  = useNavigate();

    const handleSubmit = e => {
        e.preventDefault();
        setError('');
        const result = login(email, password);
        if (result.success) {
            navigate(result.redirect);
        } else {
            setError(result.reason === 'inactive'
                ? 'Usuário inativo. Contate o administrador.'
                : 'E-mail ou senha inválidos.');
        }
    };

    return (
        <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="text-center mb-2">
                    <Wrench size={48} style={{ color: 'var(--primary-color)' }} />
                    <h2 className="mt-1">Gestão Ferramental</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Faça login para acessar o sistema</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-4">
                    <div className="form-group">
                        <label>E-mail</label>
                        <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
                    </div>
                    <div className="form-group">
                        <label>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showPw ? 'text' : 'password'} className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: '2.5rem' }} required />
                            <button type="button" onClick={() => setShowPw(p => !p)}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.75rem', fontSize: '0.875rem', color: '#dc2626', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Entrar</button>
                </form>
            </div>
        </div>
    );
}
