/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { doseRepository, weightRepository, symptomRepository } from '../../db/repositories';
import { formatDateTimePt } from '../../shared/date';
import { APPLICATION_SITE_LABELS, SYMPTOM_TAG_LABELS } from '../../shared/labels';
import { User } from '../../types';

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Texto digitado pela pessoa (nome, observacoes) vai para o HTML do PDF: "<" ou "&" nao podem virar marcacao. */
function htmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function buildCsv(): Promise<string> {
  const [doses, weights, symptoms] = await Promise.all([
    doseRepository.listAll(),
    weightRepository.listAll(),
    symptomRepository.listAll(),
  ]);

  const lines: string[] = [];
  lines.push('Tipo,Data/Hora,Detalhe 1,Detalhe 2');
  doses.forEach((d) =>
    lines.push(['Dose', formatDateTimePt(new Date(d.dateTime)), `${d.doseMg}mg`, d.applicationSite ? APPLICATION_SITE_LABELS[d.applicationSite] : ''].map(csvEscape).join(','))
  );
  weights.forEach((w) => lines.push(['Peso', formatDateTimePt(new Date(w.dateTime)), `${w.weightKg}kg`, ''].map(csvEscape).join(',')));
  symptoms.forEach((s) =>
    lines.push(['Sintoma', formatDateTimePt(new Date(s.dateTime)), s.tags.map((t) => SYMPTOM_TAG_LABELS[t]).join('; '), s.notes ?? ''].map(csvEscape).join(','))
  );

  return lines.join('\n');
}

export async function exportCsv(): Promise<void> {
  const csv = await buildCsv();
  const file = new File(Paths.document, 'apliki-relatorio.csv');
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Exportar relatório (CSV)' });
  }
}

async function buildHtmlReport(user: User): Promise<string> {
  const [doses, weights, symptoms] = await Promise.all([
    doseRepository.listAll(),
    weightRepository.listAll(),
    symptomRepository.listAll(),
  ]);

  const doseRows = doses
    .map((d) => `<tr><td>${formatDateTimePt(new Date(d.dateTime))}</td><td>${d.doseMg}mg</td><td>${d.applicationSite ? APPLICATION_SITE_LABELS[d.applicationSite] : '-'}</td></tr>`)
    .join('');
  const weightRows = weights.map((w) => `<tr><td>${formatDateTimePt(new Date(w.dateTime))}</td><td>${w.weightKg}kg</td></tr>`).join('');
  const symptomRows = symptoms
    .map((s) => `<tr><td>${formatDateTimePt(new Date(s.dateTime))}</td><td>${s.tags.map((t) => SYMPTOM_TAG_LABELS[t]).join(', ')}</td><td>${htmlEscape(s.notes ?? '')}</td></tr>`)
    .join('');

  return `
    <html>
      <head><meta charset="utf-8" /><style>
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #1F2933; }
        h1 { font-size: 20px; } h2 { font-size: 16px; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        td, th { border-bottom: 1px solid #E7EBEE; padding: 6px 8px; font-size: 12px; text-align: left; }
        .meta { color: #8A94A0; font-size: 12px; }
      </style></head>
      <body>
        <h1>Relatório de acompanhamento — ${htmlEscape(user.name)}</h1>
        <p class="meta">Peso inicial: ${user.startWeightKg ?? '-'}kg · Peso atual: ${user.currentWeightKg ?? '-'}kg · Meta: ${user.goalWeightKg ?? '-'}kg</p>

        <h2>Histórico de doses</h2>
        <table><tr><th>Data</th><th>Dose</th><th>Local</th></tr>${doseRows || '<tr><td colspan="3">Sem registros</td></tr>'}</table>

        <h2>Histórico de peso</h2>
        <table><tr><th>Data</th><th>Peso</th></tr>${weightRows || '<tr><td colspan="2">Sem registros</td></tr>'}</table>

        <h2>Sintomas relatados</h2>
        <table><tr><th>Data</th><th>Tags</th><th>Observações</th></tr>${symptomRows || '<tr><td colspan="3">Sem registros</td></tr>'}</table>

        <p class="meta" style="margin-top: 24px;">Gerado pelo app apliKI. Esta é uma ferramenta de acompanhamento pessoal e não substitui orientação médica.</p>
      </body>
    </html>
  `;
}

export async function exportPdf(user: User): Promise<void> {
  const html = await buildHtmlReport(user);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Exportar relatório (PDF)' });
  }
}
