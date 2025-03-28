import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common'; 
import { KeggPathwaysService } from './kegg_pathways.service';


interface KEGGPathway {
    enzyme: string;
    pathway: string;
  }


@Injectable({
  providedIn: 'root',
})
export class KeggDataService {
  private readonly KEGG_URL = '/api/link/pathway'; // URL endpoint for fetching organism data.
  private readonly STORAGE_KEY = 'keggOrganisms'; // Key used to store organism data in local storage.
  private readonly TIMESTAMP_KEY = 'keggTimestamp'; // Key used to store the timestamp of data retrieval.
  private readonly EXPIRY_TIME = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months in milliseconds, defines data expiration.

  private pathway: KEGGPathway[] = []; // Internal array to hold organism data.

  /**
   * Constructs the KeggDataService.
   * Initializes the service by attempting to load data from local storage if the application is running in a browser environment.
   * If the data is not available or has expired, it triggers a fetch from the remote API.
   *
   * @param http - Angular's HttpClient for making HTTP requests.
   * @param platformId - Angular's platform identifier for distinguishing between browser and server environments.
   */
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredData(); 
    }
  }

  /**
   * Loads organism data from local storage.
   * Checks if the data exists and is within the expiry time. If so, loads it into the internal `organisms` array.
   * Otherwise, triggers a fetch from the remote API.
   */
  private loadStoredData(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      const timestamp = localStorage.getItem(this.TIMESTAMP_KEY);
      const now = Date.now();

      if (storedData && timestamp && now - parseInt(timestamp, 10) < this.EXPIRY_TIME) {
        this.pathway = JSON.parse(storedData);
      } else {
        this.fetchKEGGData().subscribe();
      }
    }
  }

  /**
   * Fetches KEGG organism data from the remote API.
   * Parses the response, extracts relevant information, and stores it in local storage.
   *
   * @returns An Observable of KEGGOrganism arrays.
   */
  fetchKEGGData(): Observable<KEGGPathway[]> {
    return this.http.get(this.KEGG_URL, { responseType: 'text' }).pipe(
      map(response => {
        return response.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => {
            const [enzyme, pathway] = line.split('\t');
            return {
                enzyme,
                pathway,
            } as KEGGPathway;
          });
      }),
      tap(data => {
        // Caches the fetched data in local storage along with a timestamp.
        if (isPlatformBrowser(this.platformId)) {
          this.pathway = data;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
          localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
        }
      })
    );
  }

  /**
   * Searches for organisms based on a query string.
   * Filters the internal `organisms` array by name or code, returning matching organisms.
   *
   * @param query - The search query string.
   * @returns An array of KEGGOrganisms that match the query.
   */
  searchOrganisms(query: string): KEGGPathway[] {
    return this.pathway.filter(org =>
      org.enzyme.toLowerCase().includes(query.toLowerCase()) ||
      org.pathway.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Retrieves a list of unique kingdoms from the organism data.
   *
   * @returns An array of unique kingdom strings.
   */
  getUniquePathways(): string[] {
    const pathways = this.pathway.map(pathway => pathway.pathway);
    return Array.from(new Set(pathways));
  }


}