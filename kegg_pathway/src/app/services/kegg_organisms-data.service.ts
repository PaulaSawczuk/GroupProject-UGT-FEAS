/**
 * Date: 25/03/2025
 * Paula Sawczuk
 * IBIX2 Group Project 2025
 *
 * KeggDataService: Manages the retrieval, storage, and manipulation of KEGG organism data.
 * This service fetches organism data from a remote API, stores it locally for performance,
 * and provides methods to search and filter the data.
 */

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common'; 

interface KEGGOrganism {
  id: string;
  code: string;
  name: string;
  taxonomy: string;
  kingdom: string;    
  subgroup: string;   
  organismClass: string;
}

@Injectable({
  providedIn: 'root',
})
export class KeggDataService {
  private readonly KEGG_URL = '/api/list/organism'; // URL endpoint for fetching organism data.
  private readonly STORAGE_KEY = 'keggOrganisms'; // Key used to store organism data in local storage.
  private readonly TIMESTAMP_KEY = 'keggTimestamp'; // Key used to store the timestamp of data retrieval.
  private readonly EXPIRY_TIME = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months in milliseconds, defines data expiration.

  private organisms: KEGGOrganism[] = []; // Internal array to hold organism data.

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
        this.organisms = JSON.parse(storedData);
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
  fetchKEGGData(): Observable<KEGGOrganism[]> {
    return this.http.get(this.KEGG_URL, { responseType: 'text' }).pipe(
      map(response => {
        return response.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => {
            const [id, code, name, taxonomy] = line.split('\t');
            const taxonomyElements = taxonomy.split(';').map(el => el.trim());
  
            // Extracts kingdom, subgroup, and organism class from taxonomy elements.
            const kingdom = taxonomyElements[1] || '';
            const subgroup = taxonomyElements[2] || '';
            const organismClass = taxonomyElements[3] || '';
  
            return {
              id,
              code,
              name,
              taxonomy,
              kingdom,
              subgroup,
              organismClass 
            } as KEGGOrganism;
          });
      }),
      tap(data => {
        // Caches the fetched data in local storage along with a timestamp.
        if (isPlatformBrowser(this.platformId)) {
          this.organisms = data;
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
  searchOrganisms(query: string): KEGGOrganism[] {
    return this.organisms.filter(org =>
      org.name.toLowerCase().includes(query.toLowerCase()) ||
      org.code.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Retrieves a list of unique kingdoms from the organism data.
   *
   * @returns An array of unique kingdom strings.
   */
  getUniqueKingdoms(): string[] {
    const kingdoms = this.organisms.map(organism => organism.kingdom);
    return Array.from(new Set(kingdoms));
  }

  /**
   * Retrieves a list of unique subgroups for a given kingdom.
   *
   * @param kingdom - The kingdom to filter by.
   * @returns An array of unique subgroup strings.
   */
  getSubgroups(kingdom: string): string[] {
    const filteredOrganisms = this.organisms.filter(organism => organism.kingdom === kingdom);
    const subgroups = filteredOrganisms.map(organism => organism.subgroup);
    return Array.from(new Set(subgroups));
  }

  /**
   * Retrieves a list of unique organism classes for a given kingdom and subgroup.
   *
   * @param kingdom - The kingdom to filter by.
   * @param subgroup - The subgroup to filter by.
   * @returns An array of unique organism class strings.
   */
  getOrganismClass(kingdom: string, subgroup: string): string[] {
    const filteredOrganisms = this.organisms.filter(organism => organism.kingdom === kingdom && organism.subgroup === subgroup);
    const organismClass = filteredOrganisms.map(organism => organism.organismClass);
    return Array.from(new Set(organismClass));
  }

  /**
   * Retrieves a list of unique organism names for a given kingdom, subgroup and organism class.
   *
   * @param kingdom - The kingdom to filter by.
   * @param subgroup - The subgroup to filter by.
   * @param organismclass - the organism class to filter by.
   * @returns An array of unique organism name strings.
   */
  getOrganismName(kingdom: string, subgroup: string, organismclass: string): string[] {
    const filteredOrganisms = this.organisms.filter(organism => organism.kingdom === kingdom && organism.subgroup === subgroup && organism.organismClass === organismclass);
    const organismName = filteredOrganisms.map(organism => organism.name);
    return Array.from(new Set(organismName));
  }

}