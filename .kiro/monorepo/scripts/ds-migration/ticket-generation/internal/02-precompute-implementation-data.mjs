#!/usr/bin/env node

/**
 * Pre-compute Implementation Data Generator
 *
 * Pre-generates CSV files with component metadata and project implementations
 * to simplify and speed up the ticket generation process.
 *
 * Generates:
 * - component-metadata.csv: Component info (paths, selectors, tokens)
 * - project-implementations.csv: Best implementation examples per project/component
 * - component-project-summary.csv: Aggregated stats per component
 *
 * Usage: node 00-precompute-implementation-data.mjs [ui-path] [stories-path]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_UI = 'packages/design-system/ui';
const DEFAULT_STORIES = 'packages/design-system/storybook-host-app/src/components';

const MAX_FILES_TO_SCAN = 10;
const MAX_IMPLEMENTATIONS_TOTAL = 3;
const MAX_FILES_PER_PROJECT = 5;
const MAX_MATCHING_LINES = 5;

const WORKSPACE_ROOT = process.cwd();
const DATA_DIR = path.join(WORKSPACE_ROOT, '.code-pushup', '.tickets', '.data');

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

const STATUS_BADGE_PATTERN = /status:\s*generateStatusBadges\([^,]*,\s*\[([^\]]*)]/gms;
const STATUS_ARRAY_PATTERN = /['"]([^'"]*)['"]/g;

function findComponentSelector(implPath, defaultSelector) {
    if (!existsSync(implPath)) return defaultSelector;

    try {
        const files = readdirSync(implPath, { recursive: true }).filter((f) => f.endsWith('.component.ts'));

        const componentName = path.basename(path.dirname(implPath));

        const mainComponentFile = files.find((file) => path.basename(file, '.component.ts') === componentName);
        if (mainComponentFile) {
            try {
                const content = readFileSync(path.join(implPath, mainComponentFile), 'utf8');
                const match = content.match(/selector\s*:\s*['"`]([^'"`]+)['"`]/);
                if (match) return match[1];
            } catch (error) {
                console.error(error);
            }
        }

        const found = files
            .map((file) => {
                try {
                    const content = readFileSync(path.join(implPath, file), 'utf8');
                    const m = content.match(/selector\s*:\s*['"`]([^'"`]+)['"`]/);
                    return m ? m[1] : null;
                } catch {
                    return null;
                }
            })
            .find(Boolean);

        if (found) return found;
    } catch (error) {
        console.error(error);
    }

    return defaultSelector;
}

function extractTokensFromSelectors(selector) {
    if (!selector?.trim()) return [];

    const uniq = new Set(
        [
            ...(selector.match(/\[([\w-]+)(?:=['"`]?([\w-]+)['"`]?)?]/g) || []).flatMap((m) => {
                const [, a, v] = m.match(/\[([\w-]+)(?:=['"`]?([\w-]+)['"`]?)?]/) || [];
                return v ? [a, v] : [a];
            }),
            ...(selector.match(/\.([\w-]+)/g) || []).map((s) => s.slice(1)),
            ...(selector.match(/^([\w-]+)/g) || []),
        ].filter((t) => t.length > 2),
    );

    return [...uniq];
}

function scanFilesForTokens(filePaths, tokens, projectName) {
    return filePaths
        .slice(0, MAX_FILES_TO_SCAN)
        .filter(existsSync)
        .reduce((acc, fp) => {
            if (acc.length >= MAX_IMPLEMENTATIONS_TOTAL) return acc;

            try {
                const lines = readFileSync(fp, 'utf8').split('\n');
                const matches = lines.reduce(
                    (arr, line, idx) => (tokens.some((t) => line.toLowerCase().includes(t.toLowerCase())) ? [...arr, idx + 1] : arr),
                    [],
                );
                if (matches.length > 0)
                    acc.push({
                        project: projectName,
                        relative_path: path.relative(WORKSPACE_ROOT, fp).replace(/\\/g, '/'),
                        lines: matches.slice(0, MAX_MATCHING_LINES),
                        score: matches.length,
                    });
            } catch (error) {
                console.error(error);
            }
            return acc;
        }, []);
}

function extractStatusFromFile(storyFile) {
    try {
        const content = readFileSync(storyFile, 'utf8');
        return [...content.matchAll(STATUS_BADGE_PATTERN)].flatMap((m) => [...(m[1] ?? '').matchAll(STATUS_ARRAY_PATTERN)].map((mm) => mm[1]));
    } catch {
        return [];
    }
}

function findStoryFiles(root) {
    if (!existsSync(root)) return [];

    const traverse = (dir) => {
        try {
            return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
                const fp = path.join(dir, entry.name);
                if (entry.isDirectory()) return traverse(fp);
                if (entry.name.endsWith('.stories.ts')) return [fp];
                return [];
            });
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    return traverse(root);
}

function scanStorybookStories(storybookPath) {
    return new Map(
        findStoryFiles(storybookPath).map((file) => {
            const dir = path.basename(path.dirname(file));
            const name = dir === 'components' ? path.basename(file).replace(/\.component\.stories|\.stories/, '') : dir;
            const sts = extractStatusFromFile(file);
            return [name, sts.length > 0 ? sts : ['stable']];
        }),
    );
}

function getExcludedComponents(storiesPath) {
    const excluded = new Set(
        [...scanStorybookStories(storiesPath).entries()].filter(([, s]) => s.some((st) => /^(experimental|draft)$/i.test(st))).map(([n]) => n),
    );
    ['', 'unknown', 'utils'].forEach((e) => excluded.add(e));
    return excluded;
}

function loadUsageOccurrencesFromCSV() {
    const csvPath = path.join(DATA_DIR, 'ds-usage-occurrences.csv');
    if (!existsSync(csvPath)) {
        console.error(`❌ Usage occurrences CSV not found: ${csvPath}`);
        console.error(`   Please run: node 01-generate-ds-usage-occurrences.mjs first`);
        process.exit(1);
    }

    try {
        const content = readFileSync(csvPath, 'utf8');
        const lines = content.split('\n').slice(1);
        const componentProjectFiles = new Map();

        lines
            .filter((line) => line.trim())
            .forEach((line) => {
                const [project, component, filePath] = line.split(',').map((s) => s.trim());
                if (!project || !component || !filePath) return;

                if (!componentProjectFiles.has(component)) {
                    componentProjectFiles.set(component, new Map());
                }

                const componentMap = componentProjectFiles.get(component);
                if (!componentMap.has(project)) {
                    componentMap.set(project, new Set());
                }

                const full = path.resolve(WORKSPACE_ROOT, filePath);
                if (existsSync(full)) {
                    componentMap.get(project).add(full);
                }
            });

        return componentProjectFiles;
    } catch (error) {
        console.error(`❌ Failed to load usage occurrences CSV: ${error.message}`);
        process.exit(1);
    }
}

function generateComponentMetadata(uiPath, storiesPath, excluded) {
    console.info('🔍 Generating component metadata...');

    const absUi = path.resolve(WORKSPACE_ROOT, uiPath);
    const absStories = path.resolve(WORKSPACE_ROOT, storiesPath);

    const components = new Map();

    if (existsSync(absUi)) {
        try {
            const uiDirs = readdirSync(absUi, { withFileTypes: true })
                .filter((d) => d.isDirectory())
                .map((d) => d.name)
                .filter((name) => !excluded.has(name));

            uiDirs.forEach((componentName) => {
                const storyPath = path.join(absStories, componentName);
                const implPath = path.join(absUi, componentName, 'src');
                const defaultSel = `ds-${componentName}`;
                const selector = findComponentSelector(implPath, defaultSel);
                const tokens = extractTokensFromSelectors(selector);

                components.set(componentName, {
                    name: componentName,
                    storybook_path: existsSync(storyPath) ? path.relative(WORKSPACE_ROOT, storyPath).replace(/\\/g, '/') : '',
                    implementation_path: existsSync(implPath) ? path.relative(WORKSPACE_ROOT, implPath).replace(/\\/g, '/') : '',
                    selector,
                    tokens: tokens.join(','),
                });
            });
        } catch (error) {
            console.warn(`⚠️  Failed to scan UI directory: ${error.message}`);
        }
    }

    console.info(`✅ Generated metadata for ${components.size} components`);
    return components;
}

function processComponentImplementations(componentName, metadata, componentProjectFiles, implementations) {
    const tokens = metadata.tokens ? metadata.tokens.split(',') : [];
    if (tokens.length === 0) return { total_projects: 0, projects_with_implementations: 0, total_implementation_lines: 0 };

    const componentFiles = componentProjectFiles.get(componentName);
    if (!componentFiles) return { total_projects: 0, projects_with_implementations: 0, total_implementation_lines: 0 };

    const componentImpls = [];
    let totalLines = 0;

    [...componentFiles.entries()].some(([project, files]) => {
        if (componentImpls.length >= MAX_IMPLEMENTATIONS_TOTAL) return true;

        const projectResults = scanFilesForTokens([...files].slice(0, MAX_FILES_PER_PROJECT), tokens, project);
        if (projectResults.length > 0) {
            const bestResult = projectResults.sort((a, b) => b.score - a.score)[0];
            const impl = {
                component: componentName,
                project: bestResult.project,
                file_path: bestResult.relative_path,
                lines: bestResult.lines.join(','),
                score: bestResult.score,
            };

            implementations.push(impl);
            componentImpls.push(impl);
            totalLines += bestResult.lines.length;
        }
        return false;
    });

    return {
        total_projects: componentFiles.size,
        projects_with_implementations: componentImpls.length,
        total_implementation_lines: totalLines,
    };
}

function generateProjectImplementations(componentProjectFiles, componentMetadata) {
    console.info('🔍 Generating project implementations...');

    const implementations = [];
    const componentSummary = new Map();

    [...componentMetadata.entries()].forEach(([componentName, metadata]) => {
        const stats = processComponentImplementations(componentName, metadata, componentProjectFiles, implementations);
        componentSummary.set(componentName, stats);
    });

    console.info(`✅ Generated ${implementations.length} project implementations`);
    return { implementations, componentSummary };
}

function writeCSVs(componentMetadata, implementations, componentSummary) {
    console.info('💾 Writing CSV files...');

    mkdirSync(DATA_DIR, { recursive: true });

    const metadataPath = path.join(DATA_DIR, 'component-metadata.csv');
    const metadataRows = [
        ['Component', 'Storybook Path', 'Implementation Path', 'Selector', 'Tokens'],
        ...[...componentMetadata.values()].map((c) => [c.name, c.storybook_path, c.implementation_path, c.selector, c.tokens]),
    ];

    writeFileSync(metadataPath, metadataRows.map((row) => row.join(',')).join('\n'), 'utf8');
    console.info(`✅ Generated ${metadataPath}`);

    const implPath = path.join(DATA_DIR, 'project-implementations.csv');
    const implRows = [
        ['Component', 'Project', 'File Path', 'Lines', 'Score'],
        ...implementations.map((impl) => [impl.component, impl.project, impl.file_path, impl.lines, impl.score]),
    ];

    writeFileSync(implPath, implRows.map((row) => row.join(',')).join('\n'), 'utf8');
    console.info(`✅ Generated ${implPath}`);

    const summaryPath = path.join(DATA_DIR, 'component-project-summary.csv');
    const summaryRows = [
        ['Component', 'Total Projects', 'Projects With Implementations', 'Total Implementation Lines'],
        ...[...componentSummary.entries()].map(([component, stats]) => [
            component,
            stats.total_projects,
            stats.projects_with_implementations,
            stats.total_implementation_lines,
        ]),
    ];

    writeFileSync(summaryPath, summaryRows.map((row) => row.join(',')).join('\n'), 'utf8');
    console.info(`✅ Generated ${summaryPath}`);
}

async function main() {
    const [uiPath = DEFAULT_UI, storiesPath = DEFAULT_STORIES] = process.argv.slice(2);

    console.info('🚀 Pre-computing implementation data...');
    console.info(`📂 UI Path: ${uiPath}`);
    console.info(`📚 Stories Path: ${storiesPath}`);

    const componentProjectFiles = loadUsageOccurrencesFromCSV();
    console.info(`📊 Loaded usage data for ${componentProjectFiles.size} components`);

    const excluded = getExcludedComponents(storiesPath);
    console.info(`🚫 Excluding ${excluded.size} components (experimental/draft)`);

    const componentMetadata = generateComponentMetadata(uiPath, storiesPath, excluded);

    const { implementations, componentSummary } = generateProjectImplementations(componentProjectFiles, componentMetadata);

    writeCSVs(componentMetadata, implementations, componentSummary);

    console.info('🎉 Pre-computation complete!');
    console.info(`📁 Output directory: ${DATA_DIR}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await main();
}

export { main };
