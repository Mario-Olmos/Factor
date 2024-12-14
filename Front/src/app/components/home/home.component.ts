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
  tema = undefined; 
  ordenarPorFecha: 'asc' | 'desc' = 'desc'; 
  ordenarPorVeracidad: 'asc' | 'desc' = 'desc';

  constructor(private articlesService: ArticlesService, private authService: AuthService) { }

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
        console.error('Error al cargar los temas', error);
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
        console.error('Error al cargar los artículos', error);
      }
    );
  }
}
