import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useEspessura } from '../contexts/EspessuraContext';
import { Search, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ListaProdutosEspessura() {
    const { produtos, deleteProduto } = useEspessura();
    const [cadastroSearch, setCadastroSearch] = useState('');

    const filteredProdutos = useMemo(() => {
        const q = cadastroSearch.toLowerCase();
        if (!q) return produtos;
        return produtos.filter(p => 
            (p.codigoPI && p.codigoPI.toLowerCase().includes(q)) ||
            (p.codigoPA && p.codigoPA.toLowerCase().includes(q)) ||
            (p.produtoPI && p.produtoPI.toLowerCase().includes(q)) ||
            (p.produtoPA && p.produtoPA.toLowerCase().includes(q))
        );
    }, [produtos, cadastroSearch]);

    const handleDelete = (id) => {
        if (window.confirm("Deseja realmente excluir este produto?")) {
            deleteProduto(id);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Navbar breadcrumbs={[
                { label: 'Painéis de acesso', to: '/home' }, 
                { label: 'Gestão Ferramental', to: '/gestao-ferramental' }, 
                { label: 'Cadastro de produtos', to: '/cadastro-produtos' },
                { label: 'Lista de produtos' }
            ]} />
            
            <div className="container mx-auto p-4 flex-1 flex flex-col" style={{ maxWidth: '100%' }}>
                <div className="flex items-center gap-2 mb-4">
                    <Link to="/cadastro-produtos" className="btn btn-icon"><ArrowLeft /></Link>
                    <h2 className="m-0 text-primary">Lista de Produtos Cadastrados</h2>
                </div>

                <div className="card p-6 shadow-sm flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div style={{ position: 'relative', width: '350px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input 
                                type="text" 
                                className="form-control m-0" 
                                placeholder="Buscar PI, PA ou Nome..." 
                                style={{ paddingLeft: '40px', fontSize: '1rem' }} 
                                value={cadastroSearch} 
                                onChange={e => setCadastroSearch(e.target.value)} 
                            />
                        </div>
                        <div className="text-secondary text-sm">
                            Mostrando {filteredProdutos.length} de {produtos.length} produtos
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
                        <table className="table w-full m-0" style={{ fontSize: '0.9rem' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>
                                <tr>
                                    <th>Código PI</th>
                                    <th>Código PA</th>
                                    <th>Produto PI</th>
                                    <th>Produto PA</th>
                                    <th style={{ textAlign: 'center' }}>Comprimido?</th>
                                    <th>Espessura (Mín - Máx)</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProdutos.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8 text-secondary">Nenhum produto encontrado.</td>
                                    </tr>
                                ) : (
                                    filteredProdutos.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td style={{ fontWeight: 600 }}>{p.codigoPI}</td>
                                            <td>{p.codigoPA}</td>
                                            <td>{p.produtoPI}</td>
                                            <td>{p.produtoPA}</td>
                                            <td style={{ textAlign: 'center' }}>{p.isComprimido ? <CheckCircle2 size={16} className="text-success inline-block" /> : <span className="text-secondary">-</span>}</td>
                                            <td>
                                                {p.isComprimido 
                                                    ? <span className="text-primary font-medium">{p.espessuraMin}mm - {p.espessuraMax}mm</span> 
                                                    : <span className="text-secondary opacity-50">N/A</span>
                                                }
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    className="btn btn-icon text-danger hover:bg-red-50" 
                                                    onClick={() => handleDelete(p.id)}
                                                    title="Excluir Produto"
                                                    style={{ padding: '0.4rem', border: 'none', backgroundColor: 'transparent' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
