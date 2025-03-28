import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api/getenzymes'; // Your backend URL

  constructor(private http: HttpClient) {}

  // Example of fetching data from the Node.js backend
  getData(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}

