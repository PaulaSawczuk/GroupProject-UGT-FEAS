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
  private readonly KEGG_URL = '/api/list/organism';
  private readonly STORAGE_KEY = 'keggOrganisms';
  private readonly TIMESTAMP_KEY = 'keggTimestamp';
  private readonly EXPIRY_TIME = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months in milliseconds

  private organisms: KEGGOrganism[] = [];

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredData(); 
    }
  }

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

  fetchKEGGData(): Observable<KEGGOrganism[]> {
    return this.http.get(this.KEGG_URL, { responseType: 'text' }).pipe(
      map(response => {
        return response.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => {
            const [id, code, name, taxonomy] = line.split('\t');
            const taxonomyElements = taxonomy.split(';').map(el => el.trim());
  
            // Skip the first element and extract the second, third, and fourth
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
        // Log the first 10 lines of the data output
        //console.log('First 10 KEGG Organisms with Taxonomy:', data.slice(0, 10));
  
        if (isPlatformBrowser(this.platformId)) {
          this.organisms = data;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
          localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
        }
      })
    );
  }

  searchOrganisms(query: string): KEGGOrganism[] {
    return this.organisms.filter(org =>
      org.name.toLowerCase().includes(query.toLowerCase()) ||
      org.code.toLowerCase().includes(query.toLowerCase())
    );
  }

  getUniqueKingdoms(): string[] {
    const kingdoms = this.organisms.map(organism => organism.kingdom);
    return Array.from(new Set(kingdoms)); // unique elements
  }

  getSubgroups(kingdom: string): string[] {
    // Filter organisms by the specified kingdom
    const filteredOrganisms = this.organisms.filter(organism => organism.kingdom === kingdom);
    
    // Extract subgroups and remove duplicates using Set
    const subgroups = filteredOrganisms.map(organism => organism.subgroup);
    
    // Return unique subgroups as an array
    return Array.from(new Set(subgroups));
  }

  getOrganismClass(kingdom: string, subgroup: string): string[] {
    // Filter organisms by the specified kingdom
    const filteredOrganisms = this.organisms.filter(organism => organism.kingdom === kingdom && organism.subgroup === subgroup);
    
    // Extract subgroups and remove duplicates using Set
    const organismClass = filteredOrganisms.map(organism => organism.organismClass);
    
    // Return unique subgroups as an array
    return Array.from(new Set(organismClass));
  }

  getOrganismName(kingdom: string, subgroup: string, organismclass: string): string[] {
    // Filter organisms by the specified kingdom
    const filteredOrganisms = this.organisms.filter(organism => organism.kingdom === kingdom && organism.subgroup === subgroup && organism.organismClass === organismclass);
    
    // Extract subgroups and remove duplicates using Set
    const organismName = filteredOrganisms.map(organism => organism.name);
    
    // Return unique subgroups as an array
    return Array.from(new Set(organismName));
  }

  getID(kingdom: string, subgroup: string, organismclass: string, organismname: string): string {
    // Filter organisms by the specified criteria
    const filteredID = this.organisms.filter(organism => organism.kingdom === kingdom && organism.subgroup === subgroup && organism.organismClass === organismclass && organism.name === organismname);
  
    return filteredID[0].id; // Assuming your organism object has an 'id' property
  }

}