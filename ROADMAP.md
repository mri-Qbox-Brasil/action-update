# Roadmap — action-update

Documento de planejamento do projeto. Consolida o estado atual, os bugs conhecidos e o que falta implementar, organizado por prioridade.

---

## Visão geral

O projeto tem **dois componentes**:

| Componente | Estado | Descrição |
|---|---|---|
| **Workflow** `update-local-repo.yml` | ✅ Funcional | Atualiza um clone local via `push` num runner self-hosted Windows. |
| **CLI `meu-runner`** | 🔴 Não roda | Deveria instalar/configurar um self-hosted runner automaticamente. Trava por bugs e depende de um backend inexistente. |

A ideia final (inferida) é: a **CLI provisiona o runner** que depois **executa o workflow**. Hoje só o workflow funciona, assumindo um runner já instalado manualmente.

---

## Estado atual

**Versionado (commitado):** apenas `update-local-repo.yml` + `README.md`.

**Não versionado (untracked):** `package.json`, `src/` (a CLI), `.gitignore`, `ROADMAP.md`.

**Ausente por completo:** o backend de autenticação (`/auth/github`, `/session/:id`, `/runner/token`) que a CLI consome — não existe no repositório.

---

## Fase 0 — Bugs que impedem a CLI de rodar ✅ (concluída)

São erros que causavam crash imediato ou download inválido. Todos corrigidos; a CLI carrega e a URL de download do runner resolve (HTTP 200 verificado).

- [x] **`src/commands/install.js`** — `path` não importado → `ReferenceError`. Adicionado `import path from 'path'` (e removido `execSync` não usado).
- [x] **`src/services/runnerDownloader.js`** — `info()` usado sem importar → `ReferenceError`. Incluído no import.
- [x] **`src/services/runnerDownloader.js`** — `response.body.pipe(...)` não existe em `ReadableStream` (WHATWG). Trocado por `pipeline(Readable.fromWeb(response.body), ...)`.
- [x] **`src/utils/os.js`** — nome `actions-runner-<plat>-latest.<ext>` não existe (404). Agora resolve a versão real via `api.github.com/.../releases/latest` e monta o nome com ela.
- [x] **`--backend` morto** — `apiClient.js` resolve `BACKEND_URL` em tempo de chamada e `install.js` propaga a opção para `process.env.BACKEND_URL`.

## Fase 1 — Backend de autenticação ✅ (concluída)

Implementado em `backend/` (Express). Boot e endpoints validados via smoke test; o fluxo OAuth completo exige um GitHub OAuth App configurado.

- [x] Contrato dos endpoints definido (`/auth/github`, `/auth/github/callback`, `/session/:id`, `/runner/token`, `/health`) com status `PENDING`/`READY`/`ERROR`.
- [x] OAuth do GitHub e emissão do **registration token** (`POST /repos/{owner}/{repo}/actions/runners/registration-token`).
- [x] Store de sessões em memória com TTL (10 min).
- [x] Documentação (seção 3 do README + `.env.example`).

## Fase 2 — Robustez da CLI 🟡

- [ ] Suporte a `.env` (dotenv) — hoje `BACKEND_URL` só via env manual.
- [ ] Não passar o `--token` como argumento de linha de comando (visível no process list). Usar env/stdin.
- [ ] Instalar como **serviço** (`svc install` + `svc start`) em vez de `run.cmd` em foreground, para o runner sobreviver a reinícios.
- [ ] Mensagens de erro claras para backend offline / conexão recusada.
- [ ] Comando de **desinstalação** (`remove`/`uninstall`) que remove o runner do GitHub e limpa a pasta.
- [ ] Validar pré-requisitos no host (git instalado, permissões).
- [ ] Limpar imports não usados (`execSync` em `install.js`, `__dirname` nos services).

## Fase 3 — Robustez do Workflow 🟡

- [ ] **Bootstrap:** hoje o workflow assume um clone já existente. Tratar o caso do `LOCAL_REPO_PATH` ainda não clonado (fazer `clone` inicial).
- [ ] **Working tree divergente/suja:** `pull --ff-only` falha se o clone local tiver commits/alterações locais. Definir estratégia (abortar com mensagem clara, ou `reset --hard`/`clean` opcional via variável).
- [ ] **Notificação em falha** (Slack/Discord/e-mail) — hoje uma falha só aparece na aba Actions.
- [ ] Suporte opcional a runner **Linux/macOS** (a CLI já detecta os 3 SOs; o workflow é Windows-only).

## Fase 4 — Qualidade e entrega 🟢

- [ ] Versionar `package.json`, `src/` e `.gitignore` (fazer o primeiro commit da CLI).
- [ ] Testes (pelo menos `os.js`, `apiClient.js`, validação de `repo`).
- [ ] Lint/format (ESLint + Prettier).
- [ ] CI para a CLI (lint + testes em `push`/PR).
- [ ] `.env.example` e seção de contribuição no README.

---

## Bugs conhecidos (resumo rápido)

| # | Arquivo | Problema | Severidade |
|---|---|---|---|
| 1 | `install.js:38` | `path` não importado | 🔴 crash |
| 2 | `runnerDownloader.js:20` | `info` não importado | 🔴 crash |
| 3 | `runnerDownloader.js:28` | `.pipe` em WHATWG stream | 🔴 crash |
| 4 | `os.js:32` | nome de asset `-latest` inexistente | 🔴 download 404 |
| 5 | `index.js` / `apiClient.js` | `--backend` não conectado | 🟠 opção morta |
| 6 | `configureRunner` | `--token` na linha de comando | 🟡 segurança |

---

## Ordem sugerida

**Fase 0** (destrava a CLI) → **Fase 1** (backend, sem ele a CLI não fecha o fluxo) → **Fase 4 (commit inicial)** para versionar → depois **Fases 2 e 3** em paralelo conforme prioridade.
