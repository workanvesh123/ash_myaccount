import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Extracts component selector from TypeScript file content
 * Reads @Component decorator and extracts selector value
 */
function extractSelector(tsContent) {
    const selectorMatch = tsContent.match(/selector:\s*['"`]([^'"`]+)['"`]/);
    return selectorMatch ? selectorMatch[1] : null;
}

/**
 * Extracts component class name from TypeScript file content
 * Reads export statement and extracts class name
 */
function extractClassName(tsContent) {
    const classMatch = tsContent.match(/export\s+class\s+(\w+)/);
    return classMatch ? classMatch[1] : null;
}

/**
 * Extracts templateUrl from @Component decorator
 * Returns relative path or null if inline template
 */
function extractTemplateUrl(tsContent) {
    const templateUrlMatch = tsContent.match(/templateUrl:\s*['"`]([^'"`]+)['"`]/);
    return templateUrlMatch ? templateUrlMatch[1] : null;
}

/**
 * Extracts styleUrls from @Component decorator
 * Returns array of relative paths or empty array if inline styles
 */
function extractStyleUrls(tsContent) {
    const styleUrlsMatch = tsContent.match(/styleUrls:\s*\[([\s\S]*?)\]/);
    if (!styleUrlsMatch) return [];

    const urlsString = styleUrlsMatch[1];
    const urls = urlsString.match(/['"`]([^'"`]+)['"`]/g);
    return urls ? urls.map((url) => url.replace(/['"`]/g, '')) : [];
}

/**
 * Checks if component uses inline template
 */
function hasInlineTemplate(tsContent) {
    return /template:\s*['"`]/.test(tsContent);
}

/**
 * Checks if component uses inline styles
 */
function hasInlineStyles(tsContent) {
    return /styles:\s*\[/.test(tsContent);
}

/**
 * Derives component class name from file path as fallback
 * Example: "bonus-supression-popup.component.html" -> "BonusSupressionPopupComponent"
 */
function deriveComponentName(filePath) {
    const fileName = filePath.split('/').pop() || '';
    const baseName = fileName.replace('.component.html', '');

    // Convert kebab-case to PascalCase
    const pascalCase = baseName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    return `${pascalCase}Component`;
}

/**
 * Derives component selector from file path as fallback
 * Example: "bonus-supression-popup.component.html" -> "bonus-supression-popup"
 */
function deriveSelector(filePath) {
    const fileName = filePath.split('/').pop() || '';
    return fileName.replace('.component.html', '');
}

/**
 * Extracts package name from file path
 * Example: "ui-lib/shared/src/components/..." -> "bingo" (from rootPath)
 */
function extractPackageName(rootPath) {
    // rootPath format: "./packages/bingo"
    const parts = rootPath.split('/');
    return parts[parts.length - 1];
}

/**
 * Extracts library name from file path
 * Example: "ui-lib/shared/src/components/..." -> "ui-lib"
 */
function extractLibraryName(filePath) {
    const parts = filePath.split('/');
    return parts[0];
}

/**
 * Converts HTML file path to TypeScript file path
 * Example: "ui-lib/shared/src/components/bonus-supression/bonus-supression-popup.component.html"
 *       -> "ui-lib/shared/src/components/bonus-supression/bonus-supression-popup.component.ts"
 */
function htmlToTsPath(htmlPath) {
    return htmlPath.replace('.component.html', '.component.ts');
}

/**
 * Extracts unique DS components from violation file
 */
function extractDsComponents(file) {
    const components = new Set();
    file.components.forEach((comp) => {
        components.add(comp.replacement);
    });
    return Array.from(components).sort();
}

/**
 * Maps DS component name to steering file path
 * Example: "DsButton" -> ".kiro/steering/topics/design-system/components/ds-button.md"
 */
function mapDsComponentToSteeringFile(dsComponentName) {
    // Convert PascalCase to kebab-case: DsButton -> ds-button
    const kebabCase = dsComponentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    return `.kiro/steering/topics/design-system/components/${kebabCase}.md`;
}

/**
 * Maps DS components to their steering files and verifies existence
 */
function mapDsComponentsToSteeringFiles(dsComponents) {
    return dsComponents.map((componentName) => {
        const steeringPath = mapDsComponentToSteeringFile(componentName);
        return {
            component: componentName,
            steeringFile: steeringPath,
            exists: existsSync(steeringPath),
        };
    });
}

/**
 * Parses violations-group.json and extracts component metadata
 */
export function parseViolationsGroup(specDirectory) {
    const filePath = join(specDirectory, 'data', 'violations-group.json');
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Extract unique component paths
    const uniqueComponents = new Map();

    data.files.forEach((file) => {
        const tsPath = htmlToTsPath(file.file);
        if (!uniqueComponents.has(tsPath)) {
            uniqueComponents.set(tsPath, file);
        }
    });

    // Derive component metadata
    const components = [];
    const packageName = extractPackageName(data.rootPath);

    uniqueComponents.forEach((file, tsPath) => {
        const libraryName = extractLibraryName(file.file);
        const dsComponentNames = extractDsComponents(file);
        const dsComponents = mapDsComponentsToSteeringFiles(dsComponentNames);

        // Construct full TypeScript file path
        const fullTsPath = `${data.rootPath.replace('./', '')}/${tsPath}`;

        // Construct root path (directory containing the component)
        const pathParts = tsPath.split('/');
        pathParts.pop(); // Remove filename
        const rootPath = `${data.rootPath.replace('./', '')}/${pathParts.join('/')}`;

        // Read TypeScript file and extract actual metadata
        let componentName = deriveComponentName(file.file);
        let selector = deriveSelector(file.file);
        let extractionMethod = 'derived';
        let templatePath = fullTsPath.replace('.component.ts', '.component.html');
        let stylePaths = [];
        let hasInlineTemplateFlag = false;
        let hasInlineStylesFlag = false;

        try {
            if (existsSync(fullTsPath)) {
                const tsContent = readFileSync(fullTsPath, 'utf-8');

                // Extract selector and class name
                const extractedSelector = extractSelector(tsContent);
                const extractedClassName = extractClassName(tsContent);

                if (extractedSelector) {
                    selector = extractedSelector;
                    extractionMethod = 'extracted';
                }

                if (extractedClassName) {
                    componentName = extractedClassName;
                    extractionMethod = 'extracted';
                }

                // Extract template path or detect inline
                hasInlineTemplateFlag = hasInlineTemplate(tsContent);
                if (!hasInlineTemplateFlag) {
                    const extractedTemplateUrl = extractTemplateUrl(tsContent);
                    if (extractedTemplateUrl) {
                        // Resolve relative path from component directory
                        templatePath = join(rootPath, extractedTemplateUrl);
                    }
                }

                // Extract style paths or detect inline
                hasInlineStylesFlag = hasInlineStyles(tsContent);
                if (!hasInlineStylesFlag) {
                    const extractedStyleUrls = extractStyleUrls(tsContent);
                    if (extractedStyleUrls.length > 0) {
                        stylePaths = extractedStyleUrls.map((url) => join(rootPath, url));
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠ Could not read ${fullTsPath}, using derived values: ${error.message}`);
        }

        // Verify template file exists (unless inline)
        const templateExists = hasInlineTemplateFlag ? true : existsSync(templatePath);

        // Verify style files exist (unless inline or none specified)
        let styleFiles = [];
        if (hasInlineStylesFlag) {
            styleFiles = [{ path: 'inline', exists: true }];
        } else if (stylePaths.length > 0) {
            styleFiles = stylePaths.map((path) => ({ path, exists: existsSync(path) }));
        } else {
            // No styleUrls specified - check for default files
            const scssPath = fullTsPath.replace('.component.ts', '.component.scss');
            const cssPath = fullTsPath.replace('.component.ts', '.component.css');
            if (existsSync(scssPath)) {
                styleFiles = [{ path: scssPath, exists: true }];
            } else if (existsSync(cssPath)) {
                styleFiles = [{ path: cssPath, exists: true }];
            }
        }

        components.push({
            tsFilePath: fullTsPath,
            packageName,
            libraryName,
            componentName,
            selector,
            rootPath,
            dsComponents,
            extractionMethod,
            files: {
                typescript: { path: fullTsPath, exists: true },
                template: hasInlineTemplateFlag ? { path: 'inline', exists: true } : { path: templatePath, exists: templateExists },
                styles: styleFiles.length > 0 ? styleFiles : [{ path: null, exists: false }],
            },
        });
    });

    // Sort by tsFilePath for consistent ordering
    components.sort((a, b) => a.tsFilePath.localeCompare(b.tsFilePath));

    return components;
}

/**
 * Generates a summary report of parsed components
 */
export function generateComponentSummary(components) {
    let summary = '# Component Analysis Summary\n\n';
    summary += `Total unique components: ${components.length}\n\n`;
    summary += '## Components to Analyze\n\n';

    components.forEach((comp, index) => {
        summary += `### ${index + 1}. ${comp.componentName}\n\n`;
        summary += `- **Package:** ${comp.packageName}\n`;
        summary += `- **Library:** ${comp.libraryName}\n`;
        summary += `- **Selector:** ${comp.selector} ${comp.extractionMethod === 'extracted' ? '✓' : '(derived)'}\n`;
        summary += `- **Root Path:** ${comp.rootPath}\n`;
        summary += `- **DS Components:** ${comp.dsComponents.map((ds) => ds.component).join(', ')}\n`;
        summary += `- **Files:**\n`;
        summary += `  - TypeScript: ${comp.files.typescript.exists ? '✓' : '✗'} ${comp.files.typescript.path}\n`;
        summary += `  - Template: ${comp.files.template.exists ? '✓' : '✗'} ${comp.files.template.path}\n`;

        if (comp.files.styles.length === 1 && comp.files.styles[0].path === null) {
            summary += `  - Styles: ✗ (none found)\n`;
        } else {
            comp.files.styles.forEach((style, idx) => {
                const prefix = idx === 0 ? '  - Styles: ' : '           ';
                summary += `${prefix}${style.exists ? '✓' : '✗'} ${style.path}\n`;
            });
        }

        summary += `- **DS Steering Files:**\n`;
        comp.dsComponents.forEach((ds) => {
            summary += `  - ${ds.component}: ${ds.exists ? '✓' : '✗'} ${ds.steeringFile}\n`;
        });
        summary += '\n';
    });

    return summary;
}

// CLI execution
import { writeFileSync } from 'fs';

const specDir = process.argv[2] || '.kiro/specs/ds-violation-group-analysis';

try {
    console.log('Parsing violations-group.json...\n');
    const components = parseViolationsGroup(specDir);

    const summary = generateComponentSummary(components);

    // Save parsed components JSON
    const jsonOutputPath = join(specDir, 'data', 'parsed-components.json');
    writeFileSync(jsonOutputPath, JSON.stringify(components, null, 2), 'utf-8');
    console.log(`✓ Saved parsed components to: ${jsonOutputPath}`);

    // Save summary report
    const summaryOutputPath = join(specDir, 'data', 'component-summary.md');
    writeFileSync(summaryOutputPath, summary, 'utf-8');
    console.log(`✓ Saved component summary to: ${summaryOutputPath}`);

    console.log(`\n✓ Successfully parsed ${components.length} components\n`);
    console.log(summary);
} catch (error) {
    console.error('Error parsing violations:', error);
    process.exit(1);
}
