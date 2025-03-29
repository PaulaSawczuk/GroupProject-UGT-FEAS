import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


// REDUNDANT CURRENTLY

@Injectable({
  providedIn: 'root',
})


export class enzymeApiServicePost {

  private apiUrl = 'http://localhost:3000/api/getEnzymePathways/enzymes3'; // Your backend URL

  constructor(private http: HttpClient) {}

  // Example of fetching data from the Node.js backend
  postData(data: any): Observable<any[]>{
    return this.http.post<any>(this.apiUrl, data);
  }
}