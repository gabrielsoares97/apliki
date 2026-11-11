<p align="center">
  <img src="assets/logo.png" alt="apliKI" height="120" />
</p>

<h1 align="center">apliKI</h1>

<p align="center">
  Acompanhamento do tratamento semanal com GLP-1: dose, peso, água, nutrição com IA e treinos, num só lugar.
</p>

<p align="center">
  <strong>Código-fonte disponível · Uso exige assinatura do apliKI · <a href="LICENSE">Licença</a></strong>
</p>

> ⚠️ O apliKI é uma ferramenta de acompanhamento pessoal e **não substitui orientação médica**.

## Telas

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/login.jpg" alt="Tela de login do apliKI" width="240" /><br /><sub>Login</sub></td>
    <td align="center"><img src="docs/screenshots/inicio.jpg" alt="Tela inicial com progresso e próxima aplicação" width="240" /><br /><sub>Início</sub></td>
    <td align="center"><img src="docs/screenshots/peso.jpg" alt="Gráfico de evolução do peso e IMC" width="240" /><br /><sub>Peso</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/nutricao.jpg" alt="Diário de nutrição com calorias e macros" width="240" /><br /><sub>Nutrição</sub></td>
    <td align="center"><img src="docs/screenshots/refeicao-ia.jpg" alt="Registro de refeição com cálculo por IA" width="240" /><br /><sub>Refeição com IA</sub></td>
    <td align="center"><img src="docs/screenshots/treino.jpg" alt="Treinos e recuperação muscular" width="240" /><br /><sub>Treino</sub></td>
  </tr>
</table>

<sub>Imagens da versão web, com uma conta e dados fictícios. A aparência no celular pode variar um pouco.</sub>

---

## Este repositório é source-available, não open source

Você pode ver o código, fazer um fork e **personalizar o app do seu jeito** (cores, telas, textos, layout). Mas:

- o app **continua usando o servidor oficial do apliKI**: não dá para trocar o backend;
- **toda pessoa que usar precisa de uma assinatura ativa** do apliKI: 7 dias de teste grátis sem cartão, depois R$ 29,90/mês ou R$ 199,90/ano, assinados dentro do próprio app;
- não é permitido redistribuir, vender, publicar em lojas, fazer engenharia reversa do servidor nem usar IA para copiar ou reescrever a lógica do app.

Os detalhes estão em [LICENSE](LICENSE) e em [AI_POLICY.md](AI_POLICY.md).

O servidor do apliKI (regras de segurança, serviço de IA, painel administrativo e controle de assinaturas) **não faz parte deste repositório**. A assinatura é conferida no servidor: remover a tela de assinatura do app não libera o acesso.

## Funcionalidades

- **Início:** próxima dose com contagem regressiva, peso e IMC, água, calorias e macros, atividades, sequência de dias, conquistas e Elo da saúde.
- **Doses:** histórico, rodízio do local de aplicação, controle da caneta, lembretes de dose e de suplementos.
- **Peso:** gráfico de evolução, fotos de progresso na nuvem e montagem de antes e depois.
- **Nutrição:** diário por data, refeições favoritas e **análise de refeições por IA**.
- **Treinos:** biblioteca de exercícios, montagem de treinos, programas prontos, plano inteligente e recuperação muscular.
- **Perfil:** metas, notificações, sintomas, bloqueio por biometria, exportação em PDF e CSV.

## Stack

Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · React Navigation · Zustand · Firebase (Auth + Firestore) · expo-notifications.

## Rodando o seu fork

Pré-requisitos: Node.js 20+, npm e o app **Expo Go** no celular (ou um emulador).

```bash
npm install
npx expo start
```

Escaneie o QR code com o Expo Go. Entre com a sua conta do apliKI (ou crie uma: ela já vem com 7 dias de teste). Quando o teste ou a assinatura vencer, o app mostra a tela para assinar.

O login com Google usa um módulo nativo e a chave de assinatura do app oficial, então não funciona no Expo Go nem em builds próprios: no seu fork, entre com e-mail e senha.

Testes e verificação de tipos:

```bash
npm test
npx tsc --noEmit
```

## O que personalizar

| Quero mudar | Onde |
| --- | --- |
| Cores, espaçamentos, fontes | `src/shared/theme.ts` |
| Botões, cartões e outros componentes | `src/shared/components/` |
| Telas | `src/features/<área>/` |
| Abas e navegação | `src/navigation/RootNavigator.tsx` |
| Ícone, logo e splash | `assets/` e `app.json` |

Não altere `src/firebase/config.ts`, `src/firebase/api.ts`, `src/firebase/subscription.ts`, `src/firebase/billing.ts`, `src/store/useSubscriptionStore.ts`, `src/features/subscription/` nem `src/shared/subscriptionContact.ts`: eles ligam o app ao serviço oficial e à assinatura.

## Contribuindo

Pull requests com correções e melhorias de interface são bem-vindos. Ao enviar uma contribuição você concorda com a seção 2(d) da [licença](LICENSE).

## Assinatura e contato

Conheça e assine em [apliki.web.app](https://apliki.web.app). Para pedir autorização para algo que a licença não cobre: [github.com/gabrielsoares97](https://github.com/gabrielsoares97).
