import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/user/login/login.component';
import { RegisterComponent } from './components/user/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { ThemeComponent } from './components/theme/theme.component';
import { UploadArticleComponent } from './components/upload-article/upload-article.component';
import { ArticuloDetailComponent } from './components/articulos/articulo-detail/articulo-detail.component';
import { FilterPageComponent } from './components/filter-page/filter-page.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent , canActivate: [AuthGuard] },
  { path: 'theme', component: ThemeComponent , canActivate: [AuthGuard] },
  { path: 'uploadArticle', component: UploadArticleComponent , canActivate: [AuthGuard] },
  { path: 'article/:id', component: ArticuloDetailComponent, canActivate: [AuthGuard] },
  { path: 'explorador', component: FilterPageComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/home', pathMatch: 'full' } // Ruta predeterminada
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
