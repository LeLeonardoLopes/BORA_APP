# 05 — Guia Frontend com Material UI (MUI) e Telas Hi-Fi — Bora! App

## 1. Identidade Visual e Tema Personalizado MUI

Para atender fielmente aos protótipos de alta fidelidade da documentação oficial, o tema do **Material UI (`@mui/material`)** é configurado da seguinte forma:

```typescript
// src/theme/boraTheme.ts
import { createTheme } from '@mui/material/styles';

export const boraTheme = createTheme({
  palette: {
    primary: {
      main: '#0066FF', // Azul Oficial Bora!
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFD700', // Amarelo de Destaque
      contrastText: '#000000',
    },
    background: {
      default: '#0066FF', // Fundo das telas de Splash / Login / Home
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      textTransform: 'uppercase',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      borderRadius: 12,
    },
  },
  shape: {
    borderRadius: 14,
  },
});
```

---

## 2. Especificação das Telas e Componentes MUI

| Tela | Componentes MUI Utilizados | Descrição Visual e Comportamento |
| :--- | :--- | :--- |
| **Splash & Login** | `Box`, `Container`, `TextField`, `Button`, `Typography` | Fundo azul sólido (`#0066FF`), logo 3D Bora! centralizado com contorno amarelo (`#FFD700`), campos com inputs brancos e botões sociais Google/Apple em destaque. |
| **Cadastro & OTP** | `TextField`, `Select`, `MenuItem`, `Button`, `Alert`, `Stack` | Formulário com Nome, CPF formatado, Seletor de Gênero (Feminino/Masculino/Outro - RN06), E-mail, Senha com medidor de requisitos e tela de confirmação OTP de 6 dígitos. |
| **Home Dashboard** | `AppBar`, `Card`, `Avatar`, `Button`, `Typography` | Saudação em destaque, Card de localização com GPS, clima e botões de ação rápida. |
| **Busca & Mapa (RN06)** | `Slider`, `Chip`, `TextField`, `IconButton`, `Leaflet` | Mapa interativo com raio deslizante (1 a 30 km), blindagem para usuárias mulheres (RN06) e exibição da nota em estrelas do organizador. |
| **Detalhes & Painel** | `Card`, `Badge`, `Chip`, `Button`, `Dialog` | Exibe vagas, formato (Avulso vs Amistoso), taxas (RN04) e painel estilo Uber para aprovação de atletas. |
| **Chat em Tempo Real** | `Paper`, `List`, `ListItem`, `TextField`, `IconButton` | Sala de chat instantânea via WebSocket com participantes confirmados. |
| **Avaliação Pós-Jogo** | `Rating`, `TextField`, `Button`, `Snackbar` | Componente de estrelas (1 a 5), feedback de conduta/pontualidade e recálculo dinâmico (RN05). |

---

## 3. Estrutura de Componentes no Frontend

```text
client/src/
├── assets/                  # Logos, bora_modelo.jpg, ícones esportivos
├── components/              # Componentes reutilizáveis
│   ├── BoraLogoSVG.tsx      # Logo Bora! 3D vetorizada com contorno amarelo
│   ├── MatchCard.tsx        # Card de partida com badges de esporte, gênero e vagas
│   ├── MatchChatModal.tsx   # Modal de chat da partida em tempo real (WebSocket)
│   ├── SocialAuthModal.tsx  # Modal de autenticação Google / Apple
│   ├── FullMapExplorer.tsx  # Mapa interativo com Leaflet e filtros espaciais
│   └── InteractiveMapPicker.tsx # Seletor de coordenadas GPS
├── screens/                 # Telas principais (AuthScreen, MyMatches, Profile, Rating)
├── services/                # api.ts, cepService, geocodingService, weatherService
├── theme/                   # boraTheme.ts (Paleta oficial Azul #0066FF e Amarelo #FFD700)
└── App.tsx                  # ThemeProvider MUI + Router
```
