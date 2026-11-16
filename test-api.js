const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp, seed } = require('./server');

function start() { return new Promise(resolve => { const server = http.createServer(createApp(seed())).listen(0, '127.0.0.1', () => resolve(server)); }); }
function request(server, method, path, body) { const { port } = server.address(); return new Promise((resolve, reject) => { const req = http.request({ hostname: '127.0.0.1', port, method, path, headers: body ? { 'Content-Type': 'application/json' } : {} }, res => { let raw = ''; res.on('data', c => raw += c); res.on('end', () => resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : {} })); }); req.on('error', reject); if (body) req.write(JSON.stringify(body)); req.end(); }); }

test('health endpoint responds', async () => { const server = await start(); const result = await request(server, 'GET', '/api/health'); assert.equal(result.status, 200); assert.equal(result.body.status, 'ok'); server.close(); });
test('can create a project and a task', async () => { const server = await start(); const project = await request(server, 'POST', '/api/projects', { name: 'Test project', description: 'Projet de test' }); assert.equal(project.status, 201); const task = await request(server, 'POST', `/api/projects/${project.body.id}/tasks`, { title: 'Écrire les tests', priority: 'high' }); assert.equal(task.status, 201); assert.equal(task.body.projectId, project.body.id); server.close(); });
test('rejects invalid task data', async () => { const server = await start(); const result = await request(server, 'POST', '/api/projects/p-portfolio/tasks', { title: '', priority: 'urgent' }); assert.equal(result.status, 422); assert.equal(result.body.error.code, 'VALIDATION_ERROR'); server.close(); });
