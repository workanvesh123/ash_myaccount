#!/usr/bin/env node

/**
 * JSON Schema Validator
 *
 * Validates JSON files against JSON Schema definitions.
 * Checks required fields, types, and basic structure.
 *
 * Usage:
 *   node validate-json-schema.mjs <schema-path> <json-path>
 *   node validate-json-schema.mjs <json-path> (auto-detects schema from $schema property)
 *
 * Examples:
 *   node validate-json-schema.mjs ./schemas/component-analysis.schema.json ./data/component-analysis.json
 *   node validate-json-schema.mjs ./data/component-analysis.json
 */

import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';

const errors = [];

/**
 * Load JSON file
 */
async function loadJson(filePath) {
    try {
        const absolutePath = resolve(filePath);
        const content = await readFile(absolutePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File not found: ${filePath}`);
        }
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Resolve schema path from $schema property
 */
function resolveSchemaPath(jsonPath, schemaRef) {
    const jsonDir = dirname(resolve(jsonPath));
    return resolve(jsonDir, schemaRef);
}

/**
 * Validate type
 */
function validateType(value, expectedType, path) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (expectedType === 'integer') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
            errors.push({ path, message: `Expected integer, got ${actualType}`, value });
            return false;
        }
    } else if (expectedType !== actualType) {
        errors.push({ path, message: `Expected ${expectedType}, got ${actualType}`, value });
        return false;
    }

    return true;
}

/**
 * Validate object against schema
 */
function validateObject(data, schema, path = '') {
    if (!schema) return true;

    // Check required fields
    if (schema.required && Array.isArray(schema.required)) {
        for (const field of schema.required) {
            if (!(field in data)) {
                errors.push({ path: `${path}/${field}`, message: 'Required field missing' });
            }
        }
    }

    // Check properties
    if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (key in data) {
                const value = data[key];
                const fieldPath = `${path}/${key}`;

                // Type validation
                if (propSchema.type) {
                    if (!validateType(value, propSchema.type, fieldPath)) {
                        continue;
                    }
                }

                // Nested object validation
                if (propSchema.type === 'object' && value !== null) {
                    validateObject(value, propSchema, fieldPath);
                }

                // Array validation
                if (propSchema.type === 'array' && Array.isArray(value)) {
                    if (propSchema.minItems && value.length < propSchema.minItems) {
                        errors.push({ path: fieldPath, message: `Array must have at least ${propSchema.minItems} items, has ${value.length}` });
                    }
                    if (propSchema.maxItems && value.length > propSchema.maxItems) {
                        errors.push({ path: fieldPath, message: `Array must have at most ${propSchema.maxItems} items, has ${value.length}` });
                    }

                    // Validate array items
                    if (propSchema.items) {
                        value.forEach((item, index) => {
                            if (propSchema.items.type === 'object') {
                                validateObject(item, propSchema.items, `${fieldPath}[${index}]`);
                            } else if (propSchema.items.type) {
                                validateType(item, propSchema.items.type, `${fieldPath}[${index}]`);
                            }
                        });
                    }
                }

                // Enum validation
                if (propSchema.enum && !propSchema.enum.includes(value)) {
                    errors.push({ path: fieldPath, message: `Value must be one of: ${propSchema.enum.join(', ')}`, value });
                }
            }
        }
    }

    return errors.length === 0;
}

/**
 * Format validation errors
 */
function formatErrors() {
    if (errors.length === 0) {
        return 'No errors';
    }

    return errors
        .map((error, index) => {
            let formatted = `\n${index + 1}. Path: ${error.path}`;
            formatted += `\n   Error: ${error.message}`;

            if (error.value !== undefined) {
                const valueStr = typeof error.value === 'string' ? error.value : JSON.stringify(error.value);
                formatted += `\n   Value: ${valueStr.length > 100 ? valueStr.substring(0, 100) + '...' : valueStr}`;
            }

            return formatted;
        })
        .join('\n');
}

/**
 * Validate JSON against schema
 */
async function validateJson(schemaPath, jsonPath) {
    console.log('🔍 Loading files...');
    console.log(`   Schema: ${schemaPath}`);
    console.log(`   JSON:   ${jsonPath}\n`);

    // Load schema
    const schema = await loadJson(schemaPath);
    console.log(`✓ Schema loaded: ${schema.title || 'Untitled'}`);

    // Load JSON data
    const data = await loadJson(jsonPath);
    console.log(`✓ JSON loaded\n`);

    // Validate data
    console.log('✅ Validating...\n');
    errors.length = 0;
    validateObject(data, schema);

    if (errors.length === 0) {
        console.log('✅ Validation successful!');
        console.log('   No errors found.\n');
        return { valid: true, errors: [] };
    } else {
        console.log('❌ Validation failed!\n');
        console.log('Errors:');
        console.log(formatErrors());
        console.log(`\nTotal errors: ${errors.length}\n`);
        return { valid: false, errors };
    }
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Usage:');
        console.error('  node validate-json-schema.mjs <schema-path> <json-path>');
        console.error('  node validate-json-schema.mjs <json-path> (auto-detects schema)\n');
        console.error('Examples:');
        console.error('  node validate-json-schema.mjs ./schemas/component-analysis.schema.json ./data/component-analysis.json');
        console.error('  node validate-json-schema.mjs ./data/component-analysis.json');
        process.exit(1);
    }

    let schemaPath, jsonPath;

    if (args.length === 1) {
        // Auto-detect schema from $schema property
        jsonPath = args[0];
        console.log('🔍 Auto-detecting schema from $schema property...\n');

        const data = await loadJson(jsonPath);

        if (!data.$schema) {
            console.error('❌ Error: JSON file does not contain $schema property');
            console.error('   Please specify schema path explicitly or add $schema property to JSON file\n');
            process.exit(1);
        }

        schemaPath = resolveSchemaPath(jsonPath, data.$schema);
        console.log(`✓ Schema detected: ${schemaPath}\n`);
    } else {
        // Explicit schema and JSON paths
        schemaPath = args[0];
        jsonPath = args[1];
    }

    try {
        const result = await validateJson(schemaPath, jsonPath);
        process.exit(result.valid ? 0 : 1);
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}\n`);
        process.exit(1);
    }
}

main();
