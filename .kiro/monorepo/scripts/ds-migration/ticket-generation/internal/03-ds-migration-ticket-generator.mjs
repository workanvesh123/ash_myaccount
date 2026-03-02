#!/usr/bin/env node

/**
 * Design System Migration Ticket Generator
 *
 * Generates migration tickets for design system components based on Code PushUp reports.
 * Uses pre-computed CSV files for component metadata and project implementations
 * to create structured migration tickets with implementation details and occurrence statistics.
 */

/* eslint-disable max-lines */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { validateTicketStructure } from './shared-validation.mjs';

const DEFAULT_UI = 'packages/design-system/ui';
const DEFAULT_STORIES = 'packages/design-system/storybook-host-app/src/components';
const DEFAULT_REPORTS = '.code-pushup';

const WORKSPACE_ROOT = process.cwd();
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, '.code-pushup', '.tickets');

const ALIASES = {
    'modal-content': 'modal',
    'modal-header': 'modal',
    'modal-body': 'modal',
    'modal-title': 'modal',
    'modal-footer': 'modal',
    'card-content': 'card',
    'card-header': 'card',
    'card-footer': 'card',
    'tabs-group': 'tabsgroup',
    'tab-group': 'tabsgroup',
    'search-bar': 'searchbar',
    'progressbar': 'progress-bar',
    'bottomnav': 'bottom-nav',
    'radiogroup': 'radio-button',
    'radio-group': 'radio-button',
    'ivider': 'divider',
};

const EXCLUDED_PROJECTS = new Set([
    'oxygen-core-lib',
    'ladbrokes-mobile-app',
    'ladbrokes-desktop-app',
    'coral-desktop-app',
    'vanilla-features-lib',
    'sports-betstation-app',
    'vanilla-shared-lib',
    'horseracing-entrypoint-lib',
    'sports-web-entrypoint-lib',
    'coral-mobile-app',
    'vanilla-lib',
]);

const STATUS_BADGE_PATTERN = /status:\s*generateStatusBadges\([^,]*,\s*\[([^\]]*)]/gms;
const STATUS_ARRAY_PATTERN = /['"]([^'"]*)['"]/g;

const normalizeKey = (name) => name.toLowerCase().replace(/[^a-z\d]/g, '');
const camelToKebab = (str) =>
    str
        .replace(/(.)([A-Z][a-z]+)/g, '$1-$2')
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .replace(/_/g, '-')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/-$/, '');
const normalizeComponentName = (name) => {
    const raw = (name ?? '').trim();
    return raw === '' ? raw : ALIASES[raw] || Object.entries(ALIASES).find(([a]) => normalizeKey(a) === normalizeKey(raw))?.[1] || raw;
};

const extractComponentNameFromPath = (storyFile) => {
    const dir = path.basename(path.dirname(storyFile));
    if (dir === 'components') {
        return path.basename(storyFile).replace(/\.component\.stories|\.stories/, '');
    }
    return dir;
};

function findComponentSelector(implPath, defaultSelector) {
    if (!existsSync(implPath)) return defaultSelector;

    try {
        const files = readdirSync(implPath, { recursive: true }).filter((f) => f.endsWith('.component.ts'));
        const componentName = path.basename(path.dirname(implPath));
        const mainFile = files.find((file) => path.basename(file, '.component.ts') === componentName);

        const extractSelector = (file) => {
            try {
                const content = readFileSync(path.join(implPath, file), 'utf8');
                return content.match(/selector\s*:\s*['"`]([^'"`]+)['"`]/)?.[1];
            } catch {
                return null;
            }
        };

        return extractSelector(mainFile) || files.map(extractSelector).find(Boolean) || defaultSelector;
    } catch (error) {
        console.error(error);
        return defaultSelector;
    }
}

const componentMetadataCache = { current: null };

function loadComponentMetadataFromCSV() {
    if (componentMetadataCache.current) return componentMetadataCache.current;

    const csvPath = path.join(WORKSPACE_ROOT, '.code-pushup/.tickets/.data/component-metadata.csv');
    if (!existsSync(csvPath)) {
        console.error(`❌ Component metadata CSV not found: ${csvPath}`);
        console.error(`   Please run: node 02-precompute-implementation-data.mjs first`);
        process.exit(1);
    }

    try {
        const content = readFileSync(csvPath, 'utf8');
        const lines = content.split('\n').slice(1);
        const cache = new Map();

        lines
            .filter((line) => line.trim())
            .forEach((line) => {
                const [name, storybookPath, implPath, selector] = line.split(',').map((s) => s.trim());
                if (name && name !== 'Component name') {
                    cache.set(name, {
                        name,
                        storybook_path: storybookPath || '',
                        implementation_path: implPath || '',
                        selector: selector || `ds-${name}`,
                    });
                }
            });

        componentMetadataCache.current = cache;
        return cache;
    } catch (error) {
        console.error(`❌ Failed to load component metadata CSV: ${error.message}`);
        process.exit(1);
    }
}

function getComponentMetadata(componentName, uiPath, storiesPath) {
    const cache = loadComponentMetadataFromCSV();

    if (cache.has(componentName)) {
        return cache.get(componentName);
    }
    const absUi = path.resolve(WORKSPACE_ROOT, uiPath);
    const absStories = path.resolve(WORKSPACE_ROOT, storiesPath);
    const storyPath = path.join(absStories, componentName);
    const implPath = path.join(absUi, componentName, 'src');
    const defaultSel = `ds-${componentName}`;
    const selector = findComponentSelector(implPath, defaultSel);

    return {
        name: componentName,
        storybook_path: existsSync(storyPath) ? path.relative(WORKSPACE_ROOT, storyPath).replace(/\\/g, '/') : '',
        implementation_path: existsSync(implPath) ? path.relative(WORKSPACE_ROOT, implPath).replace(/\\/g, '/') : '',
        selector,
    };
}

function extractFeatureFromPath(filePath) {
    const { dir, name } = path.parse(filePath);
    const excludedFolders = new Set(['src', 'lib', 'components', 'app', 'assets', 'styles', 'shared', 'common', 'utils']);
    const excludedProjects = new Set(['packages', 'node_modules', 'casino', 'myaccount', 'ui-lib', 'platform-lib', 'frontend-lib']);

    const folder = dir
        .split('/')
        .reverse()
        .find((f) => f.length > 2 && !excludedFolders.has(f) && ![...excludedProjects].some((p) => p === f || f.includes(p)));
    return folder || name.replace(/\.(component|service|module)$/, '') || 'unknown';
}

function parseLineNumbers(lineStr) {
    const str = lineStr?.trim();
    if (!str || str === 'None') return [];

    const nums = str.split(',').flatMap((part) => {
        const p = part.trim();
        if (p.includes('-')) {
            const [a, b] = p.split('-').map(Number);
            return Number.isNaN(a) || Number.isNaN(b) || b < a ? [] : Array.from({ length: b - a + 1 }, (_, i) => a + i);
        }
        const n = Number(p);
        return Number.isNaN(n) ? [] : [n];
    });
    return [...new Set(nums)].sort((a, b) => a - b);
}

function parseCodePushUpReport(reportPath, excluded = new Set()) {
    try {
        const { plugins } = JSON.parse(readFileSync(reportPath, 'utf8'));
        const dsPlugin = plugins?.find((p) => p.slug === 'ds-component-usage');
        if (!dsPlugin?.audits) return [];

        const uniqueIssues = new Map();

        dsPlugin.audits.forEach((audit) => {
            const { slug, details } = audit;
            if (!details?.issues?.length) return;

            const compNorm = normalizeComponentName(camelToKebab(slug.replace(/^usage-ds/, '')));
            if (excluded.has(compNorm)) return;

            details.issues.forEach(({ source }) => {
                if (!source?.file) return;

                const filePath = source.file;
                const position = source.position;
                const lines = position ? `${position.startLine}-${position.endLine}` : '';

                const key = `${compNorm}:${filePath}:${lines}`;

                if (!uniqueIssues.has(key)) {
                    uniqueIssues.set(key, {
                        component: compNorm,
                        path: filePath,
                        lines,
                    });
                }
            });
        });

        return [...uniqueIssues.values()];
    } catch (error) {
        console.warn(`⚠️  Failed to parse JSON report ${reportPath}: ${error.message}`);
        return [];
    }
}

const extractStatusFromFile = (storyFile) => {
    try {
        const content = readFileSync(storyFile, 'utf8');
        return [...content.matchAll(STATUS_BADGE_PATTERN)].flatMap((m) => [...(m[1] ?? '').matchAll(STATUS_ARRAY_PATTERN)].map((mm) => mm[1]));
    } catch {
        return [];
    }
};

const findStoryFiles = (root) => {
    if (!existsSync(root)) return [];
    const traverse = (dir) => {
        try {
            return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
                const fp = path.join(dir, entry.name);
                if (entry.isDirectory()) return traverse(fp);
                return entry.name.endsWith('.stories.ts') ? [fp] : [];
            });
        } catch (error) {
            console.error(error);
            return [];
        }
    };
    return traverse(root);
};

const scanStorybookStories = (storybookPath) =>
    new Map(
        findStoryFiles(storybookPath).map((file) => {
            const name = extractComponentNameFromPath(file);
            const sts = extractStatusFromFile(file);
            return [name, sts.length > 0 ? sts : ['stable']];
        }),
    );

const getExcludedComponents = (storiesPath) => {
    const excluded = new Set(
        [...scanStorybookStories(storiesPath).entries()].filter(([, s]) => s.some((st) => /^(experimental|draft)$/i.test(st))).map(([n]) => n),
    );
    ['', 'unknown', 'utils'].forEach((e) => excluded.add(e));
    return excluded;
};

function loadProjectImplementationsFromCSV() {
    const csvPath = path.join(WORKSPACE_ROOT, '.code-pushup/.tickets/.data/project-implementations.csv');
    if (!existsSync(csvPath)) {
        console.error(`❌ Project implementations CSV not found: ${csvPath}`);
        console.error(`   Please run: node 02-precompute-implementation-data.mjs first`);
        process.exit(1);
    }

    try {
        const content = readFileSync(csvPath, 'utf8');
        const lines = content.split('\n').slice(1);
        const implementations = new Map();

        lines
            .filter((line) => line.trim())
            .forEach((line) => {
                const [component, project, filePath, linesStr, score] = line.split(',').map((s) => s.trim());
                if (!component || !project || !filePath) return;

                if (!implementations.has(component)) {
                    implementations.set(component, []);
                }

                const lineNumbers = linesStr
                    ? linesStr
                          .split(',')
                          .map(Number)
                          .filter((n) => !Number.isNaN(n))
                    : [];

                implementations.get(component).push({
                    component_name: component,
                    project,
                    relative_path: filePath,
                    lines: lineNumbers,
                    score: Number.parseInt(score, 10) || 0,
                });
            });

        return implementations;
    } catch (error) {
        console.error(`❌ Failed to load project implementations CSV: ${error.message}`);
        process.exit(1);
    }
}

const loadImplementationsCache = () => {
    console.info('📊 Loading pre-computed implementations...');
    const implementations = loadProjectImplementationsFromCSV();
    console.info(`✅ Loaded implementations for ${implementations.size} components`);
    return implementations;
};

const groupOccurrencesByComponent = (occurrences, project, feature) =>
    occurrences.reduce(
        (acc, occ) => ({
            ...acc,
            [occ.component]: [...(acc[occ.component] ?? []), { feature, file_path: occ.path, lines: parseLineNumbers(occ.lines), project }],
        }),
        {},
    );

const buildComponentData = (name, occs, { implementationsCache, uiPath, storiesPath }) => {
    const meta = getComponentMetadata(name, uiPath, storiesPath);
    const impls = implementationsCache.get(name) ?? [];
    const active = impls.filter((i) => i.relative_path && i.relative_path !== 'None');
    const sumLines = (arr, key) => arr.reduce((s, o) => s + o[key].length, 0);

    return {
        design_system_info: meta,
        feature_occurrences: occs,
        project_implementations: impls,
        occurrence_stats: {
            total_occurrences: occs.length,
            affected_files: new Set(occs.map((o) => o.file_path)).size,
            total_lines_affected: sumLines(occs, 'lines'),
        },
        implementation_stats: {
            total_projects: impls.length,
            projects_with_implementations: active.length,
            total_implementation_lines: sumLines(active, 'lines'),
        },
    };
};

const calculateMigrationSummary = (compOccs, dsComps) => {
    const totals = Object.values(compOccs);
    return {
        total_components: Object.keys(dsComps).length,
        total_occurrences: totals.reduce((s, a) => s + a.length, 0),
        affected_files: new Set(totals.flatMap((o) => o.map((i) => i.file_path))).size,
    };
};

const generateTicketJsonWithCache = (project, feature, occurrences, config) => {
    const compOccs = groupOccurrencesByComponent(occurrences, project, feature);
    const dsComps = Object.fromEntries(Object.keys(compOccs).map((name) => [name, buildComponentData(name, compOccs[name], config)]));
    return {
        ticket_info: { project, feature, ticket_id: `${project}-${feature}-migration`, generated_at: new Date().toISOString() },
        design_system_components: dsComps,
        migration_summary: calculateMigrationSummary(compOccs, dsComps),
    };
};

const getProjectDirectories = (reportsPath) =>
    readdirSync(reportsPath, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !EXCLUDED_PROJECTS.has(d.name))
        .map((d) => ({ name: d.name, path: path.join(reportsPath, d.name) }));

const collectAllOccurrences = (projectDirs, excluded) =>
    projectDirs.flatMap(({ name, path: proj }) => {
        const reportJson = path.join(proj, 'report.json');
        if (!existsSync(reportJson)) return [];
        try {
            return parseCodePushUpReport(reportJson, excluded);
        } catch (error) {
            console.warn(`⚠️  Failed to collect occurrences from ${name}: ${error.message}`);
            return [];
        }
    });

function processProject(project, projPath, excluded, config) {
    const reportJson = path.join(projPath, 'report.json');
    if (!existsSync(reportJson)) return 0;

    try {
        const occurrences = parseCodePushUpReport(reportJson, excluded);
        if (occurrences.length === 0) return 0;

        const featureGroups = occurrences.reduce((acc, occ) => {
            const f = extractFeatureFromPath(occ.path);
            return { ...acc, [f]: [...(acc[f] ?? []), occ] };
        }, {});

        const projectDir = path.join(OUTPUT_DIR, project);
        mkdirSync(projectDir, { recursive: true });

        const ticketsDir = path.join(projectDir, 'tickets');
        mkdirSync(ticketsDir, { recursive: true });

        Object.entries(featureGroups).forEach(([feature, occs]) => {
            const ticketJson = generateTicketJsonWithCache(project, feature, occs, config);

            const validationIssues = validateTicketStructure(ticketJson);
            if (validationIssues.length > 0) {
                console.warn(`⚠️  Validation issues for ${project}-${feature}:`);
                validationIssues.forEach((issue) => console.warn(`   - ${issue}`));
                console.warn(`   Ticket will still be generated, but may need manual review.`);
            }

            const ticketPath = path.join(ticketsDir, `${feature}.ticket.json`);
            writeFileSync(ticketPath, JSON.stringify(ticketJson, null, 2), 'utf8');

            if (validationIssues.length === 0) {
                console.info(`✅ Valid ticket: ${ticketPath}`);
            }
        });

        console.info(`✅ Generated ${Object.keys(featureGroups).length} tickets for ${project}`);

        return Object.keys(featureGroups).length;
    } catch (error) {
        console.warn(`⚠️  Failed to process ${project}: ${error.message}`);
        return 0;
    }
}

async function main() {
    const [reportsPath = DEFAULT_REPORTS, uiPath = DEFAULT_UI, storiesPath = DEFAULT_STORIES] = process.argv.slice(2);

    if (!existsSync(reportsPath)) {
        console.error(`❌ Error: Reports path '${reportsPath}' does not exist`);
        process.exit(1);
    }

    mkdirSync(OUTPUT_DIR, { recursive: true });

    const excluded = getExcludedComponents(storiesPath);
    const projectDirs = getProjectDirectories(reportsPath);
    const allOccurrences = collectAllOccurrences(projectDirs, excluded);

    console.info(`📊 Collected ${allOccurrences.length} total occurrences`);

    const implementationsCache = loadImplementationsCache();
    const config = { uiPath, storiesPath, implementationsCache };

    projectDirs.forEach(({ name, path: p }) => processProject(name, p, excluded, config));

    console.info(`📁 Results: ${OUTPUT_DIR}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await main();
}

export { main };
