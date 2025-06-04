// src/app/components/profile/profile.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserArticle, UserProfile } from '../../models/user.model';
import { Acreditacion } from '../../models/acreditacion.model';
import { Article } from '../../models/article.model';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ArticlesService } from '../../services/articles.service';
import { SharedService } from '../../services/shared.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileUsername!: string;
  isOwnProfile: boolean = false;
  user: UserArticle | null = null;
  articles: Article[] = [];
  activity: Article[] = [];
  currentUser: UserProfile | null = null;
  activeTab: string = 'info';
  isEditing: boolean = false;
  profileForm!: FormGroup;
  popupMessage: string = '';
  popupType: 'success' | 'error' | '' = '';
  selectedFile: File | null = null;
  showDeleteConfirmation: boolean = false;
  deleteConfirmationMessage: string = 'Se va a eliminar su cuenta, por favor seleccione si quiere mantener sus artículos en la plataforma.';
  public loading: boolean = false;
  public isSettingsMenuOpen: boolean = false;
  public isDeleteAccountPopupOpen: boolean = false;
  public isPrivilegesPopupOpen: boolean = false;
  public currentVotesThisWeek!: number;
  public maxVotesThisWeek!: string;
  public currentPublicationsThisMonth!: number;
  public maxPublicationsThisMonth!: string;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private articlesService: ArticlesService,
    private sharedService: SharedService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;

          this.route.params
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
              const requestedUserId = params['username'];
              console.log(requestedUserId);

              if (!requestedUserId || requestedUserId === 'me') {
                this.profileUsername = this.currentUser!.username;
                this.isOwnProfile = true;
              } else {
                this.profileUsername = requestedUserId;
                this.isOwnProfile = false;
              }
              console.log(`Perfil cargado: ${this.isOwnProfile ? 'propio' : 'otro usuario'}`);
              this.loadUserProfile();
            });
        },
        error: (error) => {
          console.error('Error al obtener el usuario actual:', error);
          this.showErrorMessage('Error al cargar los datos del usuario.');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la información del usuario y sus artículos publicados.
   */
  private loadUserProfile(): void {
    if (!this.isOwnProfile) {
      this.authService.getUserById(this.profileUsername)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: { user: UserArticle }) => {
            this.user = data.user;
            this.loadArticlesByUser();
            this.loadActivityByUser();
          },
          error: (error) => {
            console.error('Error al cargar el perfil del usuario:', error);
            this.showErrorMessage('Error al cargar el perfil del usuario.');
          }
        });
    } else {
      this.initForm();
      this.loadArticlesByUser();
      this.loadActivityByUser();
    }
  }

  /**
   * Carga los artículos publicados por el usuario.
   */
  private loadArticlesByUser(): void {
    const authorUsername = this.profileUsername;
    this.articlesService.getArticlesByUser(authorUsername)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articles: Article[]) => {
          this.articles = articles;
        },
        error: (error) => {
          console.error('Error al cargar los artículos del usuario:', error);
          this.showErrorMessage('Error al cargar los artículos del usuario.');
        }
      });
  }

  /**
   * Carga la actividad del usuario.
   */
  private loadActivityByUser(): void {
    const authorUsername = this.profileUsername;
    this.articlesService.getActivityByUser(authorUsername)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activity: Article[]) => {
          this.activity = activity;
        },
        error: (error) => {
          console.error('Error al cargar los artículos del usuario:', error);
          this.showErrorMessage('Error al cargar los artículos del usuario.');
        }
      });
  }

  /**
   * Inicializa el formulario de perfil con los datos del usuario.
   */
  private initForm(): void {
    this.profileForm = this.fb.group({
      nombre: [this.currentUser?.nombre, [Validators.required, Validators.maxLength(100)]],
      apellidos: [this.currentUser?.apellidos, [Validators.required, Validators.maxLength(100)]],
      fechaNacimiento: [
        this.currentUser?.fechaNacimiento
          ? this.formatDateForInput(new Date(this.currentUser.fechaNacimiento))
          : '',
        [ Validators.required, this.ageValidator]
      ],
      imagenPerfil: [this.currentUser?.imagenPerfil || ''],
      acreditaciones: this.fb.array(
        this.currentUser!.acreditaciones.map(ac => this.createAccreditationGroup(ac))
      )
    });
  }

  /**
   * Gestión acreditaciones.
   */
  private createAccreditationGroup(ac: Acreditacion = { title: '', institution: '', year: 2025 }): FormGroup {
    return this.fb.group({
      title: [ac.title, Validators.required],
      institution: [ac.institution, Validators.required],
      year: [
        ac.year,
        [
          Validators.required,
          Validators.min(1900),
          Validators.max(new Date().getFullYear())
        ]
      ]
    });
  }

  public get acreditaciones(): FormArray {
    return this.profileForm.get('acreditaciones') as FormArray;
  }

  public addAccreditation(): void {
    this.acreditaciones.push(this.createAccreditationGroup());
  }

  public removeAccreditation(index: number): void {
    this.acreditaciones.removeAt(index);
  }

  /**
   * Gestión de menús
   */
  public editProfile(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing && this.isOwnProfile) {
      this.initForm();
    }
  }

  public setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  public toggleSettingsMenu(): void {
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
    console.log('Menú de configuración abierto:', this.isSettingsMenuOpen);
  }

  public closeSettingsMenu(): void {
    this.isSettingsMenuOpen = false;
  }

  public openDeleteAccountPopup(): void {
    this.isDeleteAccountPopupOpen = true;
    this.closeSettingsMenu();
  }

  public closeDeleteAccountPopup(): void {
    this.isDeleteAccountPopupOpen = false;
  }

  public openPrivilegesPopup(): void {
    this.closeSettingsMenu();

    this.authService.getPrivileges().subscribe({
      next: (data) => {
        if (data.votingLimit == null && data.publicationLimit == null) {
          this.maxPublicationsThisMonth = "\u221E";
          this.maxVotesThisWeek = "\u221E";
        } else {
          this.maxVotesThisWeek = String(data.votingLimit);
          this.maxPublicationsThisMonth= String(data.publicationLimit);
        }
        this.currentVotesThisWeek = data.usedVotesInLastWeek;
        this.currentPublicationsThisMonth = data.usedPublicationsInLastMonth;

        this.isPrivilegesPopupOpen = true;
      },
      error: (err) => {
        console.error('Error al obtener privilegios:', err);
        // Podrías mostrar un mensaje
      }
    });
  }

  public closePrivilegesPopup(): void {
    this.isPrivilegesPopupOpen = false;
  }

  /**
   * Maneja la elección del usuario en el pop-up de eliminación de cuenta.
   * @param deleteArticles Indica si se deben eliminar los artículos.
   */
  public handleDeleteChoice(deleteArticles: boolean): void {
    this.loading = true;

    this.authService.deleteAccount(deleteArticles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showSuccessMessage('Cuenta eliminada con éxito.');
          this.loading = false;
          this.closeDeleteAccountPopup();
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error al eliminar la cuenta:', error);
          this.showErrorMessage(error.error.message || 'Error al eliminar la cuenta.');
          this.loading = false;
          this.closeDeleteAccountPopup();
        }
      });
  }

  /**
   * Maneja la selección de una nueva imagen de perfil.
   */
  public onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;
      console.log('Archivo seleccionado:', file);
    }
  }

  /**
   * Método para registrarse.
   * @param control Fecha de nacimiento introducida.
   */
  private ageValidator(control: any): { [key: string]: boolean } | null {
    const inputDate = new Date(control.value);
    const currentDate = new Date();
    const age = currentDate.getFullYear() - inputDate.getFullYear();
    if (age < 18 || (age === 18 && currentDate < new Date(inputDate.setFullYear(inputDate.getFullYear() + 18)))) {
      return { 'underage': true }; 
    }
    return null;
  }

  /**
   * Guarda los cambios realizados en el perfil del usuario.
   */
  public saveProfile(): void {
    if (!this.profileForm.valid) {
      this.showErrorMessage('Formulario no válido. Revisa los errores.');
      return;
    }

    // Verifica si es propio perfil antes de proceder
    if (!this.isOwnProfile) {
      this.showErrorMessage('No puedes editar el perfil de otro usuario.');
      return;
    }

    this.loading = true; // Iniciar el estado de carga

    // CASO A: El usuario NO subió ninguna imagen => Envío JSON normal
    if (!this.selectedFile) {
      const userJson = {
        nombre: this.profileForm.value.nombre,
        apellidos: this.profileForm.value.apellidos,
        fechaNacimiento: this.profileForm.value.fechaNacimiento,
        acreditaciones: this.profileForm.value.acreditaciones,
      };

      this.authService.updateProfile(userJson)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resp: { user: UserProfile }) => {
            this.currentUser = resp.user; // Actualiza currentUser
            this.isEditing = false;
            this.showSuccessMessage('Perfil actualizado.');
            this.loading = false; // Finalizar el estado de carga
          },
          error: (err) => {
            console.error('Error actualizando perfil:', err);
            this.showErrorMessage('Error actualizando perfil.');
            this.loading = false; // Finalizar el estado de carga
          }
        });

      // CASO B: El usuario SÍ seleccionó imagen => Envío FormData (multipart/form-data)
    } else {
      const formData = new FormData();
      formData.append('nombre', this.profileForm.value.nombre);
      formData.append('apellidos', this.profileForm.value.apellidos);
      formData.append('fechaNacimiento', this.profileForm.value.fechaNacimiento);
      formData.append('acreditaciones', JSON.stringify(this.profileForm.value.acreditaciones));
      formData.append('imagenPerfil', this.selectedFile);

      this.authService.updateProfile(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resp: { user: UserProfile }) => {
            this.currentUser = resp.user; // Actualiza currentUser
            this.isEditing = false;
            this.showSuccessMessage('Perfil e imagen actualizados.');
            this.loading = false; // Finalizar el estado de carga
          },
          error: (err) => {
            console.error('Error actualizando perfil:', err);
            this.showErrorMessage('Error actualizando perfil.');
            this.loading = false; // Finalizar el estado de carga
          }
        });
    }
  }

  /**
   * Formatea una fecha para que sea compatible con los inputs de tipo date.
   */
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Métodos auxiliares
   */
  public getReputationDescription(reputation: number): string {
    return this.sharedService.getReputationDescription(reputation);
  }

  public getReputationColor(reputation: number): string {
    return this.sharedService.getReputationColor(reputation);
  }

  public getFullImageUrl(rel: string | undefined): string {
    return this.sharedService.getFullImageUrl(rel);
  }

  public getProfileImageUrl(): string {
    if (this.isOwnProfile && this.currentUser?.imagenPerfil) {
      return this.sharedService.getFullImageUrl(this.currentUser.imagenPerfil);
    } else if (this.user?.imagenPerfil) {
      return this.sharedService.getFullImageUrl(this.user.imagenPerfil);
    } else {
      return 'assets/images/default-avatar.png';
    }
  }

  /**
   * Logout
   */
  logout() {
    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.router.navigate(['/login']);
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
   * Getters 
   */
  public get displayName(): string {
    if (this.isOwnProfile && this.currentUser) {
      return `${this.currentUser.nombre} ${this.currentUser.apellidos}`;
    } else if (this.user) {
      return `${this.user.nombre} ${this.user.apellidos}`;
    }
    return 'Usuario';
  }

  public get displayAcreditaciones(): Acreditacion[] {
    if (this.isOwnProfile && this.currentUser) {
      return this.currentUser.acreditaciones;
    } else if (this.user) {
      return this.user.acreditaciones;
    }
    return [];
  }

  public get displayReputationBadge(): number {
    if (this.isOwnProfile && this.currentUser) {
      return this.currentUser.reputacion;
    } else if (this.user) {
      return this.user.reputacion;
    }
    return 0;
  }

  public get displayEmail(): string | undefined {
    return this.isOwnProfile ? this.currentUser?.email : undefined;
  }

  public get displayFechaNacimiento(): Date | undefined {
    return this.isOwnProfile ? this.currentUser?.fechaNacimiento : undefined;
  }
}
