import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 3000);
const siteRoot = fileURLToPath(new URL('.', import.meta.url));
const localWebhookFile = join(siteRoot, '..', '..', 'work', 'bluelight-discord-webhook.txt');
const webhookUrl = process.env.DISCORD_WEBHOOK_URL || (await readFile(localWebhookFile, 'utf8').catch(() => '')).trim();
const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png' };

function reply(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function escapeDiscord(value) {
  return String(value || '—').replace(/@/g, '@\u200b').slice(0, 1024);
}

async function receiveBody(request) {
  const parts = [];
  let size = 0;
  for await (const part of request) {
    size += part.length;
    if (size > 80_000) throw new Error('Dossier trop volumineux.');
    parts.push(part);
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url === '/api/dossiers') {
      if (!webhookUrl) return reply(response, 503, { error: 'Le webhook Discord n’est pas encore configuré.' });
      const dossier = await receiveBody(request);
      const required = ['discord', 'type', 'projectName', 'history', 'ethnie', 'motivations', 'leads', 'ambitions', 'members'];
      if (required.some((key) => !String(dossier[key] || '').trim())) return reply(response, 400, { error: 'Tous les champs obligatoires doivent être remplis.' });
      const memberCount = String(dossier.members).split(/\r?\n/).filter(Boolean).length;
      const fields = [
        ['Lead Discord', dossier.discord], ['Type de projet', dossier.type], ['Nom du projet', dossier.projectName], ['Ethnie', dossier.ethnieOther || dossier.ethnie],
        ['Histoire du projet', dossier.history], ['Motivations', dossier.motivations], ['Futur(s) lead(s)', dossier.leads], ['Ambitions', dossier.ambitions], ['Membres', dossier.members]
      ].map(([name, value]) => ({ name, value: escapeDiscord(value), inline: ['Lead Discord', 'Type de projet', 'Nom du projet', 'Ethnie'].includes(name) }));
      const discordResponse = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'BlueLight FA · Dossiers', embeds: [{ title: 'Nouveau dossier illégal', color: 6594559, fields, footer: { text: `BlueLight FA · ${memberCount} membre(s) déclaré(s)` }, timestamp: new Date().toISOString() }] }) });
      if (!discordResponse.ok) throw new Error('Discord a refusé l’envoi. Vérifiez le webhook.');
      return reply(response, 200, { ok: true });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return reply(response, 405, { error: 'Méthode non autorisée.' });
    const requested = request.url === '/' ? 'index.html' : decodeURIComponent(request.url.split('?')[0]).replace(/^[\\/]+/, '');
    const safePath = normalize(requested).replace(/^([.]{2}[\\/])+/, '');
    const filePath = join(siteRoot, safePath);
    if (!filePath.startsWith(siteRoot)) return reply(response, 403, { error: 'Accès refusé.' });
    const content = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': `${mimeTypes[extname(filePath)] || 'application/octet-stream'}; charset=utf-8` });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    if (error.code === 'ENOENT') return reply(response, 404, { error: 'Page introuvable.' });
    console.error(error);
    reply(response, 500, { error: error.message || 'Erreur du serveur.' });
  }
});

server.listen(port, () => console.log(`BlueLight FA est accessible sur http://localhost:${port}`));
