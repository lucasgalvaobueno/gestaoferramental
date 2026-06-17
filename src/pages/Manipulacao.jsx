import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, Users, MoveRight, MoveLeft, Replace, Filter as FilterIcon } from 'lucide-react';
import ColaboradoresManipulacao from '../components/ColaboradoresManipulacao';
import MovimentacaoManipulacaoAba from '../components/MovimentacaoManipulacaoAba';

export default function Manipulacao() {
    const [currentTab, setCurrentTab] = useState('malhas');

    const renderContent = () => {
        switch (currentTab) {
            case 'malhas':
                return <MovimentacaoManipulacaoAba categorias={['Malhas', 'Tamises']} titulo="Malhas ou Tamises" />;
            case 'mangueiras':
                return <MovimentacaoManipulacaoAba categorias={['Mangueiras']} titulo="Mangueiras" />;
            case 'troca-mangueiras':
                return (
                    <div className="card p-6 animate-fade-in text-center">
                        <h3 className="mb-4 text-primary">Disponibilização e Troca de Mangueiras</h3>
                        <p className="text-secondary">Em construção</p>
                    </div>
                );
            case 'filtros':
                return <MovimentacaoManipulacaoAba categorias={['Filtros']} titulo="Filtros" />;
            case 'colaboradores':
                return <ColaboradoresManipulacao />;
            default:
                return null;
        }
    };

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Manipulação' }]} />
            <div className="container" style={{ position: 'relative', minHeight: '80vh' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/home" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Módulo de Manipulação</h2>
                    </div>
                </div>

                <div className="tabs mb-4" style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '5px' }}>
                    <button className={`tab ${currentTab === 'malhas' ? 'active' : ''}`} onClick={() => setCurrentTab('malhas')} style={{ whiteSpace: 'nowrap' }}>
                        Entrada e saída de Malhas ou Tamises
                    </button>
                    <button className={`tab ${currentTab === 'mangueiras' ? 'active' : ''}`} onClick={() => setCurrentTab('mangueiras')} style={{ whiteSpace: 'nowrap' }}>
                        Entrada e Saída de Mangueiras
                    </button>
                    <button className={`tab ${currentTab === 'troca-mangueiras' ? 'active' : ''}`} onClick={() => setCurrentTab('troca-mangueiras')} style={{ whiteSpace: 'nowrap' }}>
                        Disponibilização e Troca de Mangueiras
                    </button>
                    <button className={`tab ${currentTab === 'filtros' ? 'active' : ''}`} onClick={() => setCurrentTab('filtros')} style={{ whiteSpace: 'nowrap' }}>
                        Entrada e Saída de Filtros
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
