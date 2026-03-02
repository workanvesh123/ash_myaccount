#!/usr/bin/env node

/**
 * Migration Ticket Validator
 *
 * Validates existing migration tickets against the JSON schema.
 * Can validate individual tickets or scan entire directories.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { validateTicketStructure } from './shared-validation.mjs';

const WORKSPACE_ROOT = process.cwd();
const DEFAULT_TICKETS_DIR = '.code-pushup/.tickets';

const TICKET_SCHEMA = { current: null };

const loadTicketSchema = () => {
    if (TICKET_SCHEMA.current) return TICKET_SCHEMA.current;
    try {
        const schemaPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'migration-ticket.schema.json');
        TICKET_SCHEMA.current = JSON.parse(readFileSync(schemaPath, 'utf8'));
        return TICKET_SCHEMA.current;
    } catch (error) {
        console.error(`❌ Could not load ticket schema: ${error.message}`);
        process.exit(1);
    }
};

const validateTicketFile = (filePath) => {
    try {
        const content = readFileSync(filePath, 'utf8');
        const ticket = JSON.parse(content);
        const issues = validateTicketStructure(ticket);
        return { file: filePath, valid: issues.length === 0, issues, ticket };
    } catch (error) {
        return { file: filePath, valid: false, issues: [`Failed to parse JSON: ${error.message}`], ticket: null };
    }
};

const findTicketFiles = (dir) => {
    if (!existsSync(dir)) return [];

    const ticketFiles = [];
    const scanDirectory = (currentDir) => {
        try {
            readdirSync(currentDir, { withFileTypes: true }).forEach((entry) => {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.ticket.json')) {
                    ticketFiles.push(fullPath);
                }
            });
        } catch (error) {
            console.warn(`⚠️  Could not scan directory ${currentDir}: ${error.message}`);
        }
    };

    scanDirectory(dir);
    return ticketFiles;
};

const generateValidationReport = (results, outputPath) => {
    const validTickets = results.filter((r) => r.valid);
    const invalidTickets = results.filter((r) => !r.valid);
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

    const report = [
        '# Migration Ticket Validation Report',
        '',
        `Generated: ${new Date().toISOString()}`,
        '',
        '## Summary',
        '',
        `- **Total tickets**: ${results.length}`,
        `- **Valid tickets**: ${validTickets.length}`,
        `- **Invalid tickets**: ${invalidTickets.length}`,
        `- **Total issues**: ${totalIssues}`,
        '',
        '## Validation Results',
        '',
    ];

    if (invalidTickets.length > 0) {
        report.push('### ❌ Invalid Tickets', '');
        invalidTickets.forEach((result) => {
            report.push(`#### ${path.relative(WORKSPACE_ROOT, result.file)}`, '');
            result.issues.forEach((issue) => report.push(`- ${issue}`));
            report.push('');
        });
    }

    if (validTickets.length > 0) {
        report.push('### ✅ Valid Tickets', '');
        validTickets.forEach((result) => report.push(`- ${path.relative(WORKSPACE_ROOT, result.file)}`));
        report.push('');
    }

    const reportContent = report.join('\n');
    if (outputPath) {
        writeFileSync(outputPath, reportContent, 'utf8');
        console.info(`📄 Validation report written to: ${outputPath}`);
    }
    return reportContent;
};

const main = async () => {
    const [ticketsPath = path.join(WORKSPACE_ROOT, DEFAULT_TICKETS_DIR), outputReportPath] = process.argv.slice(2);

    console.info(`🔍 Validating tickets in: ${ticketsPath}`);
    if (!existsSync(ticketsPath)) {
        console.error(`❌ Tickets path does not exist: ${ticketsPath}`);
        process.exit(1);
    }

    loadTicketSchema();

    const ticketFiles = findTicketFiles(ticketsPath);
    if (ticketFiles.length === 0) return console.info('ℹ️  No ticket files found');

    console.info(`📊 Found ${ticketFiles.length} ticket files`);

    const results = ticketFiles.map(validateTicketFile);
    const reportPath = outputReportPath || path.join(WORKSPACE_ROOT, '.code-pushup/.tickets/validation-report.md');
    generateValidationReport(results, reportPath);

    const validCount = results.filter((r) => r.valid).length;
    const invalidCount = results.length - validCount;

    console.info(`\n📈 Validation Summary:\n   ✅ Valid: ${validCount}\n   ❌ Invalid: ${invalidCount}`);

    if (invalidCount > 0) {
        console.warn(`\n⚠️  ${invalidCount} tickets have validation issues. See report for details.`);
        process.exit(1);
    } else {
        console.info(`\n🎉 All tickets are valid!`);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    await main();
}

export { main, validateTicketFile, validateTicketStructure };
