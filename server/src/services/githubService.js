const GITHUB_API = "https://api.github.com";

const requestGitHub = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "PathPilot-Career-Portfolio-Analyzer"
    },
    signal: AbortSignal.timeout(12000)
  });

  if (response.status === 404) {
    const error = new Error("GitHub user or resource was not found.");
    error.status = 404;
    throw error;
  }
  if (response.status === 403 || response.status === 429) {
    const error = new Error("GitHub API rate limit reached. Please wait a while and try again.");
    error.status = 429;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(`GitHub API request failed (${response.status}).`);
    error.status = 502;
    throw error;
  }
  return response.json();
};

const analyzeGitHubPortfolio = async (username) => {
  const safeUsername = String(username || "").trim();
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(safeUsername)) {
    const error = new Error("Enter a valid GitHub username.");
    error.status = 400;
    throw error;
  }

  const profile = await requestGitHub(`${GITHUB_API}/users/${encodeURIComponent(safeUsername)}`);
  const repos = await requestGitHub(
    `${GITHUB_API}/users/${encodeURIComponent(safeUsername)}/repos?per_page=100&sort=updated&type=owner`
  );

  const ownedRepos = repos.filter(repo => !repo.fork && !repo.archived);
  const languages = {};
  ownedRepos.forEach(repo => {
    if (repo.language) languages[repo.language] = (languages[repo.language] || 0) + 1;
  });

  const withDescription = ownedRepos.filter(repo => (repo.description || "").trim()).length;
  const withTopics = ownedRepos.filter(repo => Array.isArray(repo.topics) && repo.topics.length > 0).length;
  const withHomepage = ownedRepos.filter(repo => (repo.homepage || "").trim()).length;
  const withReadme = await Promise.all(
    ownedRepos.slice(0, 30).map(async repo => {
      try {
        await requestGitHub(`${GITHUB_API}/repos/${encodeURIComponent(safeUsername)}/${encodeURIComponent(repo.name)}/readme`);
        return true;
      } catch {
        return false;
      }
    })
  );

  const readmeCount = withReadme.filter(Boolean).length;
  const recentCutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const recentlyUpdated = ownedRepos.filter(repo => new Date(repo.updated_at).getTime() >= recentCutoff).length;
  const totalStars = ownedRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

  // This is a documentation/completeness signal, not a code-quality or employability score.
  const countScore = Math.min(20, ownedRepos.length * 4);
  const readmeScore = Math.round((readmeCount / Math.max(1, Math.min(ownedRepos.length, 30))) * 20);
  const descriptionScore = Math.round((withDescription / Math.max(1, ownedRepos.length)) * 15);
  const topicScore = Math.round((withTopics / Math.max(1, ownedRepos.length)) * 15);
  const activityScore = Math.round((recentlyUpdated / Math.max(1, ownedRepos.length)) * 15);
  const demoScore = Math.round((withHomepage / Math.max(1, ownedRepos.length)) * 15);
  const languageScore = Math.min(10, Object.keys(languages).length * 3);
  const evidenceScore = Math.min(100, countScore + readmeScore + descriptionScore + topicScore + activityScore + demoScore + languageScore);

  const improvements = [];
  if (ownedRepos.length < 3) improvements.push("Publish at least 2–3 substantial, original projects that demonstrate different skills.");
  if (readmeCount < Math.min(ownedRepos.length, 3)) improvements.push("Add a README to each important project: problem, features, tech stack, setup steps, screenshots and architecture.");
  if (withDescription < ownedRepos.length) improvements.push("Write a clear one-line description for repositories that are currently missing one.");
  if (withTopics < ownedRepos.length) improvements.push("Add relevant repository topics so recruiters can quickly understand each project's domain and stack.");
  if (withHomepage < Math.min(ownedRepos.length, 2)) improvements.push("Add a live demo or deployed application link to your strongest projects.");
  if (recentlyUpdated === 0 && ownedRepos.length > 0) improvements.push("Refresh one project with a meaningful feature, tests or documentation, then commit the work.");
  if (improvements.length === 0) improvements.push("Your public repository metadata is well documented. Next, strengthen the portfolio with tests, clear architecture notes and demonstrable project outcomes.");

  const sortedRepos = [...ownedRepos]
    .sort((a, b) => (b.stargazers_count - a.stargazers_count) || new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 8)
    .map(repo => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
      htmlUrl: repo.html_url,
      homepage: repo.homepage,
      topics: repo.topics || [],
      fork: repo.fork
    }));

  return {
    profile: {
      username: profile.login,
      name: profile.name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      profileUrl: profile.html_url,
      publicRepos: profile.public_repos,
      followers: profile.followers
    },
    overview: {
      originalRepos: ownedRepos.length,
      readmeCount,
      descriptionCount: withDescription,
      topicCount: withTopics,
      liveDemoCount: withHomepage,
      recentlyUpdatedCount: recentlyUpdated,
      totalStars,
      languageCount: Object.keys(languages).length,
      evidenceScore
    },
    languages: Object.entries(languages).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    repositories: sortedRepos,
    improvements,
    scoreNote: "Evidence completeness score based on public repository metadata only. It does not inspect source-code quality, prove skill proficiency, or predict hiring outcomes."
  };
};

module.exports = { analyzeGitHubPortfolio };
