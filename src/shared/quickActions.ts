/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { showToast } from './toast';
import { quickLogWater, undoQuickWater } from './quickLog';

/** Registra um copo com um toque e mostra o aviso com "Desfazer". Compartilhado pelo "+" e pelo painel inicial. */
export async function logWaterWithUndo(onChanged: () => void): Promise<void> {
  try {
    const result = await quickLogWater();
    onChanged();
    showToast(`💧 +${result.amountMl} ml · hoje ${result.totalTodayMl}/${result.goalMl} ml`, {
      actionLabel: 'Desfazer',
      onAction: async () => {
        await undoQuickWater(result.id);
        onChanged();
      },
    });
  } catch {
    showToast('Não foi possível registrar a água. Tente novamente.');
  }
}
