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

  //Método para cargar los artículos de la app, tiene parámetros para cargar los artículos del feed y del explorador
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
  darLike(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/articles/meGusta`, payload);
  }

  //Método para dar "Dislike"
  darDislike(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/articles/meGusta`, payload);
  }

  //Método get para el detalle del artículo por su id
  getArticleById(articleId: string, userId: string): Observable<Article> {
    const params: any = {
      userId
    };
    return this.http.get<any>(`${this.apiUrl}/articles/${articleId}`, { params });
  }

  //Método get para traer los artículos de un usuario
  getArticlesByUser(authorId: string, viewerId: string) {
    const params: any = {
      authorId,
      viewerId
    }
    return this.http.get<Article[]>(`${this.apiUrl}/articles/getArticlesByUser`, { params });
  }

}
