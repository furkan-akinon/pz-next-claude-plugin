import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { NpmRegistryClient, RegistryError } from './registry.js';
import { BitbucketClient } from './bitbucket.js';
import { CATEGORY_LABELS, NPM_SCOPE } from './constants.js';
import type { PluginCategory } from './types.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'pz-next-registry',
    version: '1.5.0',
  });

  const registry = new NpmRegistryClient();
  const bitbucket = new BitbucketClient();

  server.tool(
    'list_plugins',
    'List all available @akinon/pz-* plugins from npm, grouped by category. Supports dist-tag filtering (latest, rc, beta, etc.)',
    {
      category: z
        .enum(['payment', 'bnpl', 'quick-checkout', 'shopping', 'business', 'utility', 'all'])
        .optional()
        .describe('Filter by category. Omit or use "all" to list every plugin.'),
      tag: z
        .string()
        .optional()
        .describe('npm dist-tag to show versions for, e.g. "rc", "beta", "next". Defaults to "latest".'),
    },
    async ({ category, tag }) => {
      try {
        const distTag = tag ?? 'latest';
        let plugins = await registry.listPlugins();

        if (category && category !== 'all') {
          plugins = plugins.filter((p) => p.category === category);
        }

        const pluginDetails = await Promise.allSettled(
          plugins.map((p) => registry.getPluginDetail(p.name))
        );

        const enriched = plugins.map((p, i) => {
          const result = pluginDetails[i];
          const tagVersion =
            result.status === 'fulfilled' ? result.value.distTags[distTag] : undefined;
          return { ...p, tagVersion };
        });

        const grouped = new Map<PluginCategory, typeof enriched>();
        for (const p of enriched) {
          const list = grouped.get(p.category) ?? [];
          list.push(p);
          grouped.set(p.category, list);
        }

        const showTag = distTag !== 'latest';
        const lines: string[] = [];
        for (const [cat, items] of grouped) {
          const label = CATEGORY_LABELS[cat] ?? cat;
          lines.push(`## ${label}`);
          if (showTag) {
            lines.push(`| Plugin | latest | ${distTag} | Description |`);
            lines.push('|--------|--------|' + '-'.repeat(distTag.length + 2) + '|-------------|');
            for (const p of items) {
              lines.push(
                `| ${p.name} | ${p.latestVersion} | ${p.tagVersion ?? '-'} | ${p.description} |`
              );
            }
          } else {
            lines.push('| Plugin | Version | Description |');
            lines.push('|--------|---------|-------------|');
            for (const p of items) {
              lines.push(`| ${p.name} | ${p.latestVersion} | ${p.description} |`);
            }
          }
          lines.push('');
        }

        lines.push(`**Total:** ${enriched.length} plugins found`);
        if (showTag) {
          const withTag = enriched.filter((p) => p.tagVersion).length;
          lines.push(`**${distTag} tag:** ${withTag} plugins have a ${distTag} release`);
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error) {
        return errorResponse('list_plugins', error);
      }
    }
  );

  server.tool(
    'get_plugin_info',
    'Get detailed information about a specific @akinon/pz-* plugin: dist-tags (latest, rc, beta), versions, dependencies, peer dependencies',
    {
      name: z
        .string()
        .describe('Plugin name, e.g. "pz-masterpass-rest" or just "masterpass-rest"'),
    },
    async ({ name }) => {
      try {
        const detail = await registry.getPluginDetail(name);

        const recentVersions = detail.allVersions.slice(0, 10);
        const versionTable = recentVersions
          .map((v) => `| ${v.version} | ${formatDate(v.publishedAt)} |`)
          .join('\n');

        const peerDeps = Object.entries(detail.peerDependencies);
        const distTags = Object.entries(detail.distTags);

        const lines = [
          `# ${detail.packageName}`,
          '',
          `**Category:** ${CATEGORY_LABELS[detail.category]}`,
          `**Description:** ${detail.description}`,
          detail.lastPublished ? `**Last published:** ${formatDate(detail.lastPublished)}` : '',
          '',
        ];

        if (distTags.length > 0) {
          lines.push('## Dist Tags');
          lines.push('| Tag | Version |');
          lines.push('|-----|---------|');
          for (const [tag, ver] of distTags) {
            lines.push(`| **${tag}** | ${ver} |`);
          }
          lines.push('');
        }

        if (peerDeps.length > 0) {
          lines.push('## Peer Dependencies');
          for (const [dep, ver] of peerDeps) {
            lines.push(`- \`${dep}\`: ${ver}`);
          }
          lines.push('');
        }

        const latestTag = detail.distTags['latest'];
        if (latestTag) {
          const changes = await bitbucket.getLatestChanges(detail.packageName, latestTag);
          if (changes.length > 0) {
            lines.push('## Latest Release Changes');
            for (const c of changes.slice(0, 10)) {
              const ticket = c.ticket ? ` \`${c.ticket}\`` : '';
              lines.push(`- ${c.message}${ticket} — _${c.author}, ${c.date}_`);
            }
            if (changes.length > 10) {
              lines.push(`_...and ${changes.length - 10} more commits_`);
            }
            lines.push('');
          }
        }

        lines.push('## Recent Versions');
        lines.push('| Version | Published |');
        lines.push('|---------|-----------|');
        lines.push(versionTable);

        if (detail.allVersions.length > 10) {
          lines.push(`\n_...and ${detail.allVersions.length - 10} older versions_`);
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error) {
        return errorResponse('get_plugin_info', error);
      }
    }
  );

  server.tool(
    'check_updates',
    'Compare installed @akinon/pz-* plugin versions against latest npm versions. Reads package.json from the given project path.',
    {
      project_path: z
        .string()
        .describe('Absolute path to the project root containing package.json'),
    },
    async ({ project_path }) => {
      try {
        const pkgPath = join(project_path, 'package.json');
        let pkgJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

        try {
          const raw = await readFile(pkgPath, 'utf-8');
          pkgJson = JSON.parse(raw);
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: `Could not read package.json at \`${pkgPath}\`. Make sure the path is correct.`,
              },
            ],
          };
        }

        const allDeps = {
          ...(pkgJson.dependencies ?? {}),
          ...(pkgJson.devDependencies ?? {}),
        };

        const results = await registry.checkUpdates(allDeps);

        if (results.length === 0) {
          return {
            content: [{ type: 'text', text: 'No @akinon/pz-* plugins found in package.json.' }],
          };
        }

        const updatable = results.filter((r) => r.updateAvailable);
        const upToDate = results.filter((r) => !r.updateAvailable);

        const lines: string[] = [];

        if (updatable.length > 0) {
          lines.push('## Updates Available');
          lines.push('| Plugin | Installed | Latest |');
          lines.push('|--------|-----------|--------|');
          for (const r of updatable) {
            lines.push(`| ${r.name} | ${r.installedVersion} | **${r.latestVersion}** |`);
          }
          lines.push('');
        }

        if (upToDate.length > 0) {
          lines.push('## Up to Date');
          lines.push('| Plugin | Version |');
          lines.push('|--------|---------|');
          for (const r of upToDate) {
            lines.push(`| ${r.name} | ${r.installedVersion} |`);
          }
          lines.push('');
        }

        lines.push(
          `**Summary:** ${updatable.length} update(s) available, ${upToDate.length} up to date`
        );

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error) {
        return errorResponse('check_updates', error);
      }
    }
  );

  server.tool(
    'get_plugin_changelog',
    'Get commit history between two versions of a @akinon/pz-* plugin from Bitbucket',
    {
      name: z
        .string()
        .describe('Plugin name, e.g. "pz-masterpass-rest" or just "masterpass-rest"'),
      from: z
        .string()
        .describe('Start version (exclusive), e.g. "1.5.0"'),
      to: z
        .string()
        .describe('End version (inclusive), e.g. "1.6.0" or "2.0.0-rc.3"'),
    },
    async ({ name, from, to }) => {
      try {
        const packageName = name.startsWith(`${NPM_SCOPE}/`)
          ? name
          : `${NPM_SCOPE}/${name.startsWith('pz-') ? name : 'pz-' + name}`;

        const result = await bitbucket.getChangelog(packageName, from, to);

        if (result.commits.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No commits found between ${from} and ${to}. Tags may not exist in Bitbucket.`,
            }],
          };
        }

        const lines = [
          `# Changelog — ${packageName}`,
          `**${from}** → **${to}** (${result.commits.length} commits)`,
          '',
        ];

        const withTickets = result.commits.filter((c) => c.ticket);
        const withoutTickets = result.commits.filter((c) => !c.ticket);

        if (withTickets.length > 0) {
          lines.push('## Linked Tickets');
          for (const c of withTickets) {
            lines.push(`- \`${c.ticket}\` ${c.message} — _${c.author}, ${c.date}_`);
          }
          lines.push('');
        }

        if (withoutTickets.length > 0) {
          lines.push('## Other Changes');
          for (const c of withoutTickets) {
            lines.push(`- ${c.message} — _${c.author}, ${c.date}_`);
          }
          lines.push('');
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error) {
        return errorResponse('get_plugin_changelog', error);
      }
    }
  );

  server.tool(
    'get_plugin_versions',
    'Get all published versions of a specific @akinon/pz-* plugin with publish dates',
    {
      name: z
        .string()
        .describe('Plugin name, e.g. "pz-masterpass-rest" or just "masterpass-rest"'),
      limit: z
        .number()
        .optional()
        .describe('Max number of versions to return (default: 20, newest first)'),
    },
    async ({ name, limit }) => {
      try {
        const versions = await registry.getPluginVersions(name);
        const cap = limit ?? 20;
        const shown = versions.slice(0, cap);

        const lines = [
          `# Versions — @akinon/${name.startsWith('pz-') ? name : 'pz-' + name}`,
          '',
          '| Version | Published |',
          '|---------|-----------|',
          ...shown.map((v) => `| ${v.version} | ${formatDate(v.publishedAt)} |`),
        ];

        if (versions.length > cap) {
          lines.push(`\n_Showing ${cap} of ${versions.length} total versions_`);
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (error) {
        return errorResponse('get_plugin_versions', error);
      }
    }
  );

  return server;
}

function errorResponse(tool: string, error: unknown) {
  const message =
    error instanceof RegistryError
      ? `Registry error (HTTP ${error.statusCode}): ${error.message}`
      : error instanceof Error
        ? error.message
        : String(error);

  return {
    content: [{ type: 'text' as const, text: `**Error in ${tool}:** ${message}` }],
    isError: true,
  };
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toISOString().split('T')[0];
  } catch {
    return iso;
  }
}
