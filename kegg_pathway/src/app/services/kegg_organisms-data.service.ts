import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common'; // Import this function

interface KEGGOrganism {
  id: string;
  code: string;
  name: string;
  taxonomy: string;
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
      this.loadStoredData(); // Only call this if it's the browser
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

  // fetchKEGGData(): Observable<KEGGOrganism[]> {
  //   return this.http.get(this.KEGG_URL, { responseType: 'text' }).pipe(
  //     map(response => {
  //       return response.split('\n')
  //         .filter(line => line.trim().length > 0)
  //         .map(line => {
  //           const [id, code, name, taxonomy] = line.split('\t');
  //           return { id, code, name, taxonomy } as KEGGOrganism;
  //         });
  //     }),
  //     tap(data => {
  //       if (isPlatformBrowser(this.platformId)) {
  //         this.organisms = data;
  //         localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  //         localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
  //       }
  //     })
  //   );
  // }

  fetchKEGGData(): Observable<KEGGOrganism[]> {
    return this.http.get(this.KEGG_URL, { responseType: 'text' }).pipe(
      map(response => {
        return response.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => {
            const [id, code, name, taxonomy] = line.split('\t');
            return { id, code, name, taxonomy } as KEGGOrganism;
          });
      }),
      tap(data => {
        // Log the first 10 lines of data to the console
        console.log('First 10 KEGG Organisms:', data.slice(0, 10));
  
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
}