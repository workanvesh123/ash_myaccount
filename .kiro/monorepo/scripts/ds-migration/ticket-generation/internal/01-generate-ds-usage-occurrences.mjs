#!/usr/bin/env node

/**
 * Generate ds-usage-occurrences.csv from Code PushUp JSON reports
 *
 * Parses JSON reports to extract design system usage occurrences
 * and creates CSV file compatible with Python pipeline.
 *
 * Columns: Project,Component,Occurrence path,Line(s)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const WORKSPACE_ROOT = process.cwd();
const REPORTS_PATH = '.code-pushup';
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, '.code-pushup/.tickets/.data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'ds-usage-occurrences.csv');

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
    if (!raw) return raw;

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

    const direct = ALIASES[raw];
    if (direct) return direct;

    const normalizeKey = (str) => str.toLowerCase().replace(/[^a-z\d]/g, '');
    return Object.entries(ALIASES).find(([a]) => normalizeKey(a) === normalizeKey(raw))?.[1] ?? raw;
};

function parseCodePushUpReport(reportPath, projectName) {
    try {
        const { plugins } = JSON.parse(readFileSync(reportPath, 'utf8'));
        const dsPlugin = plugins?.find((p) => p.slug === 'ds-component-usage');
        if (!dsPlugin?.audits) return [];

        const occurrences = [];

        dsPlugin.audits.forEach((audit) => {
            const { slug, details } = audit;
            if (!details?.issues?.length) return;

            const compNorm = normalizeComponentName(camelToKebab(slug.replace(/^usage-ds/, '')));
            if (!compNorm) return;

            details.issues.forEach(({ source }) => {
                if (!source?.file) return;

                const filePath = source.file;
                const position = source.position;
                const lines = position ? `${position.startLine}-${position.endLine}` : '';

                occurrences.push({
                    project: projectName,
                    component: compNorm,
                    path: filePath,
                    lines,
                });
            });
        });

        return occurrences;
    } catch (error) {
        console.warn(`⚠️  Failed to parse JSON report ${reportPath}: ${error.message}`);
        return [];
    }
}

function getProjectDirectories(reportsPath) {
    return readdirSync(reportsPath, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !EXCLUDED_PROJECTS.has(d.name))
        .map((d) => ({ name: d.name, path: path.join(reportsPath, d.name) }));
}

function main() {
    console.info('🚀 Generating ds-usage-occurrences.csv from Code PushUp JSON reports...');

    mkdirSync(OUTPUT_DIR, { recursive: true });

    const projectDirs = getProjectDirectories(REPORTS_PATH);
    const allOccurrences = projectDirs.flatMap(({ name, path: projPath }) => {
        const reportJson = path.join(projPath, 'report.json');
        if (!existsSync(reportJson)) {
            console.info(`⚠️  Skipping ${name}: no report.json found`);
            return [];
        }

        const occurrences = parseCodePushUpReport(reportJson, name);

        if (occurrences.length > 0) {
            console.info(`✅ Processed ${name}: ${occurrences.length} occurrences`);
        }

        return occurrences;
    });

    const escapeCsvValue = (value) => {
        if (!value) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const csvLines = [
        'Project,Component,Occurrence path,Line(s)',
        ...allOccurrences.map(
            (occ) => `${escapeCsvValue(occ.project)},${escapeCsvValue(occ.component)},${escapeCsvValue(occ.path)},${escapeCsvValue(occ.lines)}`,
        ),
    ];

    writeFileSync(OUTPUT_FILE, csvLines.join('\n'), 'utf8');

    console.info(`✅ Generated ${OUTPUT_FILE} with ${allOccurrences.length} occurrences`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };
