import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useAuth } from './contexts/UserContext';
import { AssetProvider }   from './contexts/AssetContext';
import { CapexProvider }   from './contexts/CapexContext';
import { FollowUpProvider} from './contexts/FollowUpContext';
import { OrgProvider }     from './contexts/OrgContext';
import { TaskProvider }    from './contexts/TaskContext';
import { ManipulacaoProvider } from './contexts/ManipulacaoContext';
import { ColaboradoresProvider } from './contexts/ColaboradoresContext';
import { MovimentacoesManipulacaoProvider } from './contexts/MovimentacoesManipulacaoContext';
import { ColaboradoresCompressaoProvider } from './contexts/ColaboradoresCompressaoContext';
import { MovimentacoesCompressaoProvider } from './contexts/MovimentacoesCompressaoContext';
import { CompressaoProvider }  from './contexts/CompressaoContext';
import { EmbalagemProvider }   from './contexts/EmbalagemContext';
import { ColaboradoresEmbalagemProvider } from './contexts/ColaboradoresEmbalagemContext';
import { MovimentacoesEmbalagemProvider } from './contexts/MovimentacoesEmbalagemContext';
import { EspessuraProvider }   from './contexts/EspessuraContext';

import Login        from './pages/Login';
import Home         from './pages/Home';
import GestaoFerramental from './pages/GestaoFerramental';
import GestaoAtivos from './pages/GestaoAtivos';
import Capex        from './pages/Capex';
import FollowUp     from './pages/FollowUp';
import Organograma  from './pages/Organograma';
import GestaoTarefas from './pages/GestaoTarefas';
import CadastrosManipulacao from './pages/CadastrosManipulacao';
import CadastrosCompressao from './pages/CadastrosCompressao';
import CadastrosEmbalagem from './pages/CadastrosEmbalagem';
import GestaoEspessuras from './pages/GestaoEspessuras';
import Manipulacao      from './pages/Manipulacao';
import Compressao       from './pages/Compressao';
import Embalagem        from './pages/Embalagem';
import EmbalagemBPF550  from './pages/EmbalagemBPF550';
import Usuarios     from './pages/Usuarios';
import AlterarSenha from './pages/AlterarSenha';
import CadastroProdutosEspessura from './pages/CadastroProdutosEspessura';
import ListaProdutosEspessura from './pages/ListaProdutosEspessura';

function PrivateRoute({ children }) {
    const { currentUser } = useAuth();
    return currentUser ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
    const { currentUser } = useAuth();
    if (!currentUser) return <Navigate to="/login" />;
    if (currentUser.nivel !== 'admin') return <Navigate to="/home" />;
    return children;
}

function TempPwRoute({ children }) {
    const { currentUser } = useAuth();
    if (!currentUser) return <Navigate to="/login" />;
    return children;
}

export default function App() {
    return (
        <UserProvider>
            <AssetProvider>
                <CapexProvider>
                    <FollowUpProvider>
                        <TaskProvider>
                            <ManipulacaoProvider>
                                <ColaboradoresProvider>
                                    <MovimentacoesManipulacaoProvider>
                                        <CompressaoProvider>
                                            <ColaboradoresCompressaoProvider>
                                                <MovimentacoesCompressaoProvider>
                                                    <EmbalagemProvider>
                                                        <ColaboradoresEmbalagemProvider>
                                                            <MovimentacoesEmbalagemProvider>
                                                                <EspessuraProvider>
                                                                    <OrgProvider>
                                                                        <BrowserRouter>
                                                        <Routes>
                                            <Route path="/login"          element={<Login />} />
                                            <Route path="/alterar-senha"  element={<TempPwRoute><AlterarSenha /></TempPwRoute>} />
                                            <Route path="/home"           element={<PrivateRoute><Home /></PrivateRoute>} />
                                            <Route path="/gestao-ferramental" element={<PrivateRoute><GestaoFerramental /></PrivateRoute>} />
                                            <Route path="/gestao-ativos"  element={<PrivateRoute><GestaoAtivos /></PrivateRoute>} />
                                            <Route path="/capex"          element={<PrivateRoute><Capex /></PrivateRoute>} />
                                            <Route path="/follow-up"      element={<PrivateRoute><FollowUp /></PrivateRoute>} />
                                            <Route path="/organograma"    element={<PrivateRoute><Organograma /></PrivateRoute>} />
                                            <Route path="/gestao-tarefas" element={<PrivateRoute><GestaoTarefas /></PrivateRoute>} />
                                            <Route path="/cadastros-manipulacao" element={<PrivateRoute><CadastrosManipulacao /></PrivateRoute>} />
                                            <Route path="/cadastros-compressao" element={<PrivateRoute><CadastrosCompressao /></PrivateRoute>} />
                                            <Route path="/cadastros-embalagem" element={<PrivateRoute><CadastrosEmbalagem /></PrivateRoute>} />
                                            <Route path="/cadastro-produtos" element={<PrivateRoute><CadastroProdutosEspessura /></PrivateRoute>} />
                                            <Route path="/lista-produtos-espessura" element={<PrivateRoute><ListaProdutosEspessura /></PrivateRoute>} />
                                            <Route path="/gestao-espessuras" element={<PrivateRoute><GestaoEspessuras /></PrivateRoute>} />
                                            <Route path="/manipulacao"    element={<PrivateRoute><Manipulacao /></PrivateRoute>} />
                                            <Route path="/compressao"     element={<PrivateRoute><Compressao /></PrivateRoute>} />
                                            <Route path="/embalagem"      element={<PrivateRoute><Embalagem /></PrivateRoute>} />
                                            <Route path="/embalagem/bpf5-50" element={<PrivateRoute><EmbalagemBPF550 /></PrivateRoute>} />
                                            <Route path="/usuarios"       element={<AdminRoute><Usuarios /></AdminRoute>} />
                                            <Route path="*"               element={<Navigate to="/home" />} />
                                                        </Routes>
                                                                        </BrowserRouter>
                                                                    </OrgProvider>
                                                                </EspessuraProvider>
                                                            </MovimentacoesEmbalagemProvider>
                                                        </ColaboradoresEmbalagemProvider>
                                                    </EmbalagemProvider>
                                                </MovimentacoesCompressaoProvider>
                                            </ColaboradoresCompressaoProvider>
                                        </CompressaoProvider>
                                    </MovimentacoesManipulacaoProvider>
                                </ColaboradoresProvider>
                            </ManipulacaoProvider>
                        </TaskProvider>
                    </FollowUpProvider>
                </CapexProvider>
            </AssetProvider>
        </UserProvider>
    );
}
