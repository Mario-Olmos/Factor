import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Theme } from '../models/theme.model';
import { Article } from '../models/article.model';

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

  //Método para cargar los artículos de la app (provisional, luego será el feed el que los devuelva)
  getArticles(): Observable<any[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/articles/getArticles`);
  }

  //Método para dar "Like"
  darLike(likeObject: any): Observable<any>{
    return this.http.post(`${this.apiUrl}/articles/meGusta`, likeObject);
  }

  //Método para dar "Dislike"
  darDislike(likeObject: any): Observable<any>{
    return this.http.post(`${this.apiUrl}/articles/meGusta`, likeObject);
  }
}
