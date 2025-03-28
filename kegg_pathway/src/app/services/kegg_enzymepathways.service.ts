import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


// REDUNDANT CURRENTLY

@Injectable({
  providedIn: 'root',
})
export class enzymeApiService {

  private apiUrl = 'http://localhost:3000/api/getEnzymesPathways/enzymes'; // Your backend URL

  constructor(private http: HttpClient) {}

  // Example of fetching data from the Node.js backend
  getData(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}

