import { useMemo } from 'react';
import { useAssets } from '../contexts/AssetContext';
import { useFollowUp } from '../contexts/FollowUpContext';
import { useOrg } from '../contexts/OrgContext';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useManipulacao } from '../contexts/ManipulacaoContext';
import { useCompressao } from '../contexts/CompressaoContext';
import { useEmbalagem } from '../contexts/EmbalagemContext';

export function useNotifications() {
    const { currentUser } = useAuth();
    const { getAssetsByStatus } = useAssets();
    const { requisitions } = useFollowUp();
    const { nodes } = useOrg();
    const { tasks, updateTask } = useTasks();
    const { items: manipulacaoItems } = useManipulacao();
    const { items: compressaoItems } = useCompressao();
    const { items: embalagemItems } = useEmbalagem();

    const isAdmin = currentUser?.nivel === 'admin';

    const notifications = useMemo(() => {
        // 1. Ativos Imobilizados aguardando descarte (Admin only)
        const ativosPendentes = isAdmin ? getAssetsByStatus('aguardando_descarte') : [];

        // 2. Requisições em Atraso ou Sem Update (> 7 dias) (Admin only)
        const now = Date.now();
        const rcsAtrasadas = isAdmin ? requisitions.filter(req => {
            const lastUpdate = req.lastUpdateDate ? new Date(req.lastUpdateDate).getTime() : new Date(req.dataCriacao || now).getTime();
            const daysSinceUpdate = (now - lastUpdate) / (1000 * 3600 * 24);
            
            const isEmAtraso = req.status === 'Em atraso';
            const isSemUpdate = daysSinceUpdate > 7 && !['Concluído', 'Cancelado'].includes(req.status);
            
            return isEmAtraso || isSemUpdate;
        }) : [];

        // 3. Vagas em Aberto no Organograma (Admin only)
        const vagasAbertas = isAdmin ? nodes.filter(n => n.isOpen).map(vaga => {
            const dataAbertura = vaga.dataAbertura ? new Date(vaga.dataAbertura).getTime() : now;
            const diasEmAberto = Math.floor((now - dataAbertura) / (1000 * 3600 * 24));
            return {
                ...vaga,
                diasEmAberto
            };
        }) : [];

        // 4. Tarefas Atrasadas ou Próximas do Vencimento (<= 3 dias)
        const tarefasAtrasadasOuProximas = tasks.filter(t => {
            if (t.status === 'concluida' || t.responsavelId !== currentUser?.email) return false;
            if (!t.prazo) return false;
            
            const dueDate = new Date(`${t.prazo}T23:59:59`).getTime();
            const daysRemaining = (dueDate - now) / (1000 * 3600 * 24);
            return daysRemaining <= 3;
        });

        // 5. Novas Tarefas Atribuídas
        const novasTarefasAtribuidas = tasks.filter(t => {
            return t.responsavelId === currentUser?.email && !t.notificacaoLida && t.status !== 'concluida';
        });

        // 6. Itens Danificados na Manipulação
        const itensDanificadosManipulacao = isAdmin ? manipulacaoItems.filter(i => i.statusDanificado && i.status !== 'Obsoleto') : [];

        // 7. Conjuntos de Compressão com vida útil >= 70%
        const conjuntosCompressaoNoLimite = isAdmin ? compressaoItems.filter(i => {
            if(i.categoria === 'Compressão' && i.estimativaProducao) {
                return (i.comprimidosProduzidosTotais || 0) / i.estimativaProducao >= 0.7;
            }
            return false;
        }) : [];

        // 8. Itens Danificados na Embalagem
        const itensDanificadosEmbalagem = isAdmin ? embalagemItems.filter(i => i.statusDanificado && i.status !== 'Obsoleto') : [];

        const totalNotificacoes = ativosPendentes.length + rcsAtrasadas.length + vagasAbertas.length + tarefasAtrasadasOuProximas.length + novasTarefasAtribuidas.length + itensDanificadosManipulacao.length + conjuntosCompressaoNoLimite.length + itensDanificadosEmbalagem.length;

        return {
            ativosPendentes,
            rcsAtrasadas,
            vagasAbertas,
            tarefasAtrasadasOuProximas,
            novasTarefasAtribuidas,
            itensDanificadosManipulacao,
            itensDanificadosEmbalagem,
            conjuntosCompressaoNoLimite,
            totalNotificacoes,
            marcarTarefaComoLida: (id) => updateTask(id, { notificacaoLida: true })
        };
    }, [getAssetsByStatus, requisitions, nodes, tasks, currentUser, isAdmin, updateTask, manipulacaoItems, compressaoItems, embalagemItems]);

    return notifications;
}
