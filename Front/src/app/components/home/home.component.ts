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
  popupMessage: string = '';
  popupType: 'success' | 'error' | '' = '';
  
  currentPage!: number;
  articlesPerPage = 10;
  themeLimit = 6;
  days = 300;
  tema = undefined; 
  ordenarPorFecha: 'asc' | 'desc' = 'desc'; 
  ordenarPorVeracidad: 'asc' | 'desc' = 'desc';
  
  constructor(
    private articlesService: ArticlesService, 
    private authService: AuthService, 
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentPage = 1;

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    // Obtener temas feed
    this.articlesService.getTrendyThemes(this.themeLimit, this.days).subscribe(
      (themes: Theme[]) => {
        this.themes = themes;
      },
      (error) => {
        this.showErrorMessage('Error al cargar los temas');
      }
    );

    // Obtener artículos feed
    this.articlesService.getArticles(
      this.currentPage,
      this.articlesPerPage,
      this.currentUser!.userId,
      this.tema,
      this.ordenarPorFecha,
      this.ordenarPorVeracidad,
      this.days
    ).subscribe(
      (articles: any[]) => {
        this.articles = articles.map(article => ({
          ...article,
          userVote: article.userVote
        }));

        this.currentPage++;
      },
      (error) => {
        this.showErrorMessage('Error al cargar los Artículos');
      }
    );
  }

  /**
   * Redirige a la página de exploración con el tema seleccionado como parámetro.
   * @param tema - Tema seleccionado para filtrar en la página de exploración.
   */
  public navigateToExplore(tema: Theme): void { 
    this.router.navigate(['/explorador'], {
      queryParams: { theme: tema._id }
    });
  }

  /**
   * Mensajes
   */
  private showSuccessMessage(message: string): void {
    this.popupMessage = message;
    this.popupType = 'success';
  }

  private showErrorMessage(message: string): void {
    this.popupMessage = message;
    this.popupType = 'error';
  }

  public onPopUpClosed(): void {
    this.popupMessage = '';
    this.popupType = '';
  }
}
