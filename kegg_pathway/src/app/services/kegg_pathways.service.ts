// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, of } from 'rxjs';
// import { map, tap } from 'rxjs/operators';
// import { isPlatformBrowser } from '@angular/common';

// interface KEGGPathway {
//   path: string;
//   code: string; // Added a code property to associate pathways with organism codes
// }

// @Injectable({
//   providedIn: 'root',
// })


// export class KeggPathwaysService {
//     private hardcodedFilePath: string = 'assets/KEGG_IDs.csv';
//     private pathways: KEGGPathway[] = [];
//     private keggIds: { code: string, id: string }[] = [];
  
//     constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
//       if (isPlatformBrowser(this.platformId)) {
//         this.loadKEGGIDs();
//       }
//     }
  

//   private loadKEGGIDs(): void {
//     // Load KEGG IDs from the CSV file
//     if (isPlatformBrowser(this.platformId)) {
//       // Example: Using a fetch to get the csv file
//       fetch(this.hardcodedFilePath)
//         .then(response => response.text())
//         .then(data => {
//           const rows = data.split('\n').map(row => row.split(','));
//           rows.forEach(entry => {
//             const [code, id] = entry; // Adjust the indices based on the actual CSV structure
//             if (code && id) {
//               this.keggIds.push({ code, id });
//             }
//           });
//         })
//         .catch(error => console.error('Error loading KEGG IDs:', error));
//     }
//   }

//   fetchKEGGPathways(code: string): Observable<KEGGPathway[]> {
//     const organismId = this.keggIds.find(keggId => keggId.code === code)?.id;
  
//     if (!organismId) {
//       console.warn(`Organism code "${code}" not found in KEGG IDs.`);
//       return of([]); // Return an empty observable if the code is not found
//     }
  
//     // Correctly constructing the KEGG API URL
//     const url = `https://rest.kegg.jp/list/pathway/${organismId}`;
  
//     return this.http.get(url, { responseType: 'text' }).pipe(
//       map(response => {
//         return response
//           .split('\n') // Split response into lines
//           .map(line => {
//             const parts = line.split('\t'); // Split line into tab-separated parts
//             if (parts.length >= 2) {
//               const pathwayCode = parts[0].replace('path:', '').trim(); // Extract pathway code
//               const pathwayName = parts[1].trim(); // Extract pathway name
//               return { code: pathwayCode, path: pathwayName } as KEGGPathway;
//             }
//             return null;
//           })
//           .filter((item): item is KEGGPathway => item !== null); // Remove null values
//       }),
//       tap(pathways => {
//         this.pathways = pathways; // Store pathways
//       })
//     );
//   }
  

//   private parseResponse(response: string): string[] {
//     const lines = response.split('\n');
//     const paths: string[] = [];

//     lines.forEach(line => {
//       if (line.includes('path:')) {
//         const match = line.match(/path:\s*(.*)/); // Match pathways
//         if (match && match[1]) {
//           paths.push(match[1].trim());
//         }
//       }
//     });

//     return paths;
//   }

//   getUniquePathways(): string[] {
//     const uniquePaths = Array.from(new Set(this.pathways.map(p => p.path)));
//     return uniquePaths; // Return unique pathways
//   }
// }

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { map, tap, switchMap, mergeMap, toArray } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

interface KEGGPathway {
  path: string;
  code: string;
}

@Injectable({
  providedIn: 'root',
})
export class KeggPathwaysService {
    private hardcodedFilePath: string = 'assets/KEGG_IDs.csv';
    private pathways: KEGGPathway[] = [];
    private keggIds: { code: string, id: string }[] = [];

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  private loadKEGGIDs(): Observable<void> {
    if (isPlatformBrowser(this.platformId)) {
      return from(fetch(this.hardcodedFilePath).then(res => res.text())).pipe(
        map(data => {
          const rows = data.split('\n').map(row => row.split(','));
          this.keggIds = rows
            .map(entry => ({ code: entry[0]?.trim(), id: entry[1]?.trim() }))
            .filter(entry => entry.code && entry.id);
        })
      );
    }
    return of();
  }

  fetchKEGGPathways(code: string): Observable<KEGGPathway[]> {
    return this.loadKEGGIDs().pipe(
      switchMap(() => {
        const organismId = this.keggIds.find(keggId => keggId.code === code)?.id;
        if (!organismId) {
          console.warn(`Organism code "${code}" not found.`);
          return of([]);
        }

        const url = `https://rest.kegg.jp/list/pathway/${organismId}`;
        return this.http.get(url, { responseType: 'text' }).pipe(
          map(response => response.split('\n')
            .map(line => {
              const parts = line.split('\t');
              return parts.length >= 2 ? { code: parts[0].replace('path:', '').trim(), path: parts[1].trim() } : null;
            })
            .filter((item): item is KEGGPathway => item !== null)
          ),
          switchMap(pathways => this.filterPathwaysByGenes(organismId, pathways)), // Filter pathways
          tap(pathways => this.pathways = pathways)
        );
      })
    );
  }

  private filterPathwaysByGenes(organismId: string, pathways: KEGGPathway[]): Observable<KEGGPathway[]> {
    const geneIDs = this.keggIds.filter(keggId => keggId.code === organismId).map(keggId => keggId.id);

    return from(pathways).pipe(
      mergeMap(pathway => {
        const url = `https://rest.kegg.jp/link/genes/${pathway.code}`;
        return this.http.get(url, { responseType: 'text' }).pipe(
          map(response => {
            const genes = response.split('\n').map(line => {
              const parts = line.split('\t');
              return parts.length >= 2 ? parts[1].replace(`${organismId}:`, '').trim() : null;
            }).filter((gene): gene is string => gene !== null);

            const hasMatchingGene = genes.some(gene => geneIDs.includes(gene));
            return hasMatchingGene ? pathway : null;
          })
        );
      }),
      toArray(),
      map(filtered => filtered.filter((item): item is KEGGPathway => item !== null))
    );
  }

  getUniquePathways(): string[] {
    return Array.from(new Set(this.pathways.map(p => p.path)));
  }
}
