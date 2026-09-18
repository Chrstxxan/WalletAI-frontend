# WalletAI — App (Frontend)

Aplicativo mobile de gestão financeira pessoal com recursos de IA, desenvolvido em React Native com Expo como projeto universitário. Disponível para iOS e Android a partir de uma única base de código.

## Tecnologias

- **React Native + Expo** (Expo Router — navegação baseada em arquivos, SDK 57)
- **React Native Paper** — biblioteca de componentes de UI (Material Design 3)
- **expo-blur** — efeito de vidro (glassmorphism), base do estilo visual do app
- **expo-secure-store** — armazenamento seguro do token de autenticação
- **expo-local-authentication** — bloqueio de tela com biometria/senha do aparelho
- **expo-print** + **expo-sharing** — exportação de relatório mensal em PDF
- **react-native-gifted-charts** + **react-native-svg** — gráficos do dashboard (incluindo um componente próprio de pizza 3D isométrica, `IsometricPieChart`)
- **react-native-safe-area-context** — respeito às áreas seguras do aparelho (notch, barra de gestos/navegação do Android)

## Design

O app segue um estilo visual **"liquid glass"**, inspirado no design mais recente da Apple, com tema escuro e paleta verde/preto:

- Fundo: `#000000`
- Cor primária: `#1f8055`
- Componentes com efeito de vidro (blur + transparência) através do componente reutilizável `GlassCard`
- Navbar inferior fixa com ícone central elevado para o assistente de IA ("Wally")

## Pré-requisitos

- Node.js instalado
- App **Expo Go** instalado no celular (iOS ou Android) — para desenvolvimento/testes
- Uma conta Expo (gratuita) caso queira gerar builds via EAS

## Configuração

1. Clone o repositório e instale as dependências:
   ```
   npm install
   ```

2. O app já vem configurado para falar com o **backend hospedado em produção** (Railway). Não é necessário nenhum passo extra para rodar contra ele.

   Caso você queira rodar o seu **próprio backend localmente** (veja o repositório `walletai-backend`) durante o desenvolvimento, altere `API_URL` em `src/services/api.ts` para o IP local da máquina rodando o backend:
   ```typescript
   const API_URL = 'http://SEU_IP_LOCAL:3000';
   ```
   > Nesse caso, celular e computador precisam estar na mesma rede Wi-Fi.

3. Inicie o projeto:
   ```
   npx expo start
   ```
   Escaneie o QR code exibido no terminal com o app Expo Go.

## Estrutura do projeto

```
walletai/
└── src/
    ├── app/                        # Telas (rotas por arquivo, via Expo Router)
    │   ├── _layout.tsx             # Layout raiz (tema, bloqueio de tela)
    │   ├── index.tsx               # Splash animada (decide login/home, checa virada de mês)
    │   ├── login.tsx               # Login
    │   ├── register.tsx            # Cadastro
    │   ├── forgot-password.tsx     # Redefinir senha
    │   ├── onboarding.tsx          # Tutorial de primeiro acesso (carrossel)
    │   ├── app-lock.tsx            # Tela de bloqueio (biometria/senha do aparelho)
    │   ├── home.tsx                # Dashboard principal
    │   ├── transactions.tsx        # Listagem de transações (busca/filtro)
    │   ├── add-transaction.tsx     # Criar/editar transação
    │   ├── financial-profile.tsx   # Renda, despesas fixas, meta de economia
    │   ├── credit-cards.tsx        # Cartões de crédito + resumo do mês
    │   ├── add-credit-card.tsx     # Novo cartão de crédito
    │   ├── add-invoice-item.tsx    # Lançar item de fatura
    │   ├── card-invoices.tsx       # Todas as faturas de um cartão
    │   ├── benefit-wallets.tsx     # Carteiras de benefício (VR/VA/Combustível)
    │   ├── category-budgets.tsx    # Limite mensal por categoria
    │   ├── goals.tsx               # Metas financeiras
    │   ├── monthly-review.tsx      # Revisão mensal (marcar pago/recebido)
    │   ├── month-closing.tsx       # Fechamento automático do mês anterior
    │   ├── chat.tsx                # Chat com o assistente de IA ("Wally")
    │   └── profile.tsx             # Dados do usuário e configurações
    ├── components/
    │   ├── GlassCard.tsx           # Componente reutilizável do efeito de vidro
    │   ├── BottomNavBar.tsx        # Navbar inferior fixa
    │   ├── BackButton.tsx          # Botão de voltar flutuante
    │   └── IsometricPieChart.tsx   # Gráfico de pizza 3D isométrico feito à mão
    ├── constants/
    │   └── colors.ts               # Paleta de cores do app
    ├── services/
    │   └── api.ts                 # Chamadas HTTP para o backend
    └── utils/
        ├── appLock.ts              # Lógica do bloqueio de tela
        ├── postAuthRoute.ts        # Decide a tela de destino após login/desbloqueio
        ├── pdfReport.ts            # Geração do relatório mensal em PDF
        └── useBottomPadding.ts     # Hook para respeitar a área segura inferior do aparelho
```

## Funcionalidades implementadas

- [x] Cadastro, login e redefinição de senha
- [x] Persistência de sessão (login automático) e bloqueio de tela com biometria/senha do aparelho
- [x] Tutorial de primeiro acesso guiando o cadastro inicial
- [x] Dashboard com gráficos interativos (categorias, receitas x despesas, "disponível para gastar")
- [x] Transações: criar, editar, excluir, listar com busca (em todos os meses) e filtro por tipo, categorização automática via IA
- [x] Perfil financeiro: fontes de renda e despesas fixas (recorrentes ou pontuais), meta de economia, capital de giro
- [x] Cartões de crédito: múltiplos cartões, lançamento de itens por fatura (parcelado ou não), edição de itens já lançados
- [x] Carteiras de benefício de trabalho (VR/VA/Combustível): saldo controlado manualmente, com a IA validando se cada gasto faz sentido pro tipo de benefício
- [x] Orçamento mensal por categoria, com alerta ao se aproximar do limite
- [x] Metas financeiras com contribuição manual e barra de progresso
- [x] Revisão mensal e fechamento automático de mês (resumo do mês anterior)
- [x] Chat com IA ("Wally") usando function calling real — consulta o banco de dados, dá insights financeiros e nunca inventa números
- [x] Exportação de relatório mensal em PDF
- [x] Gerenciamento completo do perfil do usuário (nome, email, senha, segurança)
- [x] Navbar inferior fixa + botão de voltar em todas as telas

## Distribuição

O backend já está hospedado em produção (Railway), então o app funciona direto sem depender do computador do desenvolvedor.

### Gerando um build instalável (APK)

Para gerar um arquivo `.apk` instalável diretamente em um Android, sem precisar do Expo Go:
```
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

> **Atenção:** o link de download gerado pelo EAS expira depois de um tempo (verifique no [dashboard da Expo](https://expo.dev)). Para entregas com prazo, baixe o `.apk` e guarde uma cópia local — o arquivo em si, uma vez instalado, não expira.
