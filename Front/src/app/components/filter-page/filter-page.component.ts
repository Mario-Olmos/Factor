import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ArticlesService } from '../../services/articles.service';
import { Theme } from '../../models/theme.model';
import { Article } from '../../models/article.model';
import { UserProfile } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-filter-page',
  templateUrl: './filter-page.component.html',
  styleUrls: ['./filter-page.component.css']
})
export class FilterPageComponent implements OnInit, AfterViewInit, OnDestroy {

  public themes: Theme[] = [];
  public articles: Article[] = [];
  public filterForm: FormGroup;
  public currentUser: UserProfile | null = null;
  public popupMessage: string = '';
  public popupType: 'success' | 'error' | '' = '';
  public noResults: boolean = false;

  // Paginación infinita
  private destroy$ = new Subject<void>();
  public currentPage: number = 1;
  public articlesPerPage: number = 10;
  public loadingArticles: boolean = false;
  public noMoreArticles: boolean = false;

  constructor(
    private fb: FormBuilder,
    private articlesService: ArticlesService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      theme: [''],
      ordenarPorFecha: [''],
      ordenarPorVeracidad: ['']
    });
  }

  ngOnInit(): void {

    this.authService.getCurrentUser().subscribe(
      user => {
        this.currentUser = user;
      },
      error => {
        console.error('Error al obtener el usuario actual:', error);
        this.showErrorMessage('Error al cargar los datos del usuario.');
      }
    );

    this.articlesService.getThemes().subscribe(
      (themes) => {
        this.themes = themes;
      },
      error => {
        console.error('Error al cargar las temáticas:', error);
        this.showErrorMessage('Error al cargar las temáticas.');
      }
    );

    this.filterForm.get('ordenarPorFecha')?.valueChanges.subscribe(val => {
      if (val && val !== '') {
        this.filterForm.get('ordenarPorVeracidad')?.disable();
      } else {
        this.filterForm.get('ordenarPorVeracidad')?.enable();
      }
    });

    this.filterForm.get('ordenarPorVeracidad')?.valueChanges.subscribe(val => {
      if (val && val !== '') {
        this.filterForm.get('ordenarPorFecha')?.disable();
      } else {
        this.filterForm.get('ordenarPorFecha')?.enable();
      }
    });

    this.route.queryParams.subscribe(params => {
      const theme = params['theme'];
      this.filterForm.patchValue({ theme: theme });
      this.currentPage = 1;
      this.articles = [];
      this.fetchArticles();
    });
  }

  ngAfterViewInit(): void {
    // Listener de scroll para la paginación infinita
    window.addEventListener('scroll', this.onScroll, true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll, true);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Llama al servicio de artículos para obtener una lista de artículos filtrados según los criterios actuales.
   * Concatena los artículos al array existente y maneja la paginación.
   */
  private fetchArticles(): void {
    this.loadingArticles = true;

    const { theme, ordenarPorFecha, ordenarPorVeracidad } = this.filterForm.value;
    let validatedOrdenarPorFecha: 'asc' | 'desc' | undefined;
    let validatedOrdenarPorVeracidad: 'asc' | 'desc' | undefined;

    if (ordenarPorFecha && ['asc', 'desc'].includes(ordenarPorFecha)) {
      validatedOrdenarPorFecha = ordenarPorFecha as 'asc' | 'desc';
    }

    if (ordenarPorVeracidad && ['asc', 'desc'].includes(ordenarPorVeracidad)) {
      validatedOrdenarPorVeracidad = ordenarPorVeracidad as 'asc' | 'desc';
    }

    this.articlesService.getArticles(
      this.currentPage,
      this.articlesPerPage,
      theme || undefined,
      validatedOrdenarPorFecha,
      validatedOrdenarPorVeracidad
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (newArticles: Article[]) => {
          if (newArticles.length === 0) {
            this.noMoreArticles = true;
          } else {
            this.articles = this.articles.concat(
              newArticles.map(article => ({
                ...article,
                userVote: article.userVote,
              }))
            );
            this.currentPage++;
          }

          this.noResults = (this.currentPage === 1 && this.articles.length === 0);
          this.loadingArticles = false;
        },
        (error: any) => {
          console.error('Error al cargar los artículos', error);
          this.showErrorMessage('Error al cargar los artículos.');
          this.loadingArticles = false;
        }
      );
  }

  /**
   * Método llamado cuando cambia algún filtro en el formulario.
   * Resetea la página a 1, limpia los artículos y llama a fetchArticles() nuevamente.
   */
  public onFilterChange(): void {
    this.currentPage = 1;
    this.articles = [];
    this.noMoreArticles = false;
    this.fetchArticles();
  }

  /**
   * Cambia el orden de los artículos según el campo y la dirección especificados.
   */
  public setOrder(field: string, direction: 'asc' | 'desc'): void {
    this.filterForm.patchValue({
      orderField: field,
      orderDirection: direction
    });
    this.currentPage = 1;
    this.articles = [];
    this.noMoreArticles = false;
    this.fetchArticles();
  }

  /**
   * Listener de scroll. Cuando se acerca al final de la página, carga más artículos.
   */
  private onScroll = (): void => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500 && !this.loadingArticles) {
      // Si ya no hay más artículos, no volver a llamar
      if (!this.noMoreArticles) {
        this.fetchArticles();
      }
    }
  };

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
