import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../models/user.model';
import { Article } from '../../models/article.model';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ArticlesService } from '../../services/articles.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userId!: string;
  isOwnProfile: boolean = false;
  user!: User;
  articles: Article[] = [];
  currentUser: User | null = null;
  activeTab: string = 'info';
  isEditing: boolean = false;
  profileForm!: FormGroup;
  BACKEND_URL = 'http://localhost:3000/';
  popupMessage: string = '';
  popupType: 'success' | 'error' | '' = '';
  selectedFile: File | null = null; 

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private articlesService: ArticlesService
  ) { }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;

        this.route.params.subscribe((params) => {
          const requestedUserId = params['id'];

          if (!requestedUserId || requestedUserId === 'me') {
            this.userId = this.currentUser!.userId;
            this.isOwnProfile = true;
          } else {
            this.userId = requestedUserId;
            this.isOwnProfile = false;
          }
          console.log(`Perfil cargado: ${this.isOwnProfile ? 'propio' : 'otro usuario'}`);
          this.loadUserProfile();
        });
      },
      error: (error) => {
        console.error('Error al obtener el usuario actual:', error);
      },
    });
  }

  /**
   * Carga la info del usuario y sus artículos publicados.
   * @returns void
   */
  private loadUserProfile(): void {
    this.authService.getUserById(this.userId).subscribe({
      next: (data) => {
        this.user = data.user;
        this.initForm();
        this.loadArticlesByUser();
      },
      error: (error) => {
        this.showErrorMessage('Error al cargar el perfil del usuario:');
      }
    });
  }

  /**
   * Carga los artículos publicados por el usuario.
   * @returns void
   */
  private loadArticlesByUser(): void {
    const authorId = this.userId;
    const viewerId = this.currentUser!.userId;
    this.articlesService.getArticlesByUser(authorId, viewerId).subscribe({
      next: (articles) => {
        this.articles = articles;
      },
      error: (error) => {
        this.showErrorMessage('Error al cargar los artículos del usuario:');
      }
    });
  }

  /**
   * Obtiene la imagen del perfil del usuario o le establece el avatar por defecto.
   * @param rel Ruta relativa de la imagen.
   * @returns URL completa de la imagen de perfil o del avatar.
   */
  public getFullImageUrl(rel: string | undefined): string {
    if (!rel) return 'assets/images/default-avatar.png';
    return this.BACKEND_URL + rel;
  }

  /**
   * Inicializa el formulario de perfil con los datos del usuario.
   * @returns void
   */
  private initForm(): void {
    this.profileForm = this.fb.group({
      nombre: [this.user.nombre, Validators.required],
      apellidos: [this.user.apellidos, Validators.required],
      fechaNacimiento: [
        this.user.fechaNacimiento
          ? this.formatDateForInput(new Date(this.user.fechaNacimiento))
          : '',
        Validators.required
      ],
      imagenPerfil: [this.user.imagenPerfil || ''],
      acreditaciones: this.fb.array(
        this.user.acreditaciones.map(ac => this.createAccreditationGroup(ac))
      )
    });
  }

  /**
   * Crea un grupo de formulario para una acreditación.
   * @param ac Objeto de acreditación existente o vacío.
   * @returns Grupo de formulario para la acreditación.
   */
  private createAccreditationGroup(ac: any = { title: '', institution: '', year: '' }): FormGroup {
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

  /**
   * Obtiene el array de acreditaciones del formulario.
   * @returns FormArray de acreditaciones.
   */
  public get acreditaciones(): FormArray {
    return this.profileForm.get('acreditaciones') as FormArray;
  }

  /**
   * Añade una nueva acreditación al formulario.
   * @returns void
   */
  public addAccreditation(): void {
    this.acreditaciones.push(this.createAccreditationGroup());
  }

  /**
   * Elimina una acreditación específica del formulario.
   * @param index Índice de la acreditación a eliminar.
   * @returns void
   */
  public removeAccreditation(index: number): void {
    this.acreditaciones.removeAt(index);
  }

  /**
   * Cambia la pestaña activa en el perfil.
   * @param tab Nombre de la pestaña a activar.
   * @returns void
   */
  public setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  /**
   * Alterna el modo de edición del perfil.
   * @returns void
   */
  public editProfile(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.initForm();
    }
  }

  /**
   * Maneja la selección de una nueva imagen de perfil.
   * @param event Evento de selección de archivo.
   * @returns void
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
   * Guarda los cambios realizados en el perfil del usuario.
   * @returns void
   */
  public saveProfile(): void {
    if (!this.profileForm.valid) {
      this.showErrorMessage('Formulario no válido. Revisa los errores.');
      return;
    }

    // CASO A: El usuario NO subió ninguna imagen => Envío JSON normal
    if (!this.selectedFile) {
      const userJson = {
        nombre: this.profileForm.value.nombre,
        apellidos: this.profileForm.value.apellidos,
        fechaNacimiento: this.profileForm.value.fechaNacimiento,
        acreditaciones: this.profileForm.value.acreditaciones,
      };

      this.authService.updateProfile(userJson, this.user._id).subscribe({
        next: (resp) => {
          this.user = resp.user;
          this.isEditing = false;
          this.showSuccessMessage('Perfil actualizado.');
        },
        error: (err) => {
          this.showErrorMessage('Error actualizando perfil:');
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

      this.authService.updateProfile(formData, this.user._id).subscribe({
        next: (resp) => {
          this.user = resp.user;
          this.isEditing = false;
          this.showSuccessMessage('Perfil e imagen actualizados.');
        },
        error: (err) => {
          this.showErrorMessage('Error actualizando perfil:');
        }
      });
    }
  }

  /**
   * Formatea una fecha para que sea compatible con los inputs de tipo date.
   * @param date Objeto Date a formatear.
   * @returns Fecha formateada como string 'YYYY-MM-DD'.
   */
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
