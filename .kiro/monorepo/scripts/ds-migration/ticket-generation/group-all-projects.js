#!/usr/bin/env node
/**
 * Group tickets for all projects with tickets
 *
 * Scans the .code-pushup/.tickets directory for all projects that have
 * generated tickets and runs the group-tickets.js script for each one.
 *
 * Usage:
 *   node group-all-projects.js
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TICKETS_BASE = '.code-pushup/.tickets';
const OUTPUT_BASE = '.kiro/tmp';

/**
 * Main execution
 */
function main() {
    console.log('🔍 Scanning for ticket folders...');

    // Ensure tickets base directory exists
    if (!fs.existsSync(TICKETS_BASE)) {
        console.error(`Error: Tickets base directory not found: ${TICKETS_BASE}`);
        console.error('Please run the migration pipeline first to generate tickets.');
        process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_BASE)) {
        fs.mkdirSync(OUTPUT_BASE, { recursive: true });
    }

    // Find all project directories with tickets
    const projectDirs = fs
        .readdirSync(TICKETS_BASE)
        .map((name) => path.join(TICKETS_BASE, name))
        .filter((dir) => fs.statSync(dir).isDirectory());

    let processedCount = 0;

    projectDirs.forEach((projectDir) => {
        const ticketsFolder = path.join(projectDir, 'tickets');

        if (fs.existsSync(ticketsFolder) && fs.statSync(ticketsFolder).isDirectory()) {
            const projectName = path.basename(projectDir);
            const outputFile = path.join(OUTPUT_BASE, `grouped-tickets-${projectName}.md`);

            console.log('');
            console.log(`📦 Processing: ${projectName}`);
            console.log(`   Input:  ${ticketsFolder}`);
            console.log(`   Output: ${outputFile}`);

            try {
                // Execute the group-tickets script directly
                const groupTicketsScript = path.join(__dirname, 'group-tickets.js');
                execSync(`node "${groupTicketsScript}" "${ticketsFolder}" "${outputFile}"`, {
                    stdio: 'inherit',
                    encoding: 'utf8',
                });
                processedCount++;
            } catch (error) {
                console.error(`   ❌ Error processing ${projectName}:`, error.message);
            }
        }
    });

    console.log('');
    if (processedCount > 0) {
        console.log(`✅ All projects processed! (${processedCount} project(s))`);
        console.log(`📁 Output files in: ${OUTPUT_BASE}/grouped-tickets-*.md`);
    } else {
        console.log('⚠️  No projects with tickets found.');
        console.log(`   Looked in: ${TICKETS_BASE}`);
    }
}

// Run the script
main();
