import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useUsers } from '../contexts/UserContext';
import { ArrowLeft, Building2, ShoppingCart, GitMerge, FilePlus2, Users, LineChart, UserCog, CheckSquare } from 'lucide-react';

export default function GestaoFerramental() {
    const { currentUser } = useUsers();
    const isAdmin = currentUser?.nivel === 'admin';

    return (
        <>
            <Navbar breadcrumbs={[{ label: 'Painéis de acesso', to: '/home' }, { label: 'Gestão Ferramental' }]} />
            <div className="container animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                    <Link to="/home" className="btn btn-icon"><ArrowLeft /></Link>
                    <h2>Módulos</h2>
                </div>
                <div className="dashboard-grid mt-4">
                    <Link to="/gestao-ativos" className="dashboard-card">
                        <Building2 size={48} className="text-primary mb-2" />
                        <h3>Gestão de Ativos</h3>
                    </Link>
                    <Link to="/capex" className="dashboard-card">
                        <LineChart size={48} className="text-primary mb-2" />
                        <h3>CAPEX</h3>
                    </Link>
                    <Link to="/follow-up" className="dashboard-card">
                        <ShoppingCart size={48} className="text-primary mb-2" />
                        <h3>Follow-Up Requisição</h3>
                    </Link>
                    <Link to="/organograma" className="dashboard-card">
                        <GitMerge size={48} className="text-primary mb-2" />
                        <h3>Organograma</h3>
                    </Link>
                    <Link to="/gestao-tarefas" className="dashboard-card">
                        <CheckSquare size={48} className="text-primary mb-2" />
                        <h3>Atribuição de Tarefas</h3>
                    </Link>
                    <Link to="/cadastros-manipulacao" className="dashboard-card">
                        <FilePlus2 size={48} className="text-primary mb-2" />
                        <h3>Cadastros Manipulação</h3>
                    </Link>
                    <Link to="/cadastros-compressao" className="dashboard-card">
                        <FilePlus2 size={48} className="text-primary mb-2" />
                        <h3>Cadastros Compressão</h3>
                    </Link>
                    <Link to="/cadastros-embalagem" className="dashboard-card">
                        <FilePlus2 size={48} className="text-primary mb-2" />
                        <h3>Cadastros Embalagem</h3>
                    </Link>
                    <Link to="/cadastro-produtos" className="dashboard-card">
                        <FilePlus2 size={48} className="text-primary mb-2" />
                        <h3>Cadastro de produtos</h3>
                    </Link>
                    <div className="dashboard-card" onClick={() => alert('Em construção')}>
                        <FilePlus2 size={48} className="text-primary mb-2" />
                        <h3>Cadastros Não Sólidos</h3>
                    </div>
                    {isAdmin && (
                        <Link to="/usuarios" className="dashboard-card">
                            <UserCog size={48} style={{ color: 'var(--primary-color)' }} className="mb-2" />
                            <h3>Gerenciar Usuários</h3>
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}
