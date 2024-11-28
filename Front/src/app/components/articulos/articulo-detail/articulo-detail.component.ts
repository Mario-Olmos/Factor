import { Component, OnInit } from '@angular/core';
import { Article } from '../../../models/article.model';
import { User } from '../../../models/user.model';
import { ActivatedRoute } from '@angular/router';
import { ArticlesService } from '../../../services/articles.service';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-articulo-detail',
  templateUrl: './articulo-detail.component.html',
  styleUrl: './articulo-detail.component.css'
})
export class ArticuloDetailComponent implements OnInit {
  currentUser: User | null = null;
  errorMessage: string = '';
  article: Article | null = null;
  pdfSrc: string = '';


  constructor(
    private route: ActivatedRoute,
    private articlesService: ArticlesService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    
    this.authService.getCurrentUser().subscribe(
      (user) => {
        this.currentUser = user;
      },
      (error) => {
        console.error('Error al obtener el usuario actual:', error);
        this.errorMessage = 'Error al cargar los datos del usuario.';
      }
    );

    // Obtiene el ID del artículo de la URL y carga los datos
    const articleId = this.route.snapshot.paramMap.get('id');
    console.log(articleId);
    if (articleId) {
      this.loadArticle(articleId);
    } else {
      this.errorMessage = 'ID del artículo no válido.';
    }
  }

  //Cargamos información del artículo
  private loadArticle(articleId: string): void {
    this.articlesService.getArticleById(articleId).subscribe(
      (article: any) => {
        
        if (article.createdAt) {
          article.createdAt = new Date(article.createdAt);
        }

        this.article = article;
        this.pdfSrc = `http://localhost:3000/api${this.article?.pdfUrl}`;
        console.log(this.pdfSrc);

      },
      (error: any) => {
        console.error('Error al cargar el artículo:', error);
        this.errorMessage = 'No se pudo cargar el artículo.';
      }
    );
  }

  // Cambia el color de la veracidad en funcion a su valor
  getVeracityColor(veracity: number): string {
    if (veracity < 5) {
      return '#FF4D4D'; 
    } else if (veracity < 7) {
      return '#FFC107'; 
    } else {
      return '#4CAF50'; 
    }
  }
}
