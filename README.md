# action-update

Este projeto contém um workflow do GitHub Actions para **atualizar um clone local** automaticamente quando houver `push` na branch `main`.

## Como funciona

O workflow está em `.github/workflows/update-local-repo.yml` e:

1. Dispara em `push` na `main`.
2. Roda em um runner self-hosted com labels `self-hosted` e `windows`.
3. Valida a variável `LOCAL_REPO_PATH`.
4. Executa:
   - `git fetch origin main`
   - `git checkout main`
   - `git pull --ff-only origin main`

## Pré-requisitos

- Repositório no GitHub com Actions habilitado.
- Máquina Windows para rodar como agente local (runner self-hosted).
- Git instalado na máquina do runner.
- Um clone local do repositório que será atualizado.

## Configurar o agente local (runner self-hosted)

### 1) Criar o runner no GitHub

No repositório:

1. Abra **Settings**.
2. Vá em **Actions > Runners**.
3. Clique em **New self-hosted runner**.
4. Selecione **Windows** e siga os comandos mostrados pelo GitHub na máquina local.

### 2) Registrar e iniciar o runner na máquina Windows

No diretório onde você baixou o runner, execute os comandos fornecidos pelo GitHub, normalmente nesta ordem:

1. `config.cmd` (registro do runner)
2. `run.cmd` (execução manual)  
   ou `svc install` + `svc start` (rodar como serviço)

Recomendado: rodar como serviço para manter o agente sempre disponível após reinício.

### 3) Garantir labels compatíveis

Este workflow exige:

- `self-hosted`
- `windows`

Confirme nas configurações do runner que essas labels existem.

### 4) Configurar a variável LOCAL_REPO_PATH

No repositório:

1. Acesse **Settings > Secrets and variables > Actions**.
2. Em **Variables**, crie:
   - **Name**: `LOCAL_REPO_PATH`
   - **Value**: caminho absoluto do clone local (ex.: `D:\repos\meu-projeto`)

Esse caminho precisa:

- existir na máquina do runner;
- conter uma pasta `.git`;
- ter permissão de leitura e escrita para o usuário/serviço que executa o runner.

## Teste de execução

1. Faça um commit e `push` na `main`.
2. Abra a aba **Actions** no GitHub.
3. Verifique a execução do workflow **Update local repository**.
4. Confirme no agente local se o repositório foi atualizado.
