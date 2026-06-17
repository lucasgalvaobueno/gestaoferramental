import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, Users } from 'lucide-react';
import ColaboradoresCompressao from '../components/ColaboradoresCompressao';
import MovimentacaoCompressaoAba from '../components/MovimentacaoCompressaoAba';

export default function Compressao() {
    const [currentTab, setCurrentTab] = useState('puncoes');

    const renderContent = () => {
        switch (currentTab) {
            case 'puncoes':
                return <MovimentacaoCompressaoAba categorias={['Compressão']} titulo="Punções" />;
            case 'formatos':
                return <MovimentacaoCompressaoAba categorias={['Encapsulamento']} titulo="Formatos Encapsulamento" />;
            case 'colaboradores':
                return <ColaboradoresCompressao />;
            default:
                return null;
        }
    };

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Compressão' }]} />
            <div className="container" style={{ position: 'relative', minHeight: '80vh' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link to="/home" className="btn btn-icon"><ArrowLeft /></Link>
                        <h2>Módulo de Compressão</h2>
                    </div>
                </div>

                <div className="tabs mb-4" style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '5px' }}>
                    <button className={`tab ${currentTab === 'puncoes' ? 'active' : ''}`} onClick={() => setCurrentTab('puncoes')} style={{ whiteSpace: 'nowrap' }}>
                        Entrada e Saída de Punções
                    </button>
                    <button className={`tab ${currentTab === 'formatos' ? 'active' : ''}`} onClick={() => setCurrentTab('formatos')} style={{ whiteSpace: 'nowrap' }}>
                        Entrada e Saída de Formatos Encapsulamento
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
