// Date: 25/03/2025
// getGenePathways.js converted to TypeScript  
// IBIX2 Group Project 2025  

export async function getGenePathways(keggIDs: string[], organismCode: string): Promise<string[]> {
    let allPaths: string[] = [];

    for (const id of keggIDs) {
        const url = `https://rest.kegg.jp/link/pathway/${organismCode}:${id}`;

        try {
            // Fetch the URL response
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error fetching pathways for gene ${id}: ${response.statusText}`);
            }

            const text = await response.text();
            const lines = text.split('\n');
            const result = lines.map(line => line.split('\t'));

            let paths: string[] = [];

            for (const entry of result) {
                entry.forEach(item => {
                    if (item.includes('path:')) {
                        const match = item.match(/path:\s*(.*)/); // Use \s* to capture any whitespace
                        if (match && match[1]) {
                            paths.push(match[1]);
                        }
                    }
                });
            }

            addUniqueElements(allPaths, paths);
        } catch (error) {
            console.error('Error fetching KEGG pathways:', error);
        }
    }

    return allPaths;
}

function addUniqueElements(allPaths: string[], paths: string[]): void {
    paths.forEach(path => {
        if (!allPaths.includes(path)) {
            allPaths.push(path);
        }
    });
}

export async function getUniquePathways(keggIDs: string[], organismCode: string): Promise<string[]> {
    const pathways = await getGenePathways(keggIDs, organismCode);
    return Array.from(new Set(pathways)); // Removes duplicates and returns unique pathways
}