export function validateRepo(repo) {
  if (!/^[^/]+\/[^/]+$/.test(repo || '')) {
    throw new Error('Formato inválido. Use: owner/repo');
  }
}
