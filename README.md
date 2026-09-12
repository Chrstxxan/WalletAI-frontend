# WalletAI — App (Frontend)

Aplicativo mobile de gestão financeira pessoal com recursos de IA, desenvolvido em React Native com Expo como projeto universitário. Disponível para iOS e Android a partir de uma única base de código.

## Tecnologias

- **React Native + Expo** (Expo Router — navegação baseada em arquivos)
- **React Native Paper** — biblioteca de componentes de UI (Material Design 3)
- **expo-blur** — efeito de vidro (glassmorphism), base do estilo visual do app
- **expo-secure-store** — armazenamento seguro do token de autenticação

## Design

O app segue um estilo visual **"liquid glass"**, inspirado no design mais recente da Apple, com tema escuro e paleta verde/preto:

- Fundo: `#000000`
- Cor primária: `#1f8055`
- Componentes com efeito de vidro (blur + transparência) através do componente reutilizável `GlassCard`

## Pré-requisitos

- Node.js instalado
- App **Expo Go** instalado no celular (iOS ou Android)
- Backend do WalletAI rodando (veja o repositório `walletai-backend`)

## Configuração

1. Clone o repositório e instale as dependências:
   ```
   npm install
   ```

2. Configure o endereço da API em `src/services/api.ts`, apontando para o IP local da máquina rodando o backend:
   ```typescript
   const API_URL = 'http://SEU_IP_LOCAL:3000';
   ```
   > Celular e computador precisam estar na mesma rede Wi-Fi.

3. Inicie o projeto:
   ```
   npx expo start
   ```
   Escaneie o QR code exibido no terminal com o app Expo Go.

## Estrutura do projeto

```
walletai/
└── src/
    ├── app/                # Telas (rotas por arquivo, via Expo Router)
    │   ├── _layout.tsx     # Layout raiz (tema + navegação)
    │   ├── index.tsx       # Tela de Login
    │   ├── register.tsx    # Tela de Cadastro
    │   └── home.tsx        # Tela principal (pós-login)
    ├── components/
    │   └── GlassCard.tsx   # Componente reutilizável do efeito de vidro
    ├── constants/
    │   └── colors.ts       # Paleta de cores do app
    └── services/
        └── api.ts          # Chamadas HTTP para o backend
```

## Funcionalidades implementadas

- [x] Cadastro de usuário
- [x] Login com autenticação via JWT
- [x] Persistência de sessão (login automático em sessões futuras)
- [ ] Dashboard de gastos
- [ ] Cadastro e listagem de transações
- [ ] Categorização automática via IA
- [ ] Chat com IA sobre os gastos

## Gerando um build instalável (APK)

Para gerar um arquivo `.apk` instalável diretamente em um Android, sem precisar do Expo Go:
```
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```