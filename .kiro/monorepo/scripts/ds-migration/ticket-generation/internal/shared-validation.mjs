/**
 * Shared Validation Functions for Migration Tickets
 *
 * Common validation logic used by both the ticket generator and standalone validator.
 */

const validateRequiredFields = (obj, fields, prefix, issues) => {
    fields.forEach((field) => !obj[field] && issues.push(`${prefix}.${field} is required`));
};

const validateNonNegativeNumber = (value, fieldPath, issues) => {
    if (typeof value !== 'number' || value < 0) issues.push(`${fieldPath} must be a non-negative number`);
};

const validateStringFields = (obj, fields, prefix, issues) => {
    fields.forEach((field) => typeof obj[field] !== 'string' && issues.push(`${prefix}.${field} must be a string`));
};

const validateTicketInfo = (ticketInfo, issues) => {
    if (!ticketInfo) return issues.push('Missing ticket_info');

    const { ticket_id, generated_at } = ticketInfo;
    validateRequiredFields(ticketInfo, ['project', 'feature', 'ticket_id', 'generated_at'], 'ticket_info', issues);
    if (ticket_id && !/^[a-zA-Z0-9.-]+-migration$/.test(ticket_id))
        issues.push('ticket_info.ticket_id must match pattern: {project}-{feature}-migration');
    if (generated_at && !Date.parse(generated_at)) issues.push('ticket_info.generated_at must be a valid ISO 8601 date');
};

const validateDesignSystemInfo = (info, prefix, issues) => {
    if (!info) return issues.push(`${prefix}.design_system_info is required`);

    const infoPrefix = `${prefix}.design_system_info`;
    validateRequiredFields(info, ['name', 'selector'], infoPrefix, issues);
    validateStringFields(info, ['storybook_path', 'implementation_path'], infoPrefix, issues);
    if (info.name && !/^[a-z\d-]+$/.test(info.name)) issues.push(`${infoPrefix}.name must contain only lowercase letters, numbers, and hyphens`);
};

const validateOccurrences = (occurrences, prefix, issues) => {
    if (!Array.isArray(occurrences)) return issues.push(`${prefix}.feature_occurrences must be an array`);

    occurrences.forEach((occ, idx) => {
        const occPrefix = `${prefix}.feature_occurrences[${idx}]`;
        validateRequiredFields(occ, ['feature', 'file_path', 'project'], occPrefix, issues);
        if (Array.isArray(occ.lines)) {
            occ.lines.forEach((line, lineIdx) => {
                if (typeof line !== 'number' || line < 1) issues.push(`${occPrefix}.lines[${lineIdx}] must be a positive integer`);
            });
        } else {
            issues.push(`${occPrefix}.lines must be an array`);
        }
    });
};

const validateImplementations = (implementations, prefix, issues) => {
    if (!Array.isArray(implementations)) return issues.push(`${prefix}.project_implementations must be an array`);

    implementations.forEach((impl, idx) => {
        const implPrefix = `${prefix}.project_implementations[${idx}]`;
        validateRequiredFields(impl, ['component_name', 'project', 'relative_path'], implPrefix, issues);
        if (!Array.isArray(impl.lines)) issues.push(`${implPrefix}.lines must be an array`);
        if (typeof impl.score !== 'number' || impl.score < 0) issues.push(`${implPrefix}.score must be a non-negative number`);
    });
};

const validateStats = (stats, prefix, fieldName, issues) => {
    if (!stats) return issues.push(`${prefix}.${fieldName} is required`);
    Object.keys(stats).forEach((key) => validateNonNegativeNumber(stats[key], `${prefix}.${fieldName}.${key}`, issues));
};

const validateDesignSystemComponents = (components, issues) => {
    if (!components || typeof components !== 'object') return issues.push('design_system_components must be an object');

    Object.entries(components).forEach(([name, component]) => {
        const prefix = `design_system_components.${name}`;

        if (!/^[a-z\d-]+$/.test(name)) issues.push(`Component name '${name}' must contain only lowercase letters, numbers, and hyphens`);

        validateDesignSystemInfo(component.design_system_info, prefix, issues);
        validateOccurrences(component.feature_occurrences, prefix, issues);
        validateImplementations(component.project_implementations, prefix, issues);
        validateStats(component.occurrence_stats, prefix, 'occurrence_stats', issues);
        validateStats(component.implementation_stats, prefix, 'implementation_stats', issues);
    });
};

const validateMigrationSummary = (summary, issues) => {
    if (!summary) return issues.push('migration_summary is required');
    ['total_components', 'total_occurrences', 'affected_files'].forEach((field) =>
        validateNonNegativeNumber(summary[field], `migration_summary.${field}`, issues),
    );
};

/**
 * Main validation function for migration tickets
 */
export const validateTicketStructure = (ticket) => {
    const issues = [];
    if (!ticket || typeof ticket !== 'object') return ['Ticket must be an object'];

    validateTicketInfo(ticket.ticket_info, issues);
    validateDesignSystemComponents(ticket.design_system_components, issues);
    validateMigrationSummary(ticket.migration_summary, issues);

    return issues;
};

// Export helper functions for more granular validation if needed
export {
    validateRequiredFields,
    validateNonNegativeNumber,
    validateStringFields,
    validateTicketInfo,
    validateDesignSystemInfo,
    validateOccurrences,
    validateImplementations,
    validateStats,
    validateDesignSystemComponents,
    validateMigrationSummary,
};
