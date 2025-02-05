// home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArticlesService } from '../../services/articles.service';
import { AuthService } from '../../services/auth.service';
import { Theme } from '../../models/theme.model';
import { Article } from '../../models/article.model';
import { UserProfile } from '../../models/user.model';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  public themes: Theme[] = [];
  public articles: Article[] = [];
  public currentUser: UserProfile | null = null;
  public popupMessage: string = '';
  public popupType: 'success' | 'error' | '' = '';

  public currentPage: number = 1;
  public articlesPerPage: number = 10;
  public themeLimit: number = 6;
  public days: number = 365;
  public tema?: string;

  public loadingThemes: boolean = false;
  public loadingArticles: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private articlesService: ArticlesService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadThemes();
    this.fetchArticles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el usuario actual.
   */
  private loadCurrentUser(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        user => {
          this.currentUser = user;
        },
        error => {
          console.error('Error al obtener el usuario actual:', error);
          this.showErrorMessage('Error al cargar los datos del usuario.');
        }
      );
  }

  /**
   * Carga los temas populares.
   */
  private loadThemes(): void {
    this.loadingThemes = true;
    this.articlesService.getTrendyThemes(this.themeLimit, this.days)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (themes: Theme[]) => {
          this.themes = themes;
          this.loadingThemes = false;
        },
        (error) => {
          console.error('Error al cargar los temas:', error);
          this.showErrorMessage('Error al cargar los temas.');
          this.loadingThemes = false;
        }
      );
  }

  /**
   * Llama al servicio de artículos para obtener una lista de artículos filtrados según los criterios actuales.
   * @returns void
   */
  private fetchArticles(): void {
    this.loadingArticles = true;
    this.articlesService.getArticles(
      this.currentPage,
      this.articlesPerPage,
      this.tema,
      undefined,
      undefined,
      this.days
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (articles: Article[]) => {
          this.articles = articles;
          this.currentPage ++;
          this.loadingArticles = false;
        },
        (error) => {
          console.error('Error al cargar los Artículos:', error);
          this.showErrorMessage('Error al cargar los Artículos.');
          this.loadingArticles = false;
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
    }).catch(error => {
      console.error('Error al navegar a la página de exploración:', error);
      this.showErrorMessage('Error al navegar a la página de exploración.');
    });
  }

  /**
   * Mensajes de notificación.
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

  /**
   * Método para cargar más artículos (Implementar paginación).
   */
  public loadMoreArticles(): void {
    this.fetchArticles();
  }
}
