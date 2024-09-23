import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Theme } from '../models/theme.model';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {

  private apiUrl = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient) { }

  // Método para crear un nuevo artículo
  uploadArticle(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  //Método para crear temáticas y subtemáticas (Solo moderadores)
  uploadTheme(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload/theme`, formData);
  }

  //Método para cargar las temáticas en la app
  getThemes(): Observable<any[]> {
    return this.http.get<Theme[]>(`${this.apiUrl}/theme/getThemes`);
  }
}
