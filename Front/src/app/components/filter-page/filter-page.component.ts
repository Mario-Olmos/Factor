import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ArticlesService } from '../../services/articles.service';
import { Theme } from '../../models/theme.model';
import { Article } from '../../models/article.model';
import { UserProfile } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-filter-page',
  templateUrl: './filter-page.component.html',
  styleUrls: ['./filter-page.component.css']
})
export class FilterPageComponent implements OnInit {
  public themes: Theme[] = [];
  public articles: Article[] = [];
  public filterForm: FormGroup;
  public currentUser: UserProfile | null = null;
  public popupMessage: string = '';
  public popupType: 'success' | 'error' | '' = '';

  constructor(
    private fb: FormBuilder,
    private articlesService: ArticlesService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {

    this.filterForm = this.fb.group({
      theme: [''],
      ordenarPorFecha: [''],
      ordenarPorVeracidad: ['']
    });
  }

  ngOnInit(): void {

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    }, error => {
      console.error('Error al obtener el usuario actual:', error);
      this.showErrorMessage('Error al cargar los datos del usuario.');
    });

    this.articlesService.getThemes().subscribe((themes) => {
      this.themes = themes;
    }, error => {
      console.error('Error al cargar las temáticas:', error);
      this.showErrorMessage('Error al cargar las temáticas.');
    });

    this.route.queryParams.subscribe(params => {
      const theme = params['theme'];

      this.filterForm.patchValue({
        theme: theme
      });

      this.fetchFilteredArticles();
    });
  }

  /**
   * Llama al servicio de artículos para obtener una lista de artículos filtrados según los criterios actuales.
   * @returns void
   */
  private fetchFilteredArticles(): void {
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
      1, // Página inicial
      10, // Límite de artículos por página
      theme || undefined,
      validatedOrdenarPorFecha,
      validatedOrdenarPorVeracidad
    ).subscribe(
      (articles: Article[]) => {
        this.articles = articles;
      },
      (error: any) => {
        console.error('Error al cargar los artículos', error);
        this.showErrorMessage('Error al cargar los artículos.');
      }
    );
  }

  /**
   * Método llamado cuando cambia algún filtro en el formulario.
   * Obtiene nuevamente los artículos filtrados con los nuevos criterios.
   * @returns void
   */
  public onFilterChange(): void {
    this.fetchFilteredArticles();
  }

  /**
   * Cambia el orden de los artículos según el campo y la dirección especificados.
   * @param field Campo por el cual ordenar los artículos.
   * @param direction Dirección de ordenación ('asc' o 'desc').
   * @returns void
   */
  public setOrder(field: string, direction: 'asc' | 'desc'): void {
    this.filterForm.patchValue({
      orderField: field,
      orderDirection: direction
    });
    this.fetchFilteredArticles();
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
