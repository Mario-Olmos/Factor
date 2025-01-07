import { Component, OnInit } from '@angular/core';
import { ArticlesService } from '../../services/articles.service';
import { AuthService } from '../../services/auth.service';
import { Theme } from '../../models/theme.model';
import { Article } from '../../models/article.model';
import { User } from '../../models/user.model';
import { Router } from '@angular/router';

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
  days = 300;
  tema = undefined; 
  ordenarPorFecha: 'asc' | 'desc' = 'desc'; 
  ordenarPorVeracidad: 'asc' | 'desc' = 'desc';
  
  constructor(private articlesService: ArticlesService, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.currentPage = 1;

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    // Obtener los temas populares
    this.articlesService.getTrendyThemes(this.themeLimit, this.days).subscribe(
      (themes: Theme[]) => {
        this.themes = themes;
      },
      (error) => {
        this.showErrorMessage('Error al cargar los temas');
      }
    );

    // Llamar al servicio para obtener artículos con los parámetros adecuados
    this.articlesService.getArticles(
      this.currentPage,
      this.articlesPerPage,
      this.currentUser!.userId,
      this.tema,
      this.ordenarPorFecha,
      this.ordenarPorVeracidad
    ).subscribe(
      (articles: any[]) => {
        this.articles = articles.map(article => {
          return {
            ...article,
            userVote: article.userVote
          };
        });

        this.currentPage++;
      },
      (error) => {
        this.showErrorMessage('Error al cargar los Artículos');
      }
    );
  }

  // Redirigir a la página explorar con el tema como parámetro
  navigateToExplore(tema: Theme): void { 
    this.router.navigate(['/explorador'], {
      queryParams: { theme: tema._id}
    });
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
