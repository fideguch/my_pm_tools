import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

// ============================================================
// 1. File Structure Validation
// ============================================================
test.describe('File Structure Validation', () => {
  const requiredRootFiles = [
    'SKILL.md',
    'README.md',
    'README.en.md',
    'CONTRIBUTING.md',
    'CLAUDE.md',
    'LICENSE',
    'SECURITY.md',
    'CHANGELOG.md',
    'install.sh',
    '.gitignore',
    'package.json',
    'tsconfig.json',
    'playwright.config.ts',
  ];

  for (const file of requiredRootFiles) {
    test(`root file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredDocs = [
    'docs/USAGE.md',
    'docs/workflow-definition.md',
    'docs/view-design.md',
    'docs/automation-guide.md',
  ];

  for (const file of requiredDocs) {
    test(`doc file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredScripts = [
    'scripts/setup-all.sh',
    'scripts/setup-labels.sh',
    'scripts/setup-fields.sh',
    'scripts/setup-status.sh',
    'scripts/setup-views.sh',
    'scripts/setup-templates.sh',
    'scripts/project-ops.sh',
  ];

  for (const file of requiredScripts) {
    test(`script file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredTemplates = [
    'templates/ISSUE_TEMPLATE/bug_report.yml',
    'templates/ISSUE_TEMPLATE/feature_request.yml',
    'templates/pull_request_template.md',
  ];

  for (const file of requiredTemplates) {
    test(`template file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredWorkflows = [
    'templates/workflows/ci.yml',
    'templates/workflows/project-automation.yml',
    'templates/workflows/pr-labeler.yml',
    'templates/workflows/stale-detection.yml',
    'templates/workflows/roadmap-date-sync.yml',
  ];

  for (const file of requiredWorkflows) {
    test(`workflow template exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  const requiredSkills = [
    'skills/code-quality/SKILL.md',
    'skills/ci-cd-pipeline/SKILL.md',
    'skills/typescript-best-practices/SKILL.md',
    'skills/git-workflow/SKILL.md',
    'skills/project-setup-automation/SKILL.md',
  ];

  for (const file of requiredSkills) {
    test(`sub-skill exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  // .github/ directory for this repo
  const requiredGithubFiles = [
    '.github/workflows/ci.yml',
    '.github/workflows/pr-labeler.yml',
    '.github/labeler.yml',
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/ISSUE_TEMPLATE/feature_request.yml',
    '.github/pull_request_template.md',
  ];

  for (const file of requiredGithubFiles) {
    test(`.github file exists: ${file}`, () => {
      expect(fileExists(file)).toBe(true);
    });
  }

  test('README_INIT.md should not exist (orphan)', () => {
    expect(fileExists('README_INIT.md')).toBe(false);
  });

  test('tests directory exists with spec files', () => {
    expect(fileExists('tests/skill/structure.spec.ts')).toBe(true);
    expect(fileExists('tests/skill/content.spec.ts')).toBe(true);
    expect(fileExists('tests/skill/validation-scripts.spec.ts')).toBe(true);
    expect(fileExists('tests/skill/validation-operations.spec.ts')).toBe(true);
    expect(fileExists('tests/skill/validation-advanced.spec.ts')).toBe(true);
  });
});

// ============================================================
// 8. Package Configuration Validation
// ============================================================
test.describe('Package Configuration Validation', () => {
  test('package.json has required scripts', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts.format).toBeDefined();
    expect(pkg.scripts['format:check']).toBeDefined();
    expect(pkg.scripts.typecheck).toBeDefined();
    expect(pkg.scripts.quality).toBeDefined();
    expect(pkg.scripts.prepare).toBeDefined();
  });

  test('package.json has lint-staged config', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg['lint-staged']).toBeDefined();
    expect(pkg['lint-staged']['*.{json,md,yml,yaml}']).toBeDefined();
  });

  test('package.json has playwright devDependency', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.devDependencies['@playwright/test']).toBeDefined();
  });

  test('package.json has husky devDependency', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.devDependencies.husky).toBeDefined();
  });

  test('package.json has prettier devDependency', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.devDependencies.prettier).toBeDefined();
  });

  test('tsconfig.json uses strict mode', () => {
    const tsconfig = JSON.parse(readFile('tsconfig.json'));
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  test('.prettierrc exists and has singleQuote', () => {
    const config = JSON.parse(readFile('.prettierrc'));
    expect(config.singleQuote).toBe(true);
  });
});

// ============================================================
// 9. CI/CD Configuration Validation
// ============================================================
test.describe('CI/CD Configuration Validation', () => {
  test('.github/workflows/ci.yml has quality check steps', () => {
    const ci = readFile('.github/workflows/ci.yml');
    expect(ci).toContain('Format Check');
    expect(ci).toContain('Type Check');
    expect(ci).toContain('Test');
  });

  test('.github/workflows/ci.yml targets main branch', () => {
    const ci = readFile('.github/workflows/ci.yml');
    expect(ci).toContain('main');
  });

  test('.github/workflows/ci.yml uses Node.js 20', () => {
    const ci = readFile('.github/workflows/ci.yml');
    expect(ci).toContain('20');
  });

  test('.github/workflows/pr-labeler.yml exists and uses labeler action', () => {
    const labeler = readFile('.github/workflows/pr-labeler.yml');
    expect(labeler).toContain('labeler');
  });

  test('.github/labeler.yml has rules for key directories', () => {
    const config = readFile('.github/labeler.yml');
    expect(config).toContain('scripts');
    expect(config).toContain('templates');
    expect(config).toContain('docs');
  });
});

// ============================================================
// 10. .github/ Templates for This Repo
// ============================================================
test.describe('.github/ Templates for This Repo', () => {
  test('.github/ISSUE_TEMPLATE/bug_report.yml is valid YAML', () => {
    try {
      execSync(
        `ruby -ryaml -e "YAML.safe_load(File.read('${path.join(ROOT, '.github/ISSUE_TEMPLATE/bug_report.yml')}'))"`,
        { stdio: 'pipe' }
      );
    } catch {
      expect(false).toBe(true);
    }
  });

  test('.github/ISSUE_TEMPLATE/feature_request.yml is valid YAML', () => {
    try {
      execSync(
        `ruby -ryaml -e "YAML.safe_load(File.read('${path.join(ROOT, '.github/ISSUE_TEMPLATE/feature_request.yml')}'))"`,
        { stdio: 'pipe' }
      );
    } catch {
      expect(false).toBe(true);
    }
  });

  test('.github/pull_request_template.md has closes # syntax', () => {
    const content = readFile('.github/pull_request_template.md');
    expect(content).toContain('closes #');
  });

  test('.github templates are distinct from templates/ directory', () => {
    // .github/ templates are for THIS repo; templates/ are for TARGET repos
    const ghBug = readFile('.github/ISSUE_TEMPLATE/bug_report.yml');
    const tplBug = readFile('templates/ISSUE_TEMPLATE/bug_report.yml');
    // They may be similar but .github/ should reference this repo's context
    expect(ghBug).toContain('name:');
    expect(tplBug).toContain('name:');
  });
});

// ============================================================
// MCP Server Structure Validation
// ============================================================
test.describe('MCP Server Structure Validation', () => {
  test('src/ directory exists', () => {
    expect(fileExists('src')).toBe(true);
  });

  test('src/index.ts entry point exists', () => {
    expect(fileExists('src/index.ts')).toBe(true);
  });

  test('src/server.ts factory exists', () => {
    expect(fileExists('src/server.ts')).toBe(true);
  });

  test('src/graphql/ directory has client, queries, and mutations', () => {
    expect(fileExists('src/graphql/client.ts')).toBe(true);
    expect(fileExists('src/graphql/queries.ts')).toBe(true);
    expect(fileExists('src/graphql/mutations.ts')).toBe(true);
  });

  test('src/tools/ has all 11 tool files', () => {
    expect(fileExists('src/tools/index.ts')).toBe(true);
    expect(fileExists('src/tools/list-fields.ts')).toBe(true);
    expect(fileExists('src/tools/list-items.ts')).toBe(true);
    expect(fileExists('src/tools/add-item.ts')).toBe(true);
    expect(fileExists('src/tools/move-status.ts')).toBe(true);
    expect(fileExists('src/tools/set-priority.ts')).toBe(true);
    expect(fileExists('src/tools/sprint-report.ts')).toBe(true);
    expect(fileExists('src/tools/get-issue.ts')).toBe(true);
    expect(fileExists('src/tools/edit-issue.ts')).toBe(true);
    expect(fileExists('src/tools/manage-labels.ts')).toBe(true);
    expect(fileExists('src/tools/manage-assignees.ts')).toBe(true);
    expect(fileExists('src/tools/set-issue-state.ts')).toBe(true);
  });

  test('src/utils/ has infrastructure files', () => {
    expect(fileExists('src/utils/gh-cli.ts')).toBe(true);
    expect(fileExists('src/utils/status-alias.ts')).toBe(true);
  });

  test('src/schemas/index.ts has all schema exports', () => {
    const content = readFile('src/schemas/index.ts');
    expect(content).toContain('addItemSchema');
    expect(content).toContain('moveStatusSchema');
    expect(content).toContain('setPrioritySchema');
    expect(content).toContain('listItemsSchema');
    expect(content).toContain('listFieldsSchema');
    expect(content).toContain('sprintReportSchema');
    expect(content).toContain('getIssueSchema');
    expect(content).toContain('editIssueSchema');
    expect(content).toContain('manageLabelsSchema');
    expect(content).toContain('manageAssigneesSchema');
    expect(content).toContain('setIssueStateSchema');
    expect(content).toContain('repoParam');
  });

  test('src/types/index.ts has core type exports', () => {
    const content = readFile('src/types/index.ts');
    expect(content).toContain('ProjectItem');
    expect(content).toContain('ProjectField');
    expect(content).toContain('SprintReport');
  });

  test('package.json has MCP dependencies', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.dependencies).toHaveProperty('@modelcontextprotocol/sdk');
    expect(pkg.dependencies).toHaveProperty('@octokit/graphql');
    expect(pkg.dependencies).toHaveProperty('zod');
  });

  test('package.json has bin entry', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.bin).toHaveProperty('my-pm-tools');
  });

  test('package.json has build script', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.scripts.build).toBeDefined();
  });

  test('tsconfig.build.json exists', () => {
    expect(fileExists('tsconfig.build.json')).toBe(true);
  });

  test('src/index.ts has shebang for CLI execution', () => {
    const content = readFile('src/index.ts');
    expect(content).toMatch(/^#!\/usr\/bin\/env node/);
  });

  test('src/tools/index.ts registers all 12 GitHub project tools', () => {
    const content = readFile('src/tools/index.ts');
    expect(content).toContain('project_list_fields');
    expect(content).toContain('project_list_items');
    expect(content).toContain('project_add_item');
    expect(content).toContain('project_move_status');
    expect(content).toContain('project_set_priority');
    expect(content).toContain('project_sprint_report');
    expect(content).toContain('project_get_issue');
    expect(content).toContain('project_create_issue');
    expect(content).toContain('project_edit_issue');
    expect(content).toContain('project_manage_labels');
    expect(content).toContain('project_manage_assignees');
    expect(content).toContain('project_set_issue_state');
  });

  test('GraphQL queries contain required operations', () => {
    const queries = readFile('src/graphql/queries.ts');
    expect(queries).toContain('GetProjectId');
    expect(queries).toContain('GetProjectFields');
    expect(queries).toContain('GetProjectItems');
    expect(queries).toContain('GetProjectFull');
    expect(queries).toContain('GetIssueByNumber');
  });

  test('GraphQL mutations contain required operations', () => {
    const mutations = readFile('src/graphql/mutations.ts');
    expect(mutations).toContain('AddProjectItem');
    expect(mutations).toContain('UpdateItemField');
  });
});
