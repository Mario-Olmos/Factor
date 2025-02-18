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
    return this.http.post(`${this.apiUrl}/upload`, formData, { withCredentials: true });
  }

  //Método para crear temáticas y subtemáticas (Solo moderadores)
  uploadTheme(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload/theme`, formData);
  }

  //Método para cargar las temáticas en la app
  getThemes(): Observable<Theme[]> {
    return this.http.get<Theme[]>(`${this.apiUrl}/theme/getThemes`);
  }

  //Método para el feed de temáticas
  getTrendyThemes(limit: number, days: number): Observable<Theme[]> {
    return this.http.get<Theme[]>(`${this.apiUrl}/theme/getTrendyThemes`, {
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
    tema?: string,
    ordenarPorFecha?: 'asc' | 'desc',
    ordenarPorVeracidad?: 'asc' | 'desc',
    days?: number
  ): Observable<Article[]> {
    const params: any = {
      page: page.toString(),
      limit: limit.toString()
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
    if (days) {
      params.days = days;
    }

    return this.http.get<Article[]>(`${this.apiUrl}/articles/getArticles`, { params, withCredentials: true }, );
  }

  //Método para dar "Like" o "Dislike"
  votarArticulo(payload: any): Observable<Article> {
    return this.http.post<Article>(`${this.apiUrl}/articles/meGusta`, payload, { withCredentials: true });
  }

  //Método get para el detalle del artículo por su id
  getArticleById(articleId: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/articles/${articleId}`, { withCredentials: true });
  }

  //Método get para traer los artículos de un usuario
  getArticlesByUser(username: string): Observable<Article[]> {
    const params: any = {
      username
    }
    return this.http.get<Article[]>(`${this.apiUrl}/articles/getArticlesByUser`, { params, withCredentials: true });
  }

  //Método get para traer la actividad de un usuario
  getActivityByUser(username: string): Observable<Article[]> {
    const params: any = {
      username
    }
    return this.http.get<Article[]>(`${this.apiUrl}/articles/getActivityByUser`, { params, withCredentials: true });
  }

  //Método delete para eliminar el artículo de un usuario
  eliminarArticulo(articleId: string): Observable<{ message: string }> {
    const params: any = {
      articleId
    }
    return this.http.delete<{ message: string }>(`${this.apiUrl}/articles/deleteArticle`, { params, withCredentials: true });
  }

}
