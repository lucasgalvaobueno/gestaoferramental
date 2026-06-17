export function calcularValorContabil(valorOriginal, tempoDepreciacaoAnos, dataInicioDepreciacao) {
    if (!valorOriginal || !tempoDepreciacaoAnos || !dataInicioDepreciacao) return Number(valorOriginal) || 0;

    const [year, month, day] = dataInicioDepreciacao.split('-');
    const dataInicio = new Date(year, month - 1, day);
    const dataAtual = new Date();
    
    const diffTime = dataAtual.getTime() - dataInicio.getTime();
    const diasDecorridos = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    const totalDiasDepreciacao = tempoDepreciacaoAnos * 365.25;
    
    if (diasDecorridos >= totalDiasDepreciacao) {
        return 0;
    }
    
    const depreciacaoDiaria = valorOriginal / totalDiasDepreciacao;
    const valorDepreciado = depreciacaoDiaria * diasDecorridos;
    
    const valorContabil = Math.max(0, valorOriginal - valorDepreciado);
    return Number(valorContabil.toFixed(2));
}

export function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function formatarData(dataIso) {
    if (!dataIso) return '';
    try {
        const [year, month, day] = dataIso.split('-');
        return `${day}/${month}/${year}`;
    } catch {
        return dataIso;
    }
}
