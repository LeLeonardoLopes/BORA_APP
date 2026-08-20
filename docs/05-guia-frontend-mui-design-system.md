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
| **Splash Screen** | `Box`, `Typography`, `Fade` | Fundo azul sólido com o logotipo estilizado centralizado (Bola + Luva + Mapa). |
| **Login Screen** | `Card`, `TextField`, `Button`, `Divider` | Inputs com bordas arredondadas, botão amarelo "LOGIN" e botões sociais Google/Apple. |
| **Cadastro** | `TextField`, `Button`, `Checkbox`, `Typography` | Formulário limpo com validação de termos e política de privacidade. |
| **Home Dashboard** | `AppBar`, `Card`, `Avatar`, `Button`, `Typography` | Saudação em destaque ("OLÁ, MARIA!"), Card de localização com GPS e botões de ação rápida. |
| **Busca & Mapa** | `Slider`, `Chip`, `TextField`, `IconButton` | Seletor de raio deslizante (0 a 5 km com indicador visual) e filtro por tags de modalidades esportivas. |
| **Detalhes da Partida** | `Card`, `Badge`, `Chip`, `Button`, `Dialog` | Exibe vagas restantes em tempo real, organizador e botão "Solicitar Vaga". |
| **Avaliação Pós-Jogo** | `Rating`, `TextField`, `Button`, `Snackbar` | Componente de estrelas (1 a 5), campo opcional de comentário e confirmação visual. |

---

## 3. Estrutura de Componentes no Frontend

```text
client/src/
├── assets/                  # Logos, ícones esportivos e ilustrações
├── components/              # Componentes reutilizáveis
│   ├── MatchCard.tsx        # Card de partida com badges de esporte e vagas
│   ├── RadiusSlider.tsx     # Slider customizado MUI (0 a 5 km)
│   ├── RatingStars.tsx      # Componente de 1 a 5 estrelas
│   └── TopBar.tsx           # Barra superior com status do atleta
├── contexts/                # AuthContext (Sessão JWT) e LocationContext (GPS)
├── screens/                 # As 8 telas principais
├── services/                # api.ts (Axios com interceptors)
├── theme/                   # boraTheme.ts
└── App.tsx                  # ThemeProvider + Router
```
