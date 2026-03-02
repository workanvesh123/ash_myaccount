#!/usr/bin/env node
/**
 * Group Migration Tickets by Feature Structure
 *
 * Reads all ticket JSON files from a specified folder and generates
 * a hierarchical markdown document grouped by features and components.
 *
 * Usage:
 *   node group-tickets.js <tickets-folder-path> [output-file]
 *
 * Example:
 *   node group-tickets.js .code-pushup/.tickets/poker-core-lib/tickets
 *   node group-tickets.js .code-pushup/.tickets/poker-core-lib/tickets .kiro/tmp/grouped-tickets.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node group-tickets.js <tickets-folder-path> [output-file]');
    console.error('Example: node group-tickets.js .code-pushup/.tickets/poker-core-lib/tickets');
    process.exit(1);
}

const ticketsFolder = args[0];
const outputFile = args[1] || path.join('.kiro', 'tmp', 'grouped-tickets.md');

// Validate tickets folder exists
if (!fs.existsSync(ticketsFolder)) {
    console.error(`Error: Tickets folder not found: ${ticketsFolder}`);
    process.exit(1);
}

/**
 * Read all ticket JSON files from the folder
 */
function readTickets(folderPath) {
    const files = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith('.ticket.json'))
        .sort();

    return files.map((file) => {
        const filePath = path.join(folderPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    });
}

/**
 * Infer feature hierarchy from file paths
 */
function inferHierarchy(tickets) {
    const hierarchy = {};

    tickets.forEach((ticket) => {
        const feature = ticket.ticket_info.feature;

        if (!hierarchy[feature]) {
            hierarchy[feature] = {
                ticket: ticket,
                children: new Set(),
                files: new Set(),
            };
        }

        // Collect all file paths for this feature
        Object.values(ticket.design_system_components || {}).forEach((component) => {
            component.feature_occurrences?.forEach((occurrence) => {
                hierarchy[feature].files.add(occurrence.file_path);
            });
        });
    });

    // Infer parent-child relationships from file paths
    Object.keys(hierarchy).forEach((feature) => {
        const featurePaths = Array.from(hierarchy[feature].files);

        // Check if this feature's paths are nested under another feature
        Object.keys(hierarchy).forEach((otherFeature) => {
            if (feature !== otherFeature) {
                const otherPaths = Array.from(hierarchy[otherFeature].files);

                // If all paths of current feature contain the other feature name, it might be a child
                const isChild = featurePaths.some((path) => path.includes(`/${otherFeature}/`) && path.includes(`/${feature}/`));

                if (isChild) {
                    hierarchy[otherFeature].children.add(feature);
                }
            }
        });
    });

    return hierarchy;
}

/**
 * Format line ranges concisely
 */
function formatLineRanges(lines) {
    if (!lines || lines.length === 0) return '';

    const sorted = [...lines].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === end + 1) {
            end = sorted[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = sorted[i];
            end = sorted[i];
        }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);

    return ranges.join(', ');
}

/**
 * Generate component hierarchy tree
 */
function generateHierarchyTree(feature, hierarchy, indent = 0) {
    const prefix = '  '.repeat(indent);
    let tree = `${prefix}└── ${feature}\n`;

    const children = Array.from(hierarchy[feature]?.children || []).sort();
    children.forEach((child, index) => {
        const isLast = index === children.length - 1;
        const childPrefix = '  '.repeat(indent + 1);
        tree += `${childPrefix}${isLast ? '└──' : '├──'} ${child}\n`;
    });

    return tree;
}

/**
 * Generate markdown document
 */
function generateMarkdown(tickets, hierarchy) {
    const projectName = tickets[0]?.ticket_info.project || 'Unknown';

    // Calculate summary statistics
    const totalTickets = tickets.length;
    const totalFeatures = Object.keys(hierarchy).length;
    const allComponents = new Set();
    let totalFiles = 0;

    tickets.forEach((ticket) => {
        Object.keys(ticket.design_system_components || {}).forEach((comp) => {
            allComponents.add(comp);
        });
        totalFiles += ticket.migration_summary?.affected_files || 0;
    });

    let md = `# Migration Tickets Overview: ${projectName}\n\n`;
    md += `## Summary\n`;
    md += `- Total Tickets: ${totalTickets}\n`;
    md += `- Total Features: ${totalFeatures}\n`;
    md += `- Total DS Components: ${allComponents.size}\n`;
    md += `- Total Files Affected: ${totalFiles}\n\n`;
    md += `---\n\n`;

    // Group tickets by feature
    const rootFeatures = Object.keys(hierarchy)
        .filter((feature) => {
            // Root features are those not listed as children of any other feature
            return !Object.values(hierarchy).some((h) => h.children.has(feature));
        })
        .sort();

    rootFeatures.forEach((feature) => {
        const ticket = hierarchy[feature].ticket;

        md += `## Feature: ${feature}\n\n`;
        md += `**Ticket ID**: \`${ticket.ticket_info.ticket_id}\`\n\n`;

        // Show hierarchy if there are children
        if (hierarchy[feature].children.size > 0) {
            md += `### Component Hierarchy\n\n`;
            md += '```\n';
            md += generateHierarchyTree(feature, hierarchy);
            md += '```\n\n';
        }

        // List design system components
        md += `### Design System Components\n\n`;

        const components = ticket.design_system_components || {};
        Object.entries(components).forEach(([componentKey, componentData]) => {
            const dsInfo = componentData.design_system_info;
            const stats = componentData.occurrence_stats;

            md += `**${dsInfo.name}** (\`${dsInfo.selector}\`)\n`;
            md += `- Occurrences: ${stats.total_occurrences} across ${stats.affected_files} file(s)\n`;
            md += `- Total lines affected: ${stats.total_lines_affected}\n`;

            // Show key files (limit to 3 most significant)
            const occurrences = componentData.feature_occurrences || [];
            const topOccurrences = occurrences.sort((a, b) => b.lines.length - a.lines.length).slice(0, 3);

            if (topOccurrences.length > 0) {
                md += `- Key files:\n`;
                topOccurrences.forEach((occ) => {
                    const lineRange = formatLineRanges(occ.lines);
                    md += `  - \`${occ.file_path}\` (lines: ${lineRange})\n`;
                });
            }

            md += '\n';
        });

        md += `---\n\n`;
    });

    return md;
}

/**
 * Main execution
 */
function main() {
    console.log(`Reading tickets from: ${ticketsFolder}`);

    const tickets = readTickets(ticketsFolder);
    console.log(`Found ${tickets.length} ticket(s)`);

    if (tickets.length === 0) {
        console.error('No tickets found in the specified folder');
        process.exit(1);
    }

    console.log('Inferring feature hierarchy...');
    const hierarchy = inferHierarchy(tickets);

    console.log('Generating markdown document...');
    const markdown = generateMarkdown(tickets, hierarchy);

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output file
    fs.writeFileSync(outputFile, markdown, 'utf8');

    console.log(`\n✅ Grouped tickets document generated: ${outputFile}`);
    console.log(`   Lines: ${markdown.split('\n').length}`);
}

// Run the script
main();
