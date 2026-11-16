const http = require('node:http');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const seed = () => ({
  projects: [
    { id: 'p-portfolio', name: 'Portfolio personnel', description: 'Présenter les projets et compétences web.', status: 'active', createdAt: '2026-11-01T09:00:00.000Z' },
    { id: 'p-campus', name: 'CampusConnect', description: 'Plateforme de communauté étudiante.', status: 'active', createdAt: '2026-11-10T09:00:00.000Z' }
  ],
  tasks: [
    { id: 't-1', projectId: 'p-portfolio', title: 'Ajouter BudgetPilot', description: 'Présenter le projet dans le portfolio.', status: 'done', priority: 'high', dueDate: '2026-11-18', createdAt: '2026-11-01T10:00:00.000Z' },
    { id: 't-2', projectId: 'p-campus', title: 'Préparer la version API', description: 'Définir les premières routes backend.', status: 'in_progress', priority: 'medium', dueDate: '2026-12-01', createdAt: '2026-11-10T10:00:00.000Z' }
  ]
});

function createApp(initialState = seed()) {
  const state = initialState;
  const send = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' }); res.end(JSON.stringify(body)); };
  const error = (res, status, message, details = []) => send(res, status, { error: { code: status === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR', message, details } });
  const readBody = req => new Promise((resolve, reject) => { let raw = ''; req.on('data', chunk => { raw += chunk; if (raw.length > 1000000) reject(new Error('Payload too large')); }); req.on('end', () => { if (!raw) return resolve({}); try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON')); } }); req.on('error', reject); });
  const validateProject = body => { const details = []; if (typeof body.name !== 'string' || body.name.trim().length < 2) details.push('name doit contenir au moins 2 caractères.'); if (body.description !== undefined && typeof body.description !== 'string') details.push('description doit être une chaîne.'); if (body.status !== undefined && !['active', 'archived'].includes(body.status)) details.push('status doit être active ou archived.'); return details; };
  const validateTask = body => { const details = []; if (typeof body.title !== 'string' || body.title.trim().length < 2) details.push('title doit contenir au moins 2 caractères.'); if (body.status !== undefined && !['todo', 'in_progress', 'done'].includes(body.status)) details.push('status doit être todo, in_progress ou done.'); if (body.priority !== undefined && !['low', 'medium', 'high'].includes(body.priority)) details.push('priority doit être low, medium ou high.'); if (body.dueDate !== undefined && body.dueDate && !/^\\d{4}-\\d{2}-\\d{2}$/.test(body.dueDate)) details.push('dueDate doit respecter le format YYYY-MM-DD.'); return details; };
  const page = (items, url) => { const params = new URL(url, 'http://localhost').searchParams; const pageNumber = Math.max(1, Number(params.get('page') || 1)); const limit = Math.min(50, Math.max(1, Number(params.get('limit') || 10))); const start = (pageNumber - 1) * limit; return { data: items.slice(start, start + limit), pagination: { page: pageNumber, limit, total: items.length, pages: Math.max(1, Math.ceil(items.length / limit)) } }; };
  const findTask = id => state.tasks.find(t => t.id === id);
  const findProject = id => state.projects.find(p => p.id === id);

  return async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    const url = new URL(req.url, 'http://localhost'); const parts = url.pathname.split('/').filter(Boolean);
    try {
      if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { status: 'ok', service: 'devflow-api', timestamp: new Date().toISOString() });
      if (req.method === 'GET' && url.pathname === '/api/projects') return send(res, 200, page(state.projects.map(p => ({ ...p, taskCount: state.tasks.filter(t => t.projectId === p.id).length })), req.url));
      if (parts[0] === 'api' && parts[1] === 'projects' && parts[2] && parts[3] === 'tasks' && req.method === 'GET') { if (!findProject(parts[2])) return error(res, 404, 'Projet introuvable.'); const tasks = state.tasks.filter(t => t.projectId === parts[2]); return send(res, 200, page(tasks, req.url)); }
      if (parts[0] === 'api' && parts[1] === 'projects' && parts[2] && parts.length === 3 && req.method === 'GET') { const project = findProject(parts[2]); return project ? send(res, 200, project) : error(res, 404, 'Projet introuvable.'); }
      if (req.method === 'POST' && url.pathname === '/api/projects') { const body = await readBody(req); const details = validateProject(body); if (details.length) return error(res, 422, 'Données de projet invalides.', details); const project = { id: randomUUID(), name: body.name.trim(), description: (body.description || '').trim(), status: body.status || 'active', createdAt: new Date().toISOString() }; state.projects.push(project); return send(res, 201, project); }
      if (parts[0] === 'api' && parts[1] === 'projects' && parts[2] && parts[3] === 'tasks' && req.method === 'POST') { if (!findProject(parts[2])) return error(res, 404, 'Projet introuvable.'); const body = await readBody(req); const details = validateTask(body); if (details.length) return error(res, 422, 'Données de tâche invalides.', details); const task = { id: randomUUID(), projectId: parts[2], title: body.title.trim(), description: (body.description || '').trim(), status: body.status || 'todo', priority: body.priority || 'medium', dueDate: body.dueDate || null, createdAt: new Date().toISOString() }; state.tasks.push(task); return send(res, 201, task); }
      if (parts[0] === 'api' && parts[1] === 'tasks' && parts[2] && req.method === 'GET') { const task = findTask(parts[2]); return task ? send(res, 200, task) : error(res, 404, 'Tâche introuvable.'); }
      if (parts[0] === 'api' && parts[1] === 'tasks' && parts[2] && req.method === 'PUT') { const task = findTask(parts[2]); if (!task) return error(res, 404, 'Tâche introuvable.'); const body = await readBody(req); const details = validateTask({ ...task, ...body }); if (details.length) return error(res, 422, 'Données de tâche invalides.', details); Object.assign(task, { title: body.title?.trim() ?? task.title, description: body.description?.trim() ?? task.description, status: body.status ?? task.status, priority: body.priority ?? task.priority, dueDate: body.dueDate ?? task.dueDate, updatedAt: new Date().toISOString() }); return send(res, 200, task); }
      if (parts[0] === 'api' && parts[1] === 'tasks' && parts[2] && req.method === 'DELETE') { const index = state.tasks.findIndex(t => t.id === parts[2]); if (index < 0) return error(res, 404, 'Tâche introuvable.'); const [deleted] = state.tasks.splice(index, 1); return send(res, 200, { deleted: true, task: deleted }); }
      if (req.method === 'GET' && url.pathname === '/openapi.json') { const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'openapi.json'), 'utf8')); return send(res, 200, spec); }
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/dashboard')) { const html = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8'); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(html); }
      if (req.method === 'GET' && ['/dashboard.css', '/dashboard.js'].includes(url.pathname)) { const asset = path.join(__dirname, 'public', url.pathname.slice(1)); const contentType = url.pathname.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8'; res.writeHead(200, { 'Content-Type': contentType }); return res.end(fs.readFileSync(asset)); }
      return error(res, 404, 'Route introuvable.');
    } catch (err) { return error(res, err.message === 'Invalid JSON' ? 400 : 500, err.message || 'Erreur interne.'); }
  };
}

if (require.main === module) { const port = Number(process.env.PORT || 3000); http.createServer(createApp()).listen(port, '0.0.0.0', () => console.log(`DevFlow API listening on http://localhost:${port}`)); }
module.exports = { createApp, seed };
