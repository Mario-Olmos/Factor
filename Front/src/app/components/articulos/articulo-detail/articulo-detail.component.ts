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
  article: Article | null = null;
  currentUser: User | null = null;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private articlesService: ArticlesService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Obtiene el usuario logueado
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
    if (articleId) {
      this.loadArticle(articleId);
    } else {
      this.errorMessage = 'ID del artículo no válido.';
    }
  }

  private loadArticle(articleId: string): void {
    this.articlesService.getArticleById(articleId).subscribe(
      (article: Article) => {
        this.article = article;
      },
      (error: any) => {
        console.error('Error al cargar el artículo:', error);
        this.errorMessage = 'No se pudo cargar el artículo.';
      }
    );
  }

}
