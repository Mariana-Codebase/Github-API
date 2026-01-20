# API Documentation

This API is a small helper that talks to GitHub for you. You give it a username
and some filters, and it returns a clean, limited list of repos that are ready
to show on a portfolio or inside another app.

## Base URL

```
http://localhost:3000
```

## Endpoints

```
GET  /api/github
POST /api/github
```

You can use **GET** with query parameters or **POST** with a JSON body.
Both ways work the same, so you can choose what is easier for your client.

## Parameters

All parameters are optional except `user` (unless `GITHUB_USER` is set).
You can send them as query params (GET) or in the JSON body (POST).

| Name | Type | Example | What it does |
| --- | --- | --- | --- |
| `user` | string | `octocat` | GitHub username to fetch. |
| `limit` | number | `6` | Max results returned. Default 6, max 50. |
| `language` | string or array | `TypeScript,JavaScript` | Match repo language (case-insensitive). |
| `topic` | string or array | `api,portfolio` | Match repo topics (case-insensitive). |
| `min_size` | number | `10` | Minimum repo size in KB. |
| `max_size` | number | `500` | Maximum repo size in KB. |
| `min_stars` | number | `5` | Minimum stars. |
| `max_stars` | number | `100` | Maximum stars. |
| `updated_since` | date | `2024-01-01` | Only repos updated after this date. |
| `updated_until` | date | `2024-12-31` | Only repos updated before this date. |

### Notes on filters

- `language` and `topic` can be a comma-separated string or an array.
- If you pass both `updated_since` and `updated_until`, you get a date range.
- Size is in **KB**, because GitHub returns size in KB.
- Filters are applied after GitHub returns the repos (the API does not use the
  GitHub search endpoint).

## Example Requests

### Simple GET
```
GET /api/github?user=octocat
```

### GET with filters
```
GET /api/github?user=octocat&language=TypeScript&topic=api&min_stars=5
```

### POST with JSON body
```
POST /api/github
Content-Type: application/json

{
  "user": "octocat",
  "language": "TypeScript,JavaScript",
  "topic": ["api", "portfolio"],
  "min_stars": "5",
  "updated_since": "2024-01-01"
}
```

## Response

The response is always JSON with a `user` and a `projects` array.

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

### Field meanings

- `stars`, `forks`, `openIssues` are the current GitHub counts.
- `defaultBranch` is usually `main` or `master`.
- `topics` can be empty if the repo has none.
- `size` is the GitHub repo size in KB.

## Error Responses

- `400` Invalid or missing GitHub user.
- `405` Method not allowed. Only GET and POST are accepted.
- `500` Unexpected server error.
- `504` GitHub API timed out.

## How the API behaves

- Forked, archived, or disabled repos are removed.
- GitHub is queried with `per_page=100`, sorted by most recently updated.
- Results are cached for 10 minutes to reduce GitHub calls.

## Tips

- If you hit rate limits, set `GITHUB_TOKEN` as an environment variable.
- Keep `limit` low to make the API faster.
- For a portfolio, a good starter filter is `min_stars=3` and `limit=6`.
