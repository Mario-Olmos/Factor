import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {

  private apiUrl = 'http://localhost:3000/api/upload'; 

  constructor(private http: HttpClient) { }

  // Método para crear un nuevo artículo
  uploadArticle(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }
}
