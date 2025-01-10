import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ArticlesService } from '../../services/articles.service';
import { Theme } from '../../models/theme.model';
import { Article } from '../../models/article.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-filter-page',
  templateUrl: './filter-page.component.html',
  styleUrls: ['./filter-page.component.css']
})
export class FilterPageComponent implements OnInit {
  themes: Theme[] = [];
  articles: Article[] = [];
  filterForm: FormGroup;
  currentUser: User | null = null;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private articlesService: ArticlesService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {

    this.filterForm = this.fb.group({
      theme: [''],
      orderField: [''],
      orderDirection: ['']
    });
  }

  ngOnInit(): void {

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    this.articlesService.getThemes().subscribe((themes) => {
      this.themes = themes;
    });

    this.route.queryParams.subscribe(params => {
      const theme = params['theme'];

      this.filterForm.patchValue({
        theme: theme
      });

      this.fetchFilteredArticles(); // Cargar los artículos iniciales
    });
  }

  // Llamar al servicio de artículos con los filtros actuales
  fetchFilteredArticles(): void {
    const filters = this.filterForm.value;

    const theme = filters.theme || undefined;
    const orderField = filters.orderField || 'asc';
    const orderDirection = filters.orderDirection || 'desc';

    this.articlesService.getArticles(
      1, // Página inicial
      10, // Límite de artículos por página
      this.currentUser!.userId,
      theme,
      orderField,
      orderDirection
    ).subscribe((articles: any[]) => {
      this.articles = articles.map(article => ({
        ...article,
        userVote: article.userVote,
      }));
      this.cdr.detectChanges();
    },
      (error) => {
        console.error('Error al cargar los artículos', error);
      }
    );
  }

  onFilterChange(): void {
    this.fetchFilteredArticles();
  }

  // Cambiar el orden de los artículos
  setOrder(field: string, direction: 'asc' | 'desc'): void {
    this.filterForm.patchValue({
      orderField: field,
      orderDirection: direction
    });
    this.fetchFilteredArticles();
  }
}
