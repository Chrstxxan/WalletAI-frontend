const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type CategoriaGasto = { categoria: string; valor: number };
type OrcamentoCategoria = { categoria: string; limite: number; gasto: number; percentualUsado: number; estourado: boolean };

type ReportInput = {
  userName: string;
  month: number;
  year: number;
  recebido: number;
  gasto: number;
  saldo: number;
  categorias: CategoriaGasto[];
  orcamentos: OrcamentoCategoria[];
};

export function buildMonthlyReportHtml(input: ReportInput): string {
  const { userName, month, year, recebido, gasto, saldo, categorias, orcamentos } = input;
  const totalCategorias = categorias.reduce((sum, c) => sum + c.valor, 0);
  const geradoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const linhasCategorias = categorias.length
    ? categorias
        .slice()
        .sort((a, b) => b.valor - a.valor)
        .map((c) => {
          const pct = totalCategorias > 0 ? Math.round((c.valor / totalCategorias) * 100) : 0;
          return `<tr><td>${c.categoria}</td><td>R$ ${formatMoney(c.valor)}</td><td>${pct}%</td></tr>`;
        })
        .join('')
    : '<tr><td colspan="3" class="empty">Nenhum gasto registrado neste mês</td></tr>';

  const orcamentosSection = orcamentos.length
    ? `
    <div class="section">
      <div class="section-title">Orçamento por categoria</div>
      <table>
        <tr><th>Categoria</th><th>Gasto</th><th>Limite</th><th>Uso</th></tr>
        ${orcamentos
          .map(
            (o) =>
              `<tr><td>${o.categoria}</td><td>R$ ${formatMoney(o.gasto)}</td><td>R$ ${formatMoney(o.limite)}</td><td class="${o.estourado ? 'negative' : ''}">${o.percentualUsado}%</td></tr>`
          )
          .join('')}
      </table>
    </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 32px; }
  h1 { color: #1f8055; font-size: 22px; margin: 0 0 4px 0; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 28px; }
  .section { margin-bottom: 26px; }
  .section-title { font-size: 15px; font-weight: 700; color: #1f8055; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: #666; font-weight: 600; padding: 6px 4px; border-bottom: 1px solid #e0e0e0; }
  td { padding: 7px 4px; border-bottom: 1px solid #f2f2f2; }
  .empty { color: #999; text-align: center; padding: 16px 4px; }
  .summary-grid { display: flex; gap: 14px; }
  .summary-box { flex: 1; border: 1px solid #e0e0e0; border-radius: 10px; padding: 14px; }
  .summary-label { color: #666; font-size: 12px; }
  .summary-value { font-size: 19px; font-weight: 800; margin-top: 6px; }
  .positive { color: #1f8055; }
  .negative { color: #d32f2f; }
  footer { margin-top: 36px; font-size: 11px; color: #999; text-align: center; }
</style>
</head>
<body>
  <h1>Relatório financeiro — WalletAI</h1>
  <div class="subtitle">${userName ? `${userName} · ` : ''}${MESES[month - 1]} de ${year} · gerado em ${geradoEm}</div>

  <div class="section">
    <div class="section-title">Resumo do mês</div>
    <div class="summary-grid">
      <div class="summary-box">
        <div class="summary-label">Recebido</div>
        <div class="summary-value positive">R$ ${formatMoney(recebido)}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Gasto</div>
        <div class="summary-value negative">R$ ${formatMoney(gasto)}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Saldo</div>
        <div class="summary-value ${saldo >= 0 ? 'positive' : 'negative'}">R$ ${formatMoney(saldo)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Gastos por categoria</div>
    <table>
      <tr><th>Categoria</th><th>Valor</th><th>% do total</th></tr>
      ${linhasCategorias}
    </table>
  </div>

  ${orcamentosSection}

  <footer>Gerado automaticamente pelo WalletAI</footer>
</body>
</html>`;
}
