let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart = null;

// Define data de hoje como padrão
document.getElementById('data').valueAsDate = new Date();

const receitasCategories = ['Salário', 'Freelance', 'Investimentos', 'Outros - Receita'];

document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const clickedButton = e.submitter;
    const tipo = clickedButton.dataset.tipo;
    
    addTransaction(tipo);
});

function addTransaction(tipo) {
    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const categoria = document.getElementById('categoria').value;
    const data = document.getElementById('data').value;
    const observacoes = document.getElementById('observacoes').value;

    const isReceita = receitasCategories.includes(categoria);
    const finalTipo = isReceita ? 'receita' : 'despesa';

    const transaction = {
        id: Date.now(),
        descricao,
        valor: finalTipo === 'despesa' ? -Math.abs(valor) : Math.abs(valor),
        categoria,
        data,
        observacoes,
        tipo: finalTipo
    };

    transactions.unshift(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    document.getElementById('transactionForm').reset();
    document.getElementById('data').valueAsDate = new Date();
    
    updateDashboard();
    renderTransactions();
    updateChart();
}

function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja deletar esta transação? 🥺')) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateDashboard();
        renderTransactions();
        updateChart();
    }
}

function updateDashboard() {
    const receitas = transactions
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);
    
    const despesas = Math.abs(transactions
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0));
    
    const saldo = receitas - despesas;

    document.getElementById('totalReceitas').textContent = formatCurrency(receitas);
    document.getElementById('totalDespesas').textContent = formatCurrency(despesas);
    document.getElementById('saldo').textContent = formatCurrency(saldo);

    const saldoTexto = document.getElementById('saldoTexto');
    if (saldo > 0) {
        saldoTexto.textContent = '✨ Você está indo bem!';
        saldoTexto.style.color = '#3da76a';
    } else if (saldo < 0) {
        saldoTexto.textContent = '💭 Atenção aos gastos';
        saldoTexto.style.color = '#ff6ba0';
    } else {
        saldoTexto.textContent = '💫 Em equilíbrio';
        saldoTexto.style.color = 'var(--text-secondary)';
    }
}

function renderTransactions() {
    const list = document.getElementById('transactionsList');
    
    if (transactions.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <p>Nenhuma transação ainda! ✨<br>Comece adicionando sua primeira entrada acima 💕</p>
            </div>
        `;
        return;
    }

    list.innerHTML = transactions.map(t => `
        <div class="transaction-item ${t.tipo}">
            <div class="transaction-info">
                <h4>${t.descricao}</h4>
                <div class="transaction-meta">
                    <span>📅 ${formatDate(t.data)}</span>
                    <span>🏷️ ${t.categoria}</span>
                </div>
                ${t.observacoes ? `<div class="transaction-meta"><span>📝 ${t.observacoes}</span></div>` : ''}
                <button class="btn-delete" onclick="deleteTransaction(${t.id})">🗑️ Remover</button>
            </div>
            <div class="transaction-value ${t.tipo}">
                ${formatCurrency(Math.abs(t.valor))}
            </div>
        </div>
    `).join('');
}

function updateChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    const categoryData = {};
    transactions.forEach(t => {
        const cat = t.categoria;
        if (!categoryData[cat]) categoryData[cat] = 0;
        categoryData[cat] += Math.abs(t.valor);
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    
    if (chart) {
        chart.destroy();
    }

    if (labels.length === 0) {
        return;
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#ff9dcd',
                    '#d8a7ff',
                    '#a7d8ff',
                    '#ffe5a7',
                    '#b5f5d1',
                    '#ffb8de',
                    '#c7e5ff',
                    '#ffd4a7'
                ],
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#5a4a6a',
                        padding: 15,
                        font: {
                            family: 'Quicksand',
                            size: 12,
                            weight: '600'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#5a4a6a',
                    bodyColor: '#5a4a6a',
                    borderColor: '#ffe0ef',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.label + ': ' + formatCurrency(context.parsed);
                        }
                    }
                }
            }
        }
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

function exportToExcel() {
    if (transactions.length === 0) {
        alert('Não há transações para exportar! 🌸');
        return;
    }

    const receitas = transactions.filter(t => t.tipo === 'receita')
        .map(t => ({
            Data: formatDate(t.data),
            Descrição: t.descricao,
            Categoria: t.categoria,
            Valor: Math.abs(t.valor),
            Observações: t.observacoes || ''
        }));

    const despesas = transactions.filter(t => t.tipo === 'despesa')
        .map(t => ({
            Data: formatDate(t.data),
            Descrição: t.descricao,
            Categoria: t.categoria,
            Valor: Math.abs(t.valor),
            Observações: t.observacoes || ''
        }));

    const totalReceitas = receitas.reduce((sum, r) => sum + r.Valor, 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.Valor, 0);
    const saldo = totalReceitas - totalDespesas;

    const wb = XLSX.utils.book_new();

    const resumoData = [
        ['CONTROLE FINANCEIRO MENSAL'],
        [''],
        ['Total de Receitas:', totalReceitas],
        ['Total de Despesas:', totalDespesas],
        ['Saldo:', saldo],
        [''],
        ['Data de Exportação:', new Date().toLocaleDateString('pt-BR')]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    if (receitas.length > 0) {
        const wsReceitas = XLSX.utils.json_to_sheet(receitas);
        XLSX.utils.book_append_sheet(wb, wsReceitas, 'Receitas');
    }

    if (despesas.length > 0) {
        const wsDespesas = XLSX.utils.json_to_sheet(despesas);
        XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');
    }

    const todasTransacoes = transactions.map(t => ({
        Data: formatDate(t.data),
        Tipo: t.tipo === 'receita' ? 'Receita' : 'Despesa',
        Descrição: t.descricao,
        Categoria: t.categoria,
        Valor: Math.abs(t.valor),
        Observações: t.observacoes || ''
    }));
    const wsTodas = XLSX.utils.json_to_sheet(todasTransacoes);
    XLSX.utils.book_append_sheet(wb, wsTodas, 'Todas Transações');

    const fileName = `controle-financeiro-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    alert('✅ Arquivo Excel exportado com sucesso! 💕');
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            let importedTransactions = [];
            
            if (workbook.SheetNames.includes('Todas Transações')) {
                const worksheet = workbook.Sheets['Todas Transações'];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                importedTransactions = jsonData.map(row => {
                    const isReceita = row.Tipo === 'Receita';
                    const dataStr = parseExcelDate(row.Data);
                    
                    return {
                        id: Date.now() + Math.random(),
                        descricao: row.Descrição || row.Descricao || '',
                        valor: isReceita ? Math.abs(row.Valor) : -Math.abs(row.Valor),
                        categoria: row.Categoria,
                        data: dataStr,
                        observacoes: row.Observações || row.Observacoes || '',
                        tipo: isReceita ? 'receita' : 'despesa'
                    };
                });
            } else {
                if (workbook.SheetNames.includes('Receitas')) {
                    const wsReceitas = workbook.Sheets['Receitas'];
                    const receitasData = XLSX.utils.sheet_to_json(wsReceitas);
                    
                    receitasData.forEach(row => {
                        const dataStr = parseExcelDate(row.Data);
                        importedTransactions.push({
                            id: Date.now() + Math.random(),
                            descricao: row.Descrição || row.Descricao || '',
                            valor: Math.abs(row.Valor),
                            categoria: row.Categoria,
                            data: dataStr,
                            observacoes: row.Observações || row.Observacoes || '',
                            tipo: 'receita'
                        });
                    });
                }
                
                if (workbook.SheetNames.includes('Despesas')) {
                    const wsDespesas = workbook.Sheets['Despesas'];
                    const despesasData = XLSX.utils.sheet_to_json(wsDespesas);
                    
                    despesasData.forEach(row => {
                        const dataStr = parseExcelDate(row.Data);
                        importedTransactions.push({
                            id: Date.now() + Math.random(),
                            descricao: row.Descrição || row.Descricao || '',
                            valor: -Math.abs(row.Valor),
                            categoria: row.Categoria,
                            data: dataStr,
                            observacoes: row.Observações || row.Observacoes || '',
                            tipo: 'despesa'
                        });
                    });
                }
            }
            
            if (importedTransactions.length > 0) {
                const confirmMsg = `Encontradas ${importedTransactions.length} transações no arquivo! ✨\n\nDeseja substituir todos os dados atuais?`;
                
                if (confirm(confirmMsg)) {
                    transactions = importedTransactions.sort((a, b) => new Date(b.data) - new Date(a.data));
                    localStorage.setItem('transactions', JSON.stringify(transactions));
                    
                    updateDashboard();
                    renderTransactions();
                    updateChart();
                    
                    alert(`✅ ${importedTransactions.length} transações importadas com sucesso! 💕`);
                }
            } else {
                alert('⚠️ Nenhuma transação encontrada no arquivo.');
            }
            
            event.target.value = '';
            
        } catch (error) {
            console.error('Erro ao importar:', error);
            alert('❌ Erro ao importar arquivo. Verifique se é um arquivo Excel válido.');
            event.target.value = '';
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function parseExcelDate(dateValue) {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
    }
    
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    }
    
    if (typeof dateValue === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
        return date.toISOString().split('T')[0];
    }
    
    try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {}
    
    return new Date().toISOString().split('T')[0];
}

// Inicializar
updateDashboard();
renderTransactions();
updateChart();
