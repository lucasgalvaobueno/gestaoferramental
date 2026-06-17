import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import MovimentacaoEmbalagemBPF550Aba from '../components/MovimentacaoEmbalagemBPF550Aba';
import ColaboradoresEmbalagem from '../components/ColaboradoresEmbalagem';
import { ArrowLeft, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmbalagemBPF550() {
    const [currentTab, setCurrentTab] = useState('movimentacao');

    const renderContent = () => {
        switch (currentTab) {
            case 'movimentacao':
                return <MovimentacaoEmbalagemBPF550Aba />;
            case 'colaboradores':
                return <ColaboradoresEmbalagem />;
            default:
                return null;
        }
    };

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Embalagem', to: '/embalagem' }, { label: 'BPF5-50' }]} />
            <div className="container" style={{ position: 'relative', minHeight: '80vh' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/embalagem" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Módulo Embalagem - BPF5-50</h2>
                    </div>
                </div>

                <div className="tabs mb-4" style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '5px' }}>
                    <button className={`tab ${currentTab === 'movimentacao' ? 'active' : ''}`} onClick={() => setCurrentTab('movimentacao')} style={{ whiteSpace: 'nowrap' }}>
                        Entrada e Saída de Formatos
                    </button>
                    <button className={`tab ${currentTab === 'colaboradores' ? 'active' : ''}`} onClick={() => setCurrentTab('colaboradores')} style={{ whiteSpace: 'nowrap' }}>
                        <Users size={16} className="inline mr-1"/> Cadastro de Colaboradores
                    </button>
                </div>

                {renderContent()}
            </div>
        </>
    );
}
