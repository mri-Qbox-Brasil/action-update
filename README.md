# action-update

Este repositório contém dois componentes:

1. **Workflow do GitHub Actions** que **atualiza um clone local** automaticamente quando há `push` na branch de origem. *(funcional)*
2. **CLI `meu-runner`** para instalar/configurar um GitHub Actions self-hosted runner. *(⚠️ em desenvolvimento / incompleto)*

---

## 1. Workflow — Update local repository

O workflow está em `.github/workflows/update-local-repo.yml`. Ele roda num **runner self-hosted Windows** e, a cada push na branch de origem, faz `fetch` + `checkout` + `pull --ff-only` no clone local apontado por `LOCAL_REPO_PATH`.

### Como funciona

1. Dispara em `push` em **qualquer branch**, mas o job só executa quando o push é na branch definida em `SOURCE_BRANCH` (fallback `main`). O filtro é feito no `if:` do job porque `on.push.branches` não aceita variáveis.
2. Roda num runner self-hosted com labels `self-hosted` e `windows`.
3. Tem `timeout-minutes: 5` para não ficar pendurado caso o git abra um prompt de credencial.
4. Valida a variável `LOCAL_REPO_PATH` (existe? tem `.git`?).
5. Marca o diretório como confiável (`git config --global --add safe.directory`, idempotente) para evitar o erro *"dubious ownership"* — o runner roda como `NETWORK SERVICE`, mas a pasta pertence a `Administrators`.
6. Autentica o `fetch`/`pull` do **repositório privado** usando o `GITHUB_TOKEN` do próprio workflow, injetado via header (`http.extraheader`) — o token **não** é gravado no `.git/config` do clone local.
7. Executa contra a branch de destino (`TARGET_BRANCH`, fallback `main`):
   - `git fetch origin <TARGET_BRANCH>`
   - `git checkout <TARGET_BRANCH>`
   - `git pull --ff-only origin <TARGET_BRANCH>`

### Pré-requisitos

- Repositório no GitHub com Actions habilitado.
- Máquina Windows para rodar como agente local (runner self-hosted).
- Git instalado na máquina do runner.
- Um clone local do repositório que será atualizado.

### Configuração (variáveis do repositório)

Em **Settings > Secrets and variables > Actions > Variables**:

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `LOCAL_REPO_PATH` | ✅ | — | Caminho absoluto do clone local (ex.: `D:\repos\meu-projeto`). Precisa existir, conter `.git` e ter permissão de leitura/escrita para o usuário/serviço do runner. |
| `SOURCE_BRANCH` | ❌ | `main` | Branch cujo `push` dispara a atualização. |
| `TARGET_BRANCH` | ❌ | `main` | Branch que será atualizada no clone local. |

> O `GITHUB_TOKEN` usado na autenticação é o token automático do workflow — não precisa configurar secret manualmente.

### Configurar o agente local (runner self-hosted)

1. No repositório: **Settings > Actions > Runners > New self-hosted runner**.
2. Selecione **Windows** e rode os comandos mostrados pelo GitHub na máquina local:
   - `config.cmd` (registro do runner)
   - `run.cmd` (execução manual) **ou** `svc install` + `svc start` (rodar como serviço — recomendado, mantém o agente disponível após reinício).
3. Confirme que o runner tem as labels `self-hosted` e `windows`.

### Teste de execução

1. Faça um commit e `push` na branch de origem (`SOURCE_BRANCH`).
2. Abra a aba **Actions** no GitHub.
3. Verifique a execução do workflow **Update local repository**.
4. Confirme no agente local se o repositório foi atualizado.

---

## 2. CLI `meu-runner` — 🚧 em desenvolvimento

> **Status:** em desenvolvimento. A CLI executa e o backend de autenticação já existe (ver seção 3), mas o fluxo completo depende de um GitHub OAuth App configurado. Ainda faltam itens de robustez (ver `ROADMAP.md`).

CLI para instalação automatizada de um GitHub Actions self-hosted runner.

### Pré-requisitos

- Node.js >= 18
- Backend rodando (ver seção 3), que expõe:
  - `GET /auth/github?sessionId=XYZ`
  - `GET /session/:sessionId`
  - `POST /runner/token`

### Instalação

```bash
npm install
```

### Uso

```bash
node src/index.js install owner/repo
```

Ou configure como executável:

```bash
npm link
meu-runner install owner/repo
```

#### Opções

```bash
meu-runner install owner/repo --name meu-runner --workdir _work --service --backend http://localhost:3000
```

- `--name`: Nome do runner (padrão: `runner-{timestamp}`)
- `--workdir`: Diretório de trabalho (padrão: `_work`)
- `--service`: Instala como serviço em vez de rodar em primeiro plano
- `--backend`: URL do backend (padrão: env `BACKEND_URL` ou `http://localhost:3000`)

> A `BACKEND_URL` também pode vir de um arquivo `.env` (via dotenv). O `--backend` tem precedência.

#### Remover o runner

```bash
meu-runner uninstall owner/repo
```

Remove o runner do GitHub (usando um remove-token emitido pelo backend) e apaga a pasta local `runner-*`.

### Fluxo

1. Gera um `sessionId` (UUID).
2. Abre o navegador para autenticação OAuth no GitHub.
3. Faz polling da sessão até a autorização (timeout de 2 min).
4. Obtém o token do runner via backend.
5. Baixa o runner oficial do GitHub.
6. Extrai os arquivos.
7. Configura o runner automaticamente.
8. Inicia o runner.

### Sistemas suportados

- Windows (x64)
- Linux (x64, arm64)
- macOS (x64, arm64)

---

## 3. Backend de autenticação

Serviço em `backend/` (Express) que a CLI consome para autenticar o usuário via OAuth do GitHub e emitir o **registration-token** do runner.

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/auth/github?sessionId=XYZ` | Registra a sessão e redireciona ao consentimento do GitHub. |
| `GET` | `/auth/github/callback` | Troca o código OAuth pelo access token e marca a sessão como `READY`. |
| `GET` | `/session/:sessionId` | Status da sessão (`PENDING` / `READY` / `ERROR`) — usado no polling da CLI. |
| `POST` | `/runner/token` | Body `{ sessionId, repo }` → `{ token }` (registration-token do runner). |
| `GET` | `/health` | Healthcheck. |

### Configuração

1. Crie um **GitHub OAuth App** em **Settings > Developer settings > OAuth Apps**.
   - **Authorization callback URL**: `<BASE_URL>/auth/github/callback`
2. Copie `backend/.env.example` para `backend/.env` e preencha `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.

### Executar

```bash
cd backend
npm install
npm start
```

> A sessão expira em 10 min; o token OAuth do usuário fica apenas em memória e não é persistido.
