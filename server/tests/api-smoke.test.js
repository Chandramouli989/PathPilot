/**
 * PathPilot black-box API regression suite.
 * Uses Node's built-in test runner and fetch; no test database or production code edits.
 * Run only against a development/staging instance you control.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = (process.env.PATHPILOT_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const account = {
  name: 'PathPilot QA User',
  email: `pathpilot.qa.${runId}@example.test`,
  password: `QaPass!${runId}x`
};
const secondAccount = {
  name: 'PathPilot QA Second User',
  email: `pathpilot.qa.second.${runId}@example.test`,
  password: `QaPass!${runId}y`
};
let token;
let secondToken;

async function request(path, { method = 'GET', body, authToken, headers = {} } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { response, data };
}

async function register(user) {
  return request('/api/auth/register', { method: 'POST', body: user });
}
async function login(user) {
  return request('/api/auth/login', { method: 'POST', body: { email: user.email, password: user.password } });
}

 test('PathPilot API regression checks', async (t) => {
  await t.test('health endpoint responds successfully', async () => {
    const { response, data } = await request('/api/health');
    assert.equal(response.status, 200);
    assert.equal(data.success, true);
  });

  await t.test('security headers are present and X-Powered-By is absent', async () => {
    const { response } = await request('/api/health');
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.ok(response.headers.get('x-content-type-options'));
    assert.ok(response.headers.get('x-frame-options') || response.headers.get('content-security-policy'));
  });

  await t.test('valid first account can register', async () => {
    const { response, data } = await register(account);
    assert.equal(response.status, 201, JSON.stringify(data));
    assert.equal(data.success, true);
  });

  await t.test('duplicate email is rejected', async () => {
    const { response } = await register(account);
    assert.equal(response.status, 409);
  });

  await t.test('valid account can log in and receive a token', async () => {
    const { response, data } = await login(account);
    assert.equal(response.status, 200, JSON.stringify(data));
    assert.equal(data.success, true);
    assert.ok(typeof data.token === 'string' && data.token.length > 20);
    token = data.token;
  });

  await t.test('incorrect password is rejected', async () => {
    const { response } = await request('/api/auth/login', {
      method: 'POST', body: { email: account.email, password: 'DefinitelyWrong123!' }
    });
    assert.equal(response.status, 401);
  });

  await t.test('protected profile rejects missing and malformed tokens', async () => {
    const missing = await request('/api/users/profile');
    assert.equal(missing.response.status, 401);
    const malformed = await request('/api/users/profile', { authToken: 'not-a-real-jwt' });
    assert.equal(malformed.response.status, 401);
  });

  await t.test('authenticated profile can be read without exposing password', async () => {
    assert.ok(token, 'Login test must have produced a token');
    const { response, data } = await request('/api/users/profile', { authToken: token });
    assert.equal(response.status, 200, JSON.stringify(data));
    assert.equal(data.success, true);
    assert.equal(data.user.email, account.email);
    assert.equal(Object.hasOwn(data.user, 'password'), false);
  });

  await t.test('profile allowlisted fields can be updated', async () => {
    const { response, data } = await request('/api/users/profile', {
      method: 'PATCH', authToken: token,
      body: { education: 'B.Tech IT', skills: ['JavaScript', 'React'], interests: ['Web Development'], careerGoal: 'Frontend Developer', role: 'admin' }
    });
    assert.equal(response.status, 200, JSON.stringify(data));
    assert.equal(data.user.education, 'B.Tech IT');
    assert.notEqual(data.user.role, 'admin');
  });

  await t.test('career assessment can be created and retrieved', async () => {
    const assessment = {
      education: 'B.Tech Information Technology',
      skills: ['JavaScript', 'React', 'C++'],
      interests: ['Web Development', 'Problem Solving'],
      strengths: ['Analytical thinking'],
      preferredWorkStyle: 'Hybrid',
      careerGoal: 'Frontend Developer'
    };
    const created = await request('/api/assessments', { method: 'POST', authToken: token, body: assessment });
    assert.equal(created.response.status, 201, JSON.stringify(created.data));
    const fetched = await request('/api/assessments', { authToken: token });
    assert.equal(fetched.response.status, 200, JSON.stringify(fetched.data));
    assert.equal(fetched.data.assessment.careerGoal, assessment.careerGoal);
  });

  await t.test('second account is isolated from first account profile and assessment', async () => {
    const registered = await register(secondAccount);
    assert.equal(registered.response.status, 201, JSON.stringify(registered.data));
    const loggedIn = await login(secondAccount);
    assert.equal(loggedIn.response.status, 200, JSON.stringify(loggedIn.data));
    secondToken = loggedIn.data.token;
    const profile = await request('/api/users/profile', { authToken: secondToken });
    assert.equal(profile.response.status, 200);
    assert.equal(profile.data.user.email, secondAccount.email);
    assert.notEqual(profile.data.user.email, account.email);
    const assessment = await request('/api/assessments', { authToken: secondToken });
    assert.equal(assessment.response.status, 404);
  });
});
