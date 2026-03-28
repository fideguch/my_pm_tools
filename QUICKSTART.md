# Quick Start

Get the GitHub Project Manager MCP server running in under 5 minutes.

## Prerequisites

| Requirement                                                    | Check                |
| -------------------------------------------------------------- | -------------------- |
| Node.js 20+                                                    | `node --version`     |
| gh CLI authenticated                                           | `gh auth status`     |
| Classic PAT (`ghp_`) with `project`, `repo`, `read:org` scopes | `echo $GITHUB_TOKEN` |

A Classic PAT is required — fine-grained PATs do not support the Projects V2 GraphQL API.
Generate one at https://github.com/settings/tokens (select "Classic").

## Installation

```bash
# 1. Clone and install dependencies
git clone git@github.com:fideguch/my_pm_tools.git
cd my_pm_tools
npm install

# 2. Build the MCP server
npm run build

# 3. Install the skill into Claude Code
./install.sh
```

## Set the GitHub token

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Add this to your shell profile (`~/.zshrc` or `~/.bashrc`) to persist it.

## First use: set up a new project (Mode A)

If you have a GitHub Project V2 that is not yet configured:

```bash
./scripts/setup-all.sh myorg/my-app 3
```

Replace `myorg/my-app` with your repository and `3` with your project number.
For a 1-3 person team, append `--lite` to use a simplified 8-status configuration.

## First use: daily operations (Mode B)

If your project is already configured, add an issue and move it to active development:

```bash
# Add issue #1 to the project
./scripts/project-ops.sh myorg 3 add-issue myorg/my-app 1

# Get the item ID
./scripts/project-ops.sh myorg 3 list-items

# Move it to "開発中"
./scripts/project-ops.sh myorg 3 move PVTI_lADOBxxxxxxx dev
```

## First use: MCP tools in Claude Code

After building, add the server to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "github-project-manager": {
      "command": "node",
      "args": ["/absolute/path/to/my_pm_tools/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

Restart Claude Code, then try:

```
List all items in project 3 owned by myorg
```

```
Add issue #42 from myorg/my-app to project 3 owned by myorg
```

```
Generate the sprint report for the current sprint in project 3 owned by myorg
```

## Detailed examples

| Topic                                | File                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| Full project setup (Mode A)          | [examples/setup-project.md](examples/setup-project.md)       |
| Daily PM workflow (Mode B)           | [examples/daily-workflow.md](examples/daily-workflow.md)     |
| Sprint reports and velocity (Mode C) | [examples/sprint-analytics.md](examples/sprint-analytics.md) |
| MCP server config and all 11 tools   | [examples/mcp-integration.md](examples/mcp-integration.md)   |

## Useful commands

```bash
npm test            # Run 375+ regression tests
npm run build       # Rebuild after source changes
npm run quality     # Lint + typecheck + format check
shellcheck scripts/*.sh  # Validate shell scripts
```

## Documentation

- [USAGE.md](docs/USAGE.md) — Daily operations, views, sprint management, FAQ
- [README.en.md](README.en.md) — Full English reference
- [CONTRIBUTING.md](CONTRIBUTING.md) — Developer setup and contribution guide
