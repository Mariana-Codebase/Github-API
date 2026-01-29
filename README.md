### GitHub Repos API

A small API that fetches GitHub repositories for a user, applies filters, and
returns a clean list that is easy to show in a portfolio or app.

### Why this exists

When you call GitHub directly you get a lot of fields you do not need, and you
still have to filter forks, archived repos, and disabled projects. This API does
that cleanup for you and gives you a short list that is ready to render.

### Features

- GET and POST support
- Filters: language, topics, size, stars, updated date range
- Includes metrics: stars, forks, open issues, default branch
- Optional GitHub token to avoid rate limits

### Tech Stack

- Node.js
- TypeScript
- Express
- GitHub REST API

### Quick Start

1) Install dependencies
```
npm install
```

2) Run the server
```
npm run dev
```

3) Try a quick request
```
http://localhost:3000/api/github?user=octocat
```

### Environment Variables

- `GITHUB_USER` (optional) default username if `user` is not provided
- `GITHUB_TOKEN` (optional) increases your GitHub rate limit
- `PORT` (optional) server port, default `3000`

### Examples

GET with query params:
```
/api/github?user=octocat&language=TypeScript&min_stars=5&updated_since=2024-01-01
```

POST with JSON body:
```
POST /api/github
Content-Type: application/json

{
  "user": "octocat",
  "language": "TypeScript,JavaScript",
  "topic": "api,portfolio",
  "min_stars": "5",
  "updated_since": "2024-01-01"
}
```

### Response Shape

```
{
  "user": "octocat",
  "projects": [
    {
      "name": "repo-name",
      "description": "short text",
      "language": "TypeScript",
      "url": "https://github.com/octocat/repo-name",
      "updatedAt": "2025-01-01T12:00:00Z",
      "stars": 10,
      "forks": 2,
      "openIssues": 1,
      "defaultBranch": "main",
      "topics": ["api", "portfolio"],
      "size": 120
    }
  ]
}
```

### Docs

Full API reference: `docs/API.md`



## ⚖️ License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is under the **MIT License**. 
