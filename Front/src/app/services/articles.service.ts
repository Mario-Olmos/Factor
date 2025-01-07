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

  //Método para el feed de temáticas
  getTrendyThemes(limit: number, days: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/theme/getTrendyThemes`, {
      params: {
        limit: limit.toString(),
        days: days.toString()
      }
    });
  }

  //Método para cargar los artículos de la app (provisional, luego será el feed el que los devuelva)
  getArticles(
    page: number,
    limit: number,
    userId: string,
    tema?: string,
    ordenarPorFecha?: 'asc' | 'desc',
    ordenarPorVeracidad?: 'asc' | 'desc'
  ): Observable<any[]> {
    const params: any = {
      page: page.toString(),
      limit: limit.toString(),
      userId
    };
  
    if (tema) {
      params.tema = tema;
    }
    if (ordenarPorFecha) {
      params.ordenarPorFecha = ordenarPorFecha;
    }
    if (ordenarPorVeracidad) {
      params.ordenarPorVeracidad = ordenarPorVeracidad;
    }
  
    return this.http.get<any[]>(`${this.apiUrl}/articles/getArticles`, { params });
  }
  

  //Método para dar "Like"
  darLike(likeObject: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/articles/meGusta`, likeObject);
  }

  //Método para dar "Dislike"
  darDislike(likeObject: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/articles/meGusta`, likeObject);
  }

  //Método get para el detalle del artículo
  getArticleById(articleId: string, userId: string): Observable<Article> {
    const params: any = {
      userId
    };
    return this.http.get<any>(`${this.apiUrl}/articles/${articleId}`, {params});
  }

}
