# Como rodar o Bora! App localmente (Windows)

Este guia leva do zero até o sistema funcionando, com banco de dados, API e interface.

## 1. Pré-requisitos (instalar uma vez)

| Programa | Versão | Para quê |
|---|---|---|
| Docker Desktop | atual | Sobe o PostgreSQL 16 + PostGIS em um container |
| Node.js | 20 ou superior (LTS) | Roda a API e a interface |
| Git (opcional) | atual | Baixar ou atualizar o projeto |

Antes de começar, abra o Docker Desktop e espere o ícone ficar verde ("Engine running").

Atenção: se você tiver um PostgreSQL instalado no Windows usando a porta 5432, pare o serviço dele ou altere a porta no `docker-compose.yml`. Duas instalações na mesma porta causam falhas de conexão.

## 2. Caminho rápido (recomendado)

Na pasta do projeto, dê dois cliques em **`INICIAR_BORA_APP.bat`**.

O script:
1. sobe o banco no Docker;
2. espera o banco ficar pronto;
3. cria o arquivo `server\.env` (se não existir) e instala as dependências na primeira vez;
4. cria as tabelas e carrega os dados de exemplo de Franca/SP;
5. abre a API em `http://localhost:3333` e a interface em `http://localhost:5173`.

Na primeira execução, a instalação pode levar alguns minutos.

## 3. Passo a passo manual (se preferir ou se o atalho falhar)

Abra um terminal (PowerShell) na pasta do projeto.

```powershell
# 1) Banco de dados
docker compose up -d

# 2) Configuração da API (só na primeira vez)
copy server\.env.example server\.env

# 3) Dependências
cd server
npm install
cd ..\client
npm install
cd ..

# 4) Tabelas e dados de exemplo
cd server
npm run db:setup

# 5) Subir a API (deixe esta janela aberta)
npm run dev
```

Em outra janela do PowerShell:

```powershell
cd caminho\do\projeto\client
npm run dev
```

Acesse **http://localhost:5173**.

## 4. Verificar se está tudo funcionando

Com a API rodando, execute na pasta `server`:

```powershell
npm run smoke
```

O teste cadastra um organizador e um atleta, cria uma partida, faz a solicitação, aprova, envia mensagem no mural, encerra, avalia e exclui a partida. Depois confere no banco de dados que cada passo foi gravado. Se terminar com `FLUXO COMPLETO OK`, o sistema está 100% funcional.

Contas de demonstração (já criadas pelo `db:setup`), todas com a senha `Senha@123`:
- `renata@boraapp.com.br`
- `leonardo@boraapp.com.br`

Para criar uma conta nova, use a tela de cadastro. O código de confirmação aparece no terminal da API, pois não há envio de e-mail neste ambiente.

## 5. Comandos úteis

| Comando (pasta `server`) | O que faz |
|---|---|
| `npm run db:setup` | Cria/atualiza as tabelas e recarrega os dados de exemplo. É seguro rodar de novo. |
| `npm run db:reset` | Apaga TODOS os dados e recria o banco do zero. Use com cuidado. |
| `npm run smoke` | Teste ponta a ponta contra a API em execução. |
| `npm test` | Testes unitários (não precisam de banco). |

Para ver o banco: execute `ABRIR_BANCO_DADOS.bat` ou `docker exec -it bora_app_postgres psql -U postgres -d bora_app_db`.

## 6. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `[ERRO BANCO] Não foi possível conectar ao PostgreSQL` na API | Docker parado ou banco ainda subindo | Espere o Docker ficar pronto e rode `docker compose up -d` novamente |
| `[ERRO BANCO] Tabelas ausentes` | Banco criado sem as tabelas | `npm run db:setup` |
| `password authentication failed` | `DATABASE_URL` diferente da senha do Docker | Confira `server\.env`: deve ser `postgres://postgres:524231@localhost:5432/bora_app_db` |
| `port is already allocated` no Docker | Outro PostgreSQL usa a porta 5432 | Pare o outro PostgreSQL ou troque `5432:5432` por `5433:5432` no `docker-compose.yml` e ajuste a `DATABASE_URL` |
| `Cannot find module` ou `ts-node-dev: not found` | Dependências não instaladas | `npm install` na pasta `server` ou `client` |
| Partida ou solicitação some ao reiniciar a API | Gravação caiu no modo de contingência (banco fora do ar) | Procure por `[ERRO BANCO]` no terminal da API e corrija a conexão com o banco |
| Tela de login carrega mas nada acontece | API não está rodando | Confirme `http://localhost:3333/health` no navegador |

Os avisos `Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED` no console do navegador, quando relacionados a Google Fonts ou mapas, não impedem o funcionamento.

## 7. Login com Google

O botão "Continuar com Google" só aparece quando a chave do cliente está configurada. A chave precisa ser criada na **sua** conta Google; ela não pode ser gerada pelo sistema.

1. Acesse https://console.cloud.google.com e crie um projeto (ex.: "Bora App").
2. Em **APIs e serviços > Tela de consentimento OAuth**, escolha o tipo **Externo**, preencha nome do app ("Bora! App") e e-mail de suporte. Em **Usuários de teste**, adicione o seu Gmail.
3. Em **APIs e serviços > Credenciais > Criar credenciais > ID do cliente OAuth**, escolha o tipo **Aplicativo da Web**.
4. Em **Origens JavaScript autorizadas**, adicione exatamente `http://localhost:5173`.
5. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`).
6. Configure as duas variáveis com o mesmo valor:
   - `server\.env`: `GOOGLE_CLIENT_ID=<seu ID do cliente>`
   - `client\.env` (copie de `client\.env.example` se ainda não existir): `VITE_GOOGLE_CLIENT_ID=<seu ID do cliente>`
7. Reinicie a API e o front-end (`npm run dev` nas duas pastas). O Vite só lê `.env` na inicialização.

Sobre a validação pelo Google:

- Enquanto o app estiver em modo **Testing**, só entram as contas listadas em "Usuários de teste" (até 100) e a tela de consentimento mostra o aviso "app não verificado". Isso é comportamento do Google, não erro do sistema.
- Para liberar o login a qualquer pessoa, é preciso publicar o app e passar pela **verificação OAuth** do Google. Ela exige um domínio seu verificado no Search Console, página inicial pública e a Política de Privacidade publicada em endereço próprio (há um rascunho em `landing-page\politica-privacidade.html`, com campos a preencher). O app pede apenas os escopos `openid`, `email` e `profile`.
- O servidor confere o token do Google (audiência, emissor, validade e e-mail verificado) antes de criar ou acessar a conta.

Erros comuns no login com Google:

| Sintoma | Causa provável | Solução |
|---|---|---|
| `origin_mismatch` ou `invalid_client` na janela do Google | Origem não cadastrada ou Client ID diferente | Confira `http://localhost:5173` nas origens e o mesmo ID nos dois `.env` |
| `Access blocked` / "app não concluiu a verificação" | Conta não está em Usuários de teste | Adicione o e-mail em Tela de consentimento > Usuários de teste |
| "Login com Google não está configurado no servidor" (503) | `GOOGLE_CLIENT_ID` vazio no `server\.env` | Preencha a variável e reinicie a API |
| "Token do Google inválido" (401) | ID do cliente do servidor diferente do front-end | Use o mesmo ID nas duas variáveis |
