import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/user/login/login.component';
import { RegisterComponent } from './components/user/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { ThemeComponent } from './components/theme/theme.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { UploadArticleComponent } from './components/upload-article/upload-article.component';
import { ArticuloDetailComponent } from './components/articulos/articulo-detail/articulo-detail.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { ArticuloListComponent } from './components/articulos/articulo-list/articulo-list.component';
import { FilterPageComponent } from './components/filter-page/filter-page.component';
import { ProfileComponent } from './components/profile/profile.component';
import { PopUpComponent } from './components/shared/pop-up/pop-up.component';
import { DecisionPopUpComponent } from './components/shared/decision-pop-up/decision-pop-up.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    ThemeComponent,
    NavbarComponent,
    UploadArticleComponent,
    ArticuloDetailComponent,
    ArticuloListComponent,
    FilterPageComponent,
    ProfileComponent,
    PopUpComponent,
    DecisionPopUpComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
