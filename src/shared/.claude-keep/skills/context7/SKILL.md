---
name: context7
description: Fetch up-to-date documentation from Context7. Use when user needs current docs, API references, or examples for any technology — libraries, frameworks, packages, tools, platforms, CLIs, or services (e.g. React, Docker, Terraform, AWS CLI).
argument-hint: "<technology-name> [query]"
---

# Context7 - Documentation Lookup

Fetch current documentation for any technology via the Context7 REST API. This replaces the Context7 MCP server with zero baseline context cost.

## Workflow

### Step 1: Parse arguments

Extract from the user's input:
- **library** (required) - the technology name (e.g. "next.js", "hono", "docker", "terraform")
- **query** (optional) - what they want to know (e.g. "routing", "middleware", "schema definition")

If no query is provided, use a general query like "getting started overview".

### Step 2: Resolve the library ID

Use `WebFetch` to call:

```
GET https://context7.com/api/v2/libs/search?libraryName={library}&query={query}
```

From the response JSON, pick the best match from `results[]`. Each result has:
- `id` - the Context7 library ID (e.g. `/vercel/next.js`)
- `title` - display name
- `description` - what the library does
- `totalSnippets` - how many doc snippets are available
- `trustScore` - reliability score

Choose the result with the highest `trustScore` that matches the user's intent. If multiple versions exist in `versions[]`, prefer the latest unless the user specified a version.

### Step 3: Fetch documentation

Use `WebFetch` to call:

```
GET https://context7.com/api/v2/context?libraryId={id}&query={query}
```

This returns plain-text markdown documentation relevant to the query.

### Step 4: Present results

Share the documentation with the user. If they asked a specific question, answer it using the fetched docs. If they asked for general docs, present the key sections.

## Tips

- If the search returns no results, try simplifying the library name (e.g. "react" instead of "react.js")
- For scoped packages, try both formats: `@tanstack/router` and `tanstack-router`
- You can append a version to the library ID: `/vercel/next.js/v14.3.0`
- The API works without authentication but has rate limits; no API key is needed for normal use
