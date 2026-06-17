import React from 'react';
import Navbar from '../components/Navbar';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';

export default function Embalagem() {
    const navigate = useNavigate();

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Embalagem' }]} />
            <div className="container animate-fade-in">
                <div className="flex items-center gap-2 mb-6">
                    <Link to="/home" className="btn btn-icon"><ArrowLeft /></Link>
                    <h2>Selecione o Equipamento - Embalagem</h2>
                </div>
                
                <div className="dashboard-grid mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    <div 
                        className="dashboard-card"
                        onClick={() => navigate('/embalagem/bpf5-50')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card-icon" style={{ background: 'var(--primary-color)' }}>
                            <Package size={24} color="white" />
                        </div>
                        <h3>BPF5-50</h3>
                        <p>Acessar entrada, saída e histórico da BPF5-50.</p>
                    </div>

                    <div 
                        className="dashboard-card"
                        style={{ opacity: 0.7, cursor: 'not-allowed' }}
                    >
                        <div className="card-icon" style={{ background: 'var(--text-secondary)' }}>
                            <Package size={24} color="white" />
                        </div>
                        <h3>MEDISEAL <span style={{ fontSize: '0.7rem', background: 'var(--warning-color)', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>EM BREVE</span></h3>
                        <p>Módulo em desenvolvimento.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
