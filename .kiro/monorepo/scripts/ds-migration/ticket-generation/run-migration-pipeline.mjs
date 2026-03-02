#!/usr/bin/env node

/**
 * Design System Migration Pipeline Orchestrator
 *
 * Runs the complete pipeline to generate design system migration tickets:
 * 1. Generate ds-usage-occurrences.csv from Code PushUp reports
 * 2. Pre-compute implementation data (metadata, implementations, summaries)
 * 3. Generate migration tickets using pre-computed data
 * 4. Validate all generated tickets against schema
 *
 * Usage: node run-migration-pipeline.mjs [reports-path] [ui-path] [stories-path]
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

const DEFAULT_UI = 'packages/design-system/ui';
const DEFAULT_STORIES = 'packages/design-system/storybook-host-app/src/components';
const DEFAULT_REPORTS = '.code-pushup';

function runScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
        console.info(`🚀 Running: node ${scriptPath} ${args.join(' ')}`);

        const child = spawn(process.execPath, [scriptPath, ...args], {
            stdio: 'inherit',
            cwd: process.cwd(),
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.info(`✅ Completed: ${scriptPath}\n`);
                resolve();
            } else {
                console.error(`❌ Failed: ${scriptPath} (exit code ${code})`);
                reject(new Error(`Script failed with exit code ${code}`));
            }
        });

        child.on('error', (error) => {
            console.error(`❌ Error running ${scriptPath}:`, error.message);
            reject(error);
        });
    });
}

async function main() {
    const [reportsPath = DEFAULT_REPORTS, uiPath = DEFAULT_UI, storiesPath = DEFAULT_STORIES] = process.argv.slice(2);

    console.info('🎯 Design System Migration Pipeline');
    console.info('=====================================');
    console.info(`📂 Reports Path: ${reportsPath}`);
    console.info(`🎨 UI Path: ${uiPath}`);
    console.info(`📚 Stories Path: ${storiesPath}`);
    console.info('');
    console.info('Pipeline will run 4 steps:');
    console.info('1. 📊 Generate usage occurrences');
    console.info('2. 🔧 Pre-compute implementation data');
    console.info('3. 🎫 Generate migration tickets');
    console.info('4. ✅ Validate generated tickets');
    console.info('');

    const scriptsDir = path.dirname(new URL(import.meta.url).pathname);

    try {
        console.info('📊 Step 1: Generating usage occurrences...');
        await runScript(path.join(scriptsDir, 'internal', '01-generate-ds-usage-occurrences.mjs'), [reportsPath]);

        console.info('🔧 Step 2: Pre-computing implementation data...');
        await runScript(path.join(scriptsDir, 'internal', '02-precompute-implementation-data.mjs'), [uiPath, storiesPath]);

        console.info('🎫 Step 3: Generating migration tickets...');
        await runScript(path.join(scriptsDir, 'internal', '03-ds-migration-ticket-generator.mjs'), [reportsPath, uiPath, storiesPath]);

        console.info('✅ Step 4: Validating generated tickets...');
        await runScript(path.join(scriptsDir, 'internal', '04-validate-migration-tickets.mjs'), ['.code-pushup/.tickets']);

        console.info('🎉 Pipeline completed successfully!');
        console.info('📁 Generated tickets: .code-pushup/.tickets/{project}/tickets/');
        console.info('📄 Validation report: .code-pushup/.tickets/validation-report.md');
    } catch (error) {
        console.error('💥 Pipeline failed:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await main();
}

export { main };
