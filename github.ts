const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 50;
const FETCH_TIMEOUT_MS = 8000;
const USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

// I keep small helper functions to make the main handler easier to read.
const parseNumber = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

const parseStringList = (value: string | string[] | undefined) => {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseDate = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const parseLimit = (value: string | undefined) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
};

// Builds the GitHub API URL for the user's repos.
const buildGithubUrl = (user: string) => {
  const params = new URLSearchParams({
    per_page: "100",
    sort: "updated",
    direction: "desc"
  });

  return `https://api.github.com/users/${encodeURIComponent(user)}/repos?${params.toString()}`;
};

type GithubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  updated_at: string;
  size: number;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics?: string[];
};

export default async function handler(req: any, res: any) {
  // Only GET and POST are allowed for this endpoint.
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  // We accept input from query (GET) or body (POST).
  const input = req.method === "POST" ? req.body ?? {} : req.query ?? {};
  const getString = (key: string) => {
    const value = input?.[key];
    if (Array.isArray(value)) return value[0]?.trim();
    return typeof value === "string" ? value.trim() : undefined;
  };

  const env = typeof process !== "undefined" ? process.env : undefined;
  const user = getString("user") ?? env?.GITHUB_USER?.trim();

  const limit = parseLimit(getString("limit"));
  const languages = parseStringList(input?.language);
  const topics = parseStringList(input?.topic);
  const minSize = parseNumber(getString("min_size"));
  const maxSize = parseNumber(getString("max_size"));
  const minStars = parseNumber(getString("min_stars"));
  const maxStars = parseNumber(getString("max_stars"));
  const updatedSince = parseDate(getString("updated_since"));
  const updatedUntil = parseDate(getString("updated_until"));

  // I validate the username early so we fail fast.
  if (!user || !USERNAME_REGEX.test(user)) {
    res.status(400).json({ error: "Invalid or missing GitHub user." });
    return;
  }

  const token = env?.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-site",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    // This prevents a request from hanging forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(buildGithubUrl(user), {
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try {
        const json = JSON.parse(text) as { message?: string };
        if (json?.message) message = json.message;
      } catch {
        // I keep the raw text if it is not valid JSON.
      }
      res.status(response.status).json({ error: message || "GitHub API error" });
      return;
    }

    const repos = (await response.json()) as GithubRepo[];

    // Filter + map only the fields we actually want to expose.
    const filtered = repos
      .filter((repo) => !repo.fork && !repo.archived && !repo.disabled)
      .filter((repo) => {
        if (languages.length === 0) return true;
        const lang = repo.language ?? "";
        return languages.some(
          (item) => item.toLowerCase() === lang.toLowerCase()
        );
      })
      .filter((repo) => {
        if (topics.length === 0) return true;
        const repoTopics = repo.topics ?? [];
        return topics.every((topic) =>
          repoTopics.some(
            (repoTopic) => repoTopic.toLowerCase() === topic.toLowerCase()
          )
        );
      })
      .filter((repo) => (minSize === undefined ? true : repo.size >= minSize))
      .filter((repo) => (maxSize === undefined ? true : repo.size <= maxSize))
      .filter((repo) =>
        minStars === undefined ? true : repo.stargazers_count >= minStars
      )
      .filter((repo) =>
        maxStars === undefined ? true : repo.stargazers_count <= maxStars
      )
      .filter((repo) => {
        if (!updatedSince && !updatedUntil) return true;
        const updatedAt = new Date(repo.updated_at);
        if (updatedSince && updatedAt < updatedSince) return false;
        if (updatedUntil && updatedAt > updatedUntil) return false;
        return true;
      })
      .slice(0, limit)
      .map((repo) => ({
        name: repo.name,
        description: repo.description ?? "",
        language: repo.language ?? "Unknown",
        url: repo.html_url,
        updatedAt: repo.updated_at,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        defaultBranch: repo.default_branch,
        topics: repo.topics ?? [],
        size: repo.size
      }));

    // Small cache so this endpoint is fast on repeat calls.
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json({ user, projects: filtered });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      res.status(504).json({ error: "GitHub API timed out." });
      return;
    }
    res.status(500).json({ error: "Unexpected server error." });
  }
}
