import { Component, OnInit } from '@angular/core';
import { ArticlesService } from '../../services/articles.service';
import { AuthService } from '../../services/auth.service';
import { Theme } from '../../models/theme.model';
import { Article } from '../../models/article.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  themes: Theme[] = [];
  articles: Article[] = [];
  currentUser: User | null = null;
  successMessage: string = '';
  errorMessage: string = '';
  currentPage!: number;
  articlesPerPage = 10;
  themeLimit = 6;
  days = 200;
  constructor(private articlesService: ArticlesService, private authService: AuthService) { }

  ngOnInit(): void {

    this.currentPage = 1;

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    console.log(this.currentUser?.userId);

    this.articlesService.getTrendyThemes(this.themeLimit, this.days).subscribe(
      (themes: Theme[]) => {
        this.themes = themes; 
      },
      (error) => {
        console.error('Error al cargar los temas', error);
      }
    );

    this.articlesService.getArticles(this.currentPage, this.articlesPerPage, this.currentUser!.userId).subscribe(
      (articles: any[]) => {
        this.articles = articles.map(article => {
          return {
            ...article,
            userVote: article.userVote  // 'upvote', 'downvote', o null según el backend
          };
        });
        
        // Aumenta el contador de páginas solo si la carga es exitosa
        this.currentPage++;
      },
      (error) => {
        console.error('Error al cargar los artículos', error);
      }
    );
  }

  // Verificar si el usuario puede votar
  puedeVotar(): boolean {
    if (this.currentUser!.reputacion >= 50) {
      return true;
    } else return false;
  }

  // Calcular el peso del voto según la reputación del votante
  calcularPesoVoto(): number {
    const pesoVoto = 0.05 + (this.currentUser!.reputacion / 400);
    return Math.min(pesoVoto, 0.3);  // Limitar a 0.3 como máximo
  }

  // Método para dar "Like"
  darLike(articleId: String): void {
    if (!this.puedeVotar()) {
      alert('No tienes suficiente reputación para votar');
      return;
    }

    const pesoVoto = this.calcularPesoVoto();

    const likeObject = {
      articleId: articleId,
      pesoVoto: pesoVoto,
      user: this.currentUser?.userId,
      voteType: "upvote"
    }

    this.articlesService.darLike(likeObject).subscribe(
      (response: any) => {
        // El backend devuelve un status 200 con un mensaje
        if (response && response.message) {
          this.showSuccessMessage(response.message);  // Muestra el mensaje del backend
        }
        this.articlesService.getArticles(this.currentPage, this.articlesPerPage, this.currentUser!.userId);  // Refresca los artículos
      },
      (error: any) => {
        // Manejar diferentes tipos de errores por el código de estado
        if (error.status === 403) {
          this.showErrorMessage(error.error.message || 'No tienes suficiente reputación para votar.');
        } else if (error.status === 400) {
          this.showErrorMessage(error.error.message || 'Ya has votado este artículo.');
        } else if (error.status === 404) {
          this.showErrorMessage(error.error.message || 'Artículo o usuario no encontrado.');
        } else {
          this.showErrorMessage(error.error.message || 'Error al procesar la solicitud.');
        }
      }
    );
  }

  // Método para dar "Dislike"
  darDislike(articleId: String): void {
    if (!this.puedeVotar()) {
      alert('No tienes suficiente reputación para votar');
      return;
    }

    const pesoVoto = this.calcularPesoVoto();

    const likeObject = {
      articleId: articleId,
      pesoVoto: pesoVoto,
      user: this.currentUser?.userId,
      voteType: "downvote"
    }

    this.articlesService.darDislike(likeObject).subscribe(
      (response: any) => {
        // El backend devuelve un status 200 con un mensaje
        if (response && response.message) {
          this.showSuccessMessage(response.message);  // Muestra el mensaje del backend
        }
        this.articlesService.getArticles(this.currentPage, this.articlesPerPage, this.currentUser!.userId);  // Refresca los artículos
      },
      (error: any) => {
        // Manejar diferentes tipos de errores por el código de estado
        if (error.status === 403) {
          this.showErrorMessage(error.error.message || 'No tienes suficiente reputación para votar.');
        } else if (error.status === 400) {
          this.showErrorMessage(error.error.message || 'Ya has votado este artículo.');
        } else if (error.status === 404) {
          this.showErrorMessage(error.error.message || 'Artículo o usuario no encontrado.');
        } else {
          this.showErrorMessage(error.error.message || 'Error al procesar la solicitud.');
        }
      }
    );
  }

  // Muestra el mensaje de éxito temporalmente
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.clearMessagesAfterDelay();
  }

  // Muestra el mensaje de error temporalmente
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.clearMessagesAfterDelay();
  }

  // Limpia los mensajes de éxito y error después de un tiempo
  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 2000);
  }
}
