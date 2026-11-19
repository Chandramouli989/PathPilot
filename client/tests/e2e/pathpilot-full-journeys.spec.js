import { test, expect } from '@playwright/test';

const unique = () => `E2E ${Date.now()} ${Math.random().toString(16).slice(2, 7)}`;

async function mockAiRecommendations(page) {
  await page.route('**/api/ai/career-recommendations', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: {
      summary: 'E2E career profile summary',
      recommendations: [{ title: 'Frontend Developer', reason: 'Strong alignment with web development interests.', skillsToImprove: ['Accessibility', 'Testing'], projectIdea: 'Build an accessible task manager.' }]
    } })
  }));
}

async function mockRoadmapAiBoundary(page) {
  const id = '665000000000000000000001';
  const milestone = '665000000000000000000002';
  const roadmap = { _id: id, careerTitle: 'Frontend Developer', overview: 'E2E test roadmap', durationWeeks: 8,
    phases: [{ _id: '665000000000000000000003', title: 'Foundations', objective: 'Build foundations', milestones: [
      { _id: milestone, title: 'Build a responsive page', description: 'Create and test a responsive page.', estimatedHours: 5, status: 'not_started' },
      { _id: '665000000000000000000004', title: 'Practice JavaScript', description: 'Solve practical exercises.', estimatedHours: 4, status: 'not_started' }
    ] }] };
  await page.route('**/api/roadmaps', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, roadmaps: [roadmap] }) });
    return route.continue();
  });
  await page.route('**/api/roadmaps/generate', route => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Your personalized roadmap has been created.', roadmap }) }));
  await page.route('**/api/roadmaps/*/milestones/*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Milestone progress updated.', roadmap: { ...roadmap, phases: [{ ...roadmap.phases[0], milestones: [{ ...roadmap.phases[0].milestones[0], status: 'completed' }, roadmap.phases[0].milestones[1]] }] } }) }));
}

test.describe('PathPilot integrated feature journeys', () => {
  test.beforeEach(async ({ page }) => {
    // The Playwright setup project creates one authenticated storage state.
    // Reuse it instead of repeatedly logging in and hitting the auth rate limit.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('career assessment can be saved and reloaded', async ({ page }) => {
    await page.goto('/assessment');
    await page.getByLabel(/current education/i).fill('B.Tech Information Technology');
    await page.getByLabel(/^skills$/i).fill('React, JavaScript, C++');
    await page.getByLabel(/areas you enjoy/i).fill('Frontend development, problem solving');
    // Make the value unique so a previous run cannot trigger the no-changes path.
    const uniqueGoal = `Become a frontend developer and build accessible web applications. QA-${Date.now()}`;
    await page.getByLabel(/career goal/i).fill(uniqueGoal);
    await page.getByRole('button', { name: /(?:save|update) assessment/i }).click();
    await expect(page.getByRole('status').filter({ hasText: /career assessment has been saved successfully/i })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/^skills$/i)).toHaveValue(/React/);
    await expect(page.getByLabel(/career goal/i)).toHaveValue(uniqueGoal);
  });

  test('career recommendations page renders generated recommendation content', async ({ page }) => {
    await mockAiRecommendations(page);
    await page.goto('/recommendations');
    await page.getByRole('button', { name: /generate recommendations/i }).click();
    await expect(page.getByRole('heading', { name: 'Frontend Developer' })).toBeVisible();
    await expect(page.getByText('E2E career profile summary')).toBeVisible();
  });

  test('roadmap generation and milestone status interaction render correctly', async ({ page }) => {
    await mockRoadmapAiBoundary(page);
    await page.goto('/roadmaps');
    await page.getByPlaceholder(/frontend developer/i).fill('Frontend Developer');
    await page.getByRole('button', { name: /generate roadmap/i }).click();
    await expect(page.getByRole('heading', { name: 'Frontend Developer' }).first()).toBeVisible();
    await page.getByLabel('Update status for Build a responsive page').first().selectOption('completed');
    await expect(page.getByText(/50% complete/).first()).toBeVisible();
  });

  test('project evidence can be created and deleted', async ({ page }) => {
    const projectName = unique();
    await page.goto('/project-evidence');
    await page.getByRole('button', { name: /add project/i }).first().click();
    await page.getByLabel(/project name/i).fill(projectName);
    await page.getByLabel(/what did you build/i).fill('A browser-tested project evidence entry for the PathPilot QA journey.');
    await page.getByLabel(/skills used/i).fill('React, JavaScript, Playwright');
    await page.getByRole('button', { name: /save project/i }).click();
    const card = page.locator('.evidence-card').filter({ hasText: projectName });
    await expect(card).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await card.getByRole('button', { name: /delete project/i }).click();
    await expect(card).toHaveCount(0);
  });

  test('skill check can be opened, answered and submitted', async ({ page }) => {
    await page.goto('/skill-checks');
    await expect(page.getByRole('heading', { name: /test your foundational skills/i })).toBeVisible();
    await page.getByRole('button', { name: /start skill check/i }).first().click();
    const questions = page.locator('.skillcheck-question');
    await expect(questions.first()).toBeVisible();
    for (let i = 0; i < await questions.count(); i++) {
      await questions.nth(i).locator('input[type="radio"]').first().check();
    }
    await page.getByRole('button', { name: /submit answers/i }).click();
    await expect(page.locator('.skillcheck-result-panel')).toBeVisible();
    await expect(page.locator('.skillcheck-score')).toBeVisible();
  });

  test('coding challenge can run and save a browser-side submission', async ({ page }) => {
    await page.goto('/coding-challenges');
    await expect(page.getByRole('heading', { name: /practical coding challenges/i })).toBeVisible();
    await page.getByRole('button', { name: /open challenge/i }).first().click();
    await expect(page.getByLabel(/javascript code editor/i)).toBeVisible();
    await page.getByRole('button', { name: /submit & save/i }).click();
    await expect(page.getByText(/saved successfully:/i)).toBeVisible({ timeout: 15000 });
  });

  test('application opportunity can be created and moved to interview stage', async ({ page }) => {
    const company = unique();
    await page.goto('/applications');
    await page.getByRole('button', { name: /add opportunity/i }).click();
    await page.getByLabel(/company/i).fill(company);
    await page.getByLabel(/role \/ job title/i).fill('Frontend Developer Intern');
    await page.getByRole('button', { name: /save opportunity/i }).click();
    const card = page.locator('.application-card').filter({ hasText: company });
    await expect(card).toBeVisible();
    await card.getByLabel(/update status/i).selectOption('Interview');
    await expect(page.getByText(new RegExp(`${company}: status changed to Interview`))).toBeVisible();
  });

  test('interview answer can be evaluated and appears in practice history', async ({ page }) => {
    await page.goto('/interview-studio');
    await expect(page.getByRole('heading', { name: /interview preparation studio/i })).toBeVisible();
    await page.getByRole('button', { name: /practice this question/i }).first().click();
    await page.getByLabel(/your answer/i).fill('In my MovieHub project, I used React components to separate responsibilities. First I identified the data flow, then implemented reusable components and tested the user interactions. The result was a clearer structure and easier maintenance.');
    await page.getByRole('button', { name: /evaluate my answer/i }).click();
    await expect(page.getByRole('heading', { name: /feedback on your response/i })).toBeVisible({ timeout: 20000 });
    // Practice history belongs to the question-list view, not the active answer panel.
    await page.getByRole('button', { name: /all questions/i }).click();
    await expect(page.getByRole('heading', { name: /your recent practice/i })).toBeVisible();
  });
});
