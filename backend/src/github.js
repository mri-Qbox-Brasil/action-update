// Integração com o GitHub: troca do código OAuth por access token do usuário
// e emissão do registration-token usado pela CLI para registrar o runner.

export async function exchangeCodeForToken(code) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  if (!response.ok) {
    throw new Error(`Falha na troca do código OAuth: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Erro OAuth: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

async function createRunnerToken(userToken, repo, kind) {
  // kind: 'registration-token' (registrar) ou 'remove-token' (remover).
  const response = await fetch(`https://api.github.com/repos/${repo}/actions/runners/${kind}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'meu-runner-backend',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao emitir ${kind}: ${response.status} ${body}`);
  }

  const data = await response.json();
  return data.token;
}

export function createRegistrationToken(userToken, repo) {
  return createRunnerToken(userToken, repo, 'registration-token');
}

export function createRemovalToken(userToken, repo) {
  return createRunnerToken(userToken, repo, 'remove-token');
}
