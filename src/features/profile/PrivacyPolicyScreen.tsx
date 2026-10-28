/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../shared/theme';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

export function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Última atualização: outubro de 2026</Text>

        <Section title="1. Quais dados coletamos">
          Coletamos os dados que você informa diretamente no app: nome, e-mail, idade, sexo, altura, peso e suas
          evoluções, medicamento e doses aplicadas, refeições e metas nutricionais, registros de água e atividade
          física, sintomas relatados e fotos de progresso corporal que você optar por adicionar.
        </Section>

        <Section title="2. Como usamos seus dados">
          Seus dados são usados exclusivamente para operar as funcionalidades do apliKI: calcular metas, mostrar seu
          histórico e progresso, enviar lembretes que você configurar e gerar relatórios para você exportar. Não
          usamos seus dados de saúde para publicidade.
        </Section>

        <Section title="3. Onde seus dados ficam armazenados">
          Seus dados são armazenados de forma segura no Firebase (Google Cloud), associados exclusivamente à sua
          conta. Cada pessoa só tem acesso aos seus próprios dados.
        </Section>

        <Section title="4. Compartilhamento com terceiros">
          Não vendemos nem compartilhamos seus dados pessoais ou de saúde com terceiros para fins comerciais. Quando
          você usa a análise de refeições por IA, apenas os nomes e as quantidades dos alimentos são enviados ao nosso
          servidor na Cloudflare e processados pela Anthropic (Claude) para calcular os nutrientes, sem seu nome,
          e-mail ou outros dados de saúde. A administração do apliKI vê apenas nome, e-mail, situação da assinatura,
          último acesso e quantidade de análises por IA, nunca seus registros de saúde.
        </Section>

        <Section title="5. Seus direitos">
          Você pode editar, exportar (PDF ou CSV) ou apagar seus dados a qualquer momento pelo app. Em Perfil →
          Privacidade e dados, "Apagar tudo e recomeçar" remove seus registros e "Excluir minha conta" apaga a conta
          e todos os dados de forma definitiva. Mesmo com a assinatura vencida, você continua podendo exportar seus dados
          e excluir sua conta.
        </Section>

        <Section title="6. Segurança">
          Você pode ativar o bloqueio por biometria (digital ou reconhecimento facial) nas configurações do app para
          proteger o acesso aos seus dados de saúde mesmo com o celular desbloqueado.
        </Section>

        <Section title="7. Aviso importante">
          O apliKI é uma ferramenta de acompanhamento pessoal e não substitui orientação médica, diagnóstico ou
          tratamento profissional. Consulte sempre um médico ou nutricionista antes de tomar decisões sobre sua
          saúde.
        </Section>

        <Text style={styles.footer}>
          Dúvidas sobre privacidade? Entre em contato pelo mesmo e-mail usado no cadastro do app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  updated: { ...typography.caption, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.xs },
  sectionText: { ...typography.small, lineHeight: 19 },
  footer: { ...typography.caption, marginTop: spacing.md, fontStyle: 'italic' },
});
