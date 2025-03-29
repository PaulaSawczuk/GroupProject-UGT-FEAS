// Jennifer O'Halloran 
// 29/03/2025
//----------------------------------------
// GET request service to backend Express Node API
// Utilises hard-coded enzyme list in back-end
// Response : Array of Pathway Objects - Name and Pathway Code

// ----------  REDUNDANT -----------------


import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


// REDUNDANT CURRENTLY

@Injectable({
  providedIn: 'root',
})

export class enzymeApiService {

  private apiUrl = 'http://localhost:3000/api/getEnzymePathways/enzymes2'; // Your backend URL

  constructor(private http: HttpClient) {}

  // Example of fetching data from the Node.js backend
  getData(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
};
