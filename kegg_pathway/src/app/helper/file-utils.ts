/*** 
 * // Date: 08/04/2025
 * // Mable Chungu
 * // IBIX2 Group Project 2025 
***/

/***
// Shared Methods For Loading Files
***/

// Contains methods to check file types
export function identifyFileType(data: string[][], filename: string): string {
    if (data.length === 0 || data[0].length === 0) return 'unknown';

    const header = data[0].map(col => col.toLowerCase());

    // Check if it's an expression file (gene and log2FoldChange)
    if (header.includes('gene') && header.includes('log2foldchange')) {
        return 'expression';
    }

    // Check if it's an annotation file (look for specific annotation columns)
    if (header.includes('sequence.name') ||
        header.includes('annotation.go.id') ||
        header.includes('enzyme.code') ||
        (header.includes('go') && header.includes('enzyme'))) {
        return 'annotation';
    }

    // If first column has gene IDs and subsequent columns are numeric, it's likely a count matrix
    if (data.length > 1 && data[1].length > 1) {
        // Check if second column onwards appears to be numeric data
        let hasNumericData = false;
        for (let i = 1; i < Math.min(5, data.length); i++) {
            for (let j = 1; j < data[i].length; j++) {
                // Check if this looks like a number
                if (!isNaN(parseFloat(data[i][j])) && data[i][j].trim() !== '') {
                    hasNumericData = true;
                    break;
                }
            }
            if (hasNumericData) break;
        }

        if (hasNumericData) {
            return 'countMatrix';
        }
    }

    return 'unknown';
}


export function parseFileContent(content: string, fileName: string, fileExtension: string): string[][] | null {
    const data: string[][] = [];

    // Check if content is empty
    if (!content || content.trim() === '') {
        console.warn(`File ${fileName} is empty`);
        return null;
    }

    const lines = content.split(/\r?\n/); // Handle different line endings

    // Try to detect the delimiter
    let separator = fileExtension === 'csv' ? ',' : '\t';

    // Additional check to better detect the delimiter
    if (lines.length > 0) {
        const firstLine = lines[0];
        const commaCount = (firstLine.match(/,/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;

        // Choose the most frequent delimiter
        if (semicolonCount > commaCount && semicolonCount > tabCount) {
            separator = ';';
        } else if (tabCount > commaCount) {
            separator = '\t';
        } else {
            separator = ',';
        }

        console.log(`Detected separator for ${fileName}: "${separator}"`);
    }

    for (const line of lines) {
        if (line.trim() === '') continue; // Skip empty lines
        const values = line.split(separator);

        // If we only got 1 value and the separator is likely wrong, try alternatives
        if (values.length <= 1 && line.length > 0) {
            // Try alternative separators
            const alternatives = [',', '\t', ';'].filter(s => s !== separator);

            for (const altSep of alternatives) {
                const altValues = line.split(altSep);
                if (altValues.length > 1) {
                    // We found a better separator - use it for the whole file
                    separator = altSep;
                    console.log(`Switching to better separator for ${fileName}: "${separator}"`);

                    // Start over with the new separator
                    return parseFileContent(content, fileName, fileExtension);
                }
            }

            // If we get here, we couldn't find a good separator
            console.warn(`Couldn't find a suitable delimiter for ${fileName}`);
        }

        data.push(values);
    }

    if (data.length === 0) {
        console.warn(`No data was parsed from ${fileName}`);
        return null;
    }

    console.log(`Parsed ${data.length} rows from ${fileName}`);
    return data;
}
