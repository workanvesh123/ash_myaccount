#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function loadTicket(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`❌ Error loading ticket ${filePath}:`, error.message);
        process.exit(1);
    }
}

function validateTicketStructure(ticket, ticketName) {
    const requiredFields = ['ticket_info', 'design_system_components', 'migration_summary'];
    const missing = requiredFields.filter((field) => !ticket[field]);

    if (missing.length > 0) {
        console.error(`❌ ${ticketName} is missing required fields: ${missing.join(', ')}`);
        process.exit(1);
    }

    if (!ticket.ticket_info.project || !ticket.ticket_info.feature) {
        console.error(`❌ ${ticketName} is missing required ticket_info fields`);
        process.exit(1);
    }
}

function createImplementationKey(impl) {
    return `${impl.project}:${impl.relative_path}:${impl.lines.join(',')}`;
}

function mergeProjectImplementations(implementations1, implementations2) {
    const merged = [...implementations1];
    const existingKeys = new Set(implementations1.map(createImplementationKey));

    implementations2.forEach((impl) => {
        const key = createImplementationKey(impl);
        if (!existingKeys.has(key)) {
            merged.push(impl);
            existingKeys.add(key);
        }
    });

    return merged;
}

function mergeDesignSystemComponents(components1, components2) {
    const merged = { ...components1 };

    Object.entries(components2).forEach(([componentName, component2]) => {
        if (merged[componentName]) {
            const component1 = merged[componentName];

            const mergedOccurrences = [...component1.feature_occurrences, ...component2.feature_occurrences];

            const mergedImplementations = mergeProjectImplementations(component1.project_implementations, component2.project_implementations);

            const totalOccurrences = mergedOccurrences.length;
            const affectedFiles = new Set(mergedOccurrences.map((occ) => occ.file_path)).size;
            const totalLinesAffected = mergedOccurrences.reduce((sum, occ) => sum + occ.lines.length, 0);

            const totalProjects = new Set(mergedImplementations.map((impl) => impl.project)).size;
            const projectsWithImplementations = totalProjects;
            const totalImplementationLines = mergedImplementations.reduce((sum, impl) => sum + impl.lines.length, 0);

            merged[componentName] = {
                design_system_info: component1.design_system_info,
                feature_occurrences: mergedOccurrences,
                project_implementations: mergedImplementations,
                occurrence_stats: {
                    total_occurrences: totalOccurrences,
                    affected_files: affectedFiles,
                    total_lines_affected: totalLinesAffected,
                },
                implementation_stats: {
                    total_projects: totalProjects,
                    projects_with_implementations: projectsWithImplementations,
                    total_implementation_lines: totalImplementationLines,
                },
            };
        } else {
            merged[componentName] = component2;
        }
    });

    return merged;
}

function generateMergedTicketId(ticket1, ticket2) {
    const project = ticket1.ticket_info.project;
    const feature1 = ticket1.ticket_info.feature;
    const feature2 = ticket2.ticket_info.feature;

    const combinedFeature = `${feature1}-${feature2}`;

    return `${project}-${combinedFeature}-migration`;
}

function generateMergedFeatureName(ticket1, ticket2) {
    const feature1 = ticket1.ticket_info.feature;
    const feature2 = ticket2.ticket_info.feature;

    return `${feature1}-${feature2}`;
}

function calculateMigrationSummary(designSystemComponents) {
    const totalComponents = Object.keys(designSystemComponents).length;
    const totalOccurrences = Object.values(designSystemComponents).reduce((sum, component) => sum + component.occurrence_stats.total_occurrences, 0);
    const affectedFilesSet = new Set();

    Object.values(designSystemComponents).forEach((component) => {
        component.feature_occurrences.forEach((occ) => affectedFilesSet.add(occ.file_path));
    });

    return {
        total_components: totalComponents,
        total_occurrences: totalOccurrences,
        affected_files: affectedFilesSet.size,
    };
}

function mergeTickets(ticket1, ticket2) {
    validateTicketStructure(ticket1, 'Ticket 1');
    validateTicketStructure(ticket2, 'Ticket 2');

    if (ticket1.ticket_info.project !== ticket2.ticket_info.project) {
        console.error(`❌ Cannot merge tickets from different projects: ${ticket1.ticket_info.project} vs ${ticket2.ticket_info.project}`);
        process.exit(1);
    }

    console.info(`🔄 Merging tickets:`);
    console.info(`   📋 ${ticket1.ticket_info.feature} (${Object.keys(ticket1.design_system_components).length} components)`);
    console.info(`   📋 ${ticket2.ticket_info.feature} (${Object.keys(ticket2.design_system_components).length} components)`);

    const mergedComponents = mergeDesignSystemComponents(ticket1.design_system_components, ticket2.design_system_components);

    const migrationSummary = calculateMigrationSummary(mergedComponents);

    const mergedTicket = {
        ticket_info: {
            project: ticket1.ticket_info.project,
            feature: generateMergedFeatureName(ticket1, ticket2),
            ticket_id: generateMergedTicketId(ticket1, ticket2),
            generated_at: new Date().toISOString(),
        },
        design_system_components: mergedComponents,
        migration_summary: migrationSummary,
    };

    console.info(`✅ Merged ticket created:`);
    console.info(`   🎯 Feature: ${mergedTicket.ticket_info.feature}`);
    console.info(`   🆔 ID: ${mergedTicket.ticket_info.ticket_id}`);
    console.info(`   📊 Components: ${migrationSummary.total_components}`);
    console.info(`   📊 Occurrences: ${migrationSummary.total_occurrences}`);
    console.info(`   📊 Affected files: ${migrationSummary.affected_files}`);

    return mergedTicket;
}

function saveTicket(ticket, outputPath) {
    try {
        const content = JSON.stringify(ticket, null, 2);
        fs.writeFileSync(outputPath, content, 'utf8');
        console.info(`💾 Merged ticket saved to: ${outputPath}`);
    } catch (error) {
        console.error(`❌ Error saving merged ticket:`, error.message);
        process.exit(1);
    }
}

function validateMergedTicket(ticket) {
    const requiredFields = ['ticket_info', 'design_system_components', 'migration_summary'];
    const missing = requiredFields.filter((field) => !ticket[field]);

    if (missing.length > 0) {
        console.error(`❌ Merged ticket is missing required fields: ${missing.join(', ')}`);
        return false;
    }

    const requiredTicketInfo = ['project', 'feature', 'ticket_id', 'generated_at'];
    const missingTicketInfo = requiredTicketInfo.filter((field) => !ticket.ticket_info[field]);

    if (missingTicketInfo.length > 0) {
        console.error(`❌ Merged ticket is missing required ticket_info fields: ${missingTicketInfo.join(', ')}`);
        return false;
    }

    const requiredSummary = ['total_components', 'total_occurrences', 'affected_files'];
    const missingSummary = requiredSummary.filter((field) => typeof ticket.migration_summary[field] !== 'number');

    if (missingSummary.length > 0) {
        console.error(`❌ Merged ticket is missing required migration_summary fields: ${missingSummary.join(', ')}`);
        return false;
    }

    console.info(`✅ Merged ticket validation passed`);
    return true;
}

function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error(`❌ Usage: node 05-merge-migration-tickets.mjs <ticket1.json> <ticket2.json> [output.json]`);
        console.error(
            `   Example: node 05-merge-migration-tickets.mjs samples/category-navigation.ticket.json samples/arcade-game-lobby.ticket.json merged-ticket.json`,
        );
        process.exit(1);
    }

    const [ticket1Path, ticket2Path, outputPath] = args;

    const resolvedTicket1Path = path.resolve(ticket1Path);
    const resolvedTicket2Path = path.resolve(ticket2Path);
    const resolvedOutputPath = outputPath ? path.resolve(outputPath) : path.resolve('merged-ticket.json');

    console.info(`🚀 Starting ticket merge process...`);
    console.info(`📂 Ticket 1: ${resolvedTicket1Path}`);
    console.info(`📂 Ticket 2: ${resolvedTicket2Path}`);
    console.info(`📂 Output: ${resolvedOutputPath}`);
    console.info();

    const ticket1 = loadTicket(resolvedTicket1Path);
    const ticket2 = loadTicket(resolvedTicket2Path);

    const mergedTicket = mergeTickets(ticket1, ticket2);

    if (!validateMergedTicket(mergedTicket)) {
        console.error(`❌ Merged ticket validation failed`);
        process.exit(1);
    }

    saveTicket(mergedTicket, resolvedOutputPath);

    console.info();
    console.info(`🎉 Ticket merge completed successfully!`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { mergeTickets, loadTicket, saveTicket };
