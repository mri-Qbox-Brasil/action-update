import 'dotenv/config';
import express from 'express';
import {
  createSession,
  getSession,
  setSessionReady,
  setSessionError
} from './sessions.js';
import { exchangeCodeForToken, createRegistrationToken } from './github.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const REPO_RE = /^[^/]+\/[^/]+$/;

// Inicia o fluxo: registra a sessão e redireciona o usuário ao consentimento do GitHub.
app.get('/auth/github', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).send('sessionId obrigatório');

  createSession(sessionId);

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${BASE_URL}/auth/github/callback`,
    scope: 'repo',
    state: sessionId
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Callback do OAuth: troca o código pelo access token e marca a sessão como READY.
app.get('/auth/github/callback', async (req, res) => {
  const { code, state: sessionId } = req.query;
  try {
    if (!code || !sessionId) throw new Error('code/state ausentes');
    const token = await exchangeCodeForToken(code);
    setSessionReady(sessionId, token);
    res.send('Autenticação concluída. Pode fechar esta aba e voltar ao terminal.');
  } catch (err) {
    if (sessionId) setSessionError(sessionId);
    res.status(500).send(`Erro na autenticação: ${err.message}`);
  }
});

// Polling da CLI.
app.get('/session/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ status: 'ERROR', error: 'Sessão não encontrada ou expirada' });
  }
  res.json({ status: session.status });
});

// Emite o registration-token para a CLI registrar o runner.
app.post('/runner/token', async (req, res) => {
  const { sessionId, repo } = req.body || {};
  try {
    const session = getSession(sessionId);
    if (!session || session.status !== 'READY' || !session.token) {
      return res.status(400).json({ error: 'Sessão inválida ou não autorizada' });
    }
    if (!REPO_RE.test(repo || '')) {
      return res.status(400).json({ error: 'repo inválido (use owner/repo)' });
    }
    const token = await createRegistrationToken(session.token, repo);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`meu-runner backend em ${BASE_URL}`));
