import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonSpinner, IonButton, IonItem, IonInput, IonText } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { camera, checkmarkCircle, person } from 'ionicons/icons';
import { LanguageService } from 'src/app/services/language.service';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";

@Component({
  selector: 'app-datos-anonimo',
  templateUrl: './datos-anonimo.page.html',
  styleUrls: ['./datos-anonimo.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, ReactiveFormsModule, IonText, MapaidiomaPage]
})
export class DatosAnonimoPage implements OnInit {
  isLoading: boolean = false;
  formData: FormGroup;
  photoPreview: any | null = null;
  photoToUpload: any | null = null;
  formSubmitted = false;
  private authService: AuthService = inject(AuthService);
  mapVisible = false;
  langService = inject(LanguageService);
  currentLang: string = 'es';

  constructor(private fb: FormBuilder, private router: Router) {
    this.formData = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      foto: [null, [
        Validators.required,
        this.validatePhoto.bind(this)
      ]]
    });
  }

  ngOnInit() {
    addIcons({ person, checkmarkCircle, camera });

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  textos: any = {
    es: {
      titulo: 'Datos Personales',
      subtitulo: 'Acceso rápido como invitado',
      foto: 'Tu foto',
      agregarFoto: 'Agregar foto',
      nombre: 'Nombre',
      placeholderNombre: 'Tu nombre',
      continuar: 'Continuar como invitado',
      errors: {
        nombreRequired: 'El nombre es requerido',
        nombreMin: 'Mínimo 2 caracteres',
        nombrePattern: 'Solo letras y espacios',
        fotoRequired: 'La foto es requerida',
        fotoInvalidType: 'Formato inválido (solo JPG, PNG, GIF, WEBP)',
        fotoMaxSize: 'Máximo 5MB',
        fotoInvalid: 'Formato inválido'
      },
      toasts: {
        success: 'Acceso como invitado exitoso',
        error: 'Hubo un error al registrarse como invitado'
      }
    },
    en: {
      titulo: 'Personal Information',
      subtitulo: 'Quick access as guest',
      foto: 'Your photo',
      agregarFoto: 'Add photo',
      nombre: 'Name',
      placeholderNombre: 'Your name',
      continuar: 'Continue as guest',
      errors: {
        nombreRequired: 'Name is required',
        nombreMin: 'Minimum 2 characters',
        nombrePattern: 'Only letters and spaces',
        fotoRequired: 'Photo is required',
        fotoInvalidType: 'Invalid format (JPG, PNG, GIF, WEBP only)',
        fotoMaxSize: 'Maximum 5MB',
        fotoInvalid: 'Invalid format'
      },
      toasts: {
        success: 'Guest access successful',
        error: 'There was an error registering as guest'
      }
    },
    pt: {
      titulo: 'Dados Pessoais',
      subtitulo: 'Acesso rápido como convidado',
      foto: 'Sua foto',
      agregarFoto: 'Adicionar foto',
      nombre: 'Nome',
      placeholderNombre: 'Seu nome',
      continuar: 'Continuar como convidado',
      errors: {
        nombreRequired: 'O nome é obrigatório',
        nombreMin: 'Mínimo de 2 caracteres',
        nombrePattern: 'Apenas letras e espaços',
        fotoRequired: 'A foto é obrigatória',
        fotoInvalidType: 'Formato inválido (apenas JPG, PNG, GIF, WEBP)',
        fotoMaxSize: 'Máximo de 5MB',
        fotoInvalid: 'Formato inválido'
      },
      toasts: {
        success: 'Acesso como convidado realizado',
        error: 'Erro ao registrar como convidado'
      }
    },
    fr: {
      titulo: 'Données Personnelles',
      subtitulo: 'Accès rapide en tant qu’invité',
      foto: 'Votre photo',
      agregarFoto: 'Ajouter une photo',
      nombre: 'Nom',
      placeholderNombre: 'Votre nom',
      continuar: 'Continuer en tant qu’invité',
      errors: {
        nombreRequired: 'Le prénom est requis',
        nombreMin: '2 caractères minimum',
        nombrePattern: 'Seulement lettres et espaces',
        fotoRequired: 'La photo est requise',
        fotoInvalidType: 'Format invalide (JPG, PNG, GIF, WEBP uniquement)',
        fotoMaxSize: '5 Mo maximum',
        fotoInvalid: 'Format invalide'
      },
      toasts: {
        success: 'Accès invité réussi',
        error: 'Erreur lors de l’inscription en tant qu’invité'
      }
    },
    de: {
      titulo: 'Persönliche Daten',
      subtitulo: 'Schneller Zugriff als Gast',
      foto: 'Dein Foto',
      agregarFoto: 'Foto hinzufügen',
      nombre: 'Name',
      placeholderNombre: 'Dein Name',
      continuar: 'Als Gast fortfahren',
      errors: {
        nombreRequired: 'Der Name ist erforderlich',
        nombreMin: 'Mindestens 2 Zeichen',
        nombrePattern: 'Nur Buchstaben und Leerzeichen',
        fotoRequired: 'Foto ist erforderlich',
        fotoInvalidType: 'Ungültiges Format (nur JPG, PNG, GIF, WEBP)',
        fotoMaxSize: 'Maximal 5MB',
        fotoInvalid: 'Ungültiges Format'
      },
      toasts: {
        success: 'Gastzugang erfolgreich',
        error: 'Fehler bei der Registrierung als Gast'
      }
    },
    ru: {
      titulo: 'Личные данные',
      subtitulo: 'Быстрый вход как гость',
      foto: 'Ваше фото',
      agregarFoto: 'Добавить фото',
      nombre: 'Имя',
      placeholderNombre: 'Ваше имя',
      continuar: 'Продолжить как гость',
      errors: {
        nombreRequired: 'Имя обязательно',
        nombreMin: 'Минимум 2 символа',
        nombrePattern: 'Только буквы и пробелы',
        fotoRequired: 'Фото обязательно',
        fotoInvalidType: 'Неверный формат (только JPG, PNG, GIF, WEBP)',
        fotoMaxSize: 'Максимум 5 МБ',
        fotoInvalid: 'Неверный формат'
      },
      toasts: {
        success: 'Гостевой вход выполнен успешно',
        error: 'Ошибка при регистрации как гость'
      }
    },
    ja: {
      titulo: '個人情報',
      subtitulo: 'ゲストとしてクイックアクセス',
      foto: 'あなたの写真',
      agregarFoto: '写真を追加',
      nombre: '名前',
      placeholderNombre: 'あなたの名前',
      continuar: 'ゲストとして続行',
      errors: {
        nombreRequired: '名前は必須です',
        nombreMin: '2文字以上',
        nombrePattern: '文字とスペースのみ',
        fotoRequired: '写真は必須です',
        fotoInvalidType: '無効な形式（JPG、PNG、GIF、WEBPのみ）',
        fotoMaxSize: '最大5MB',
        fotoInvalid: '無効な形式'
      },
      toasts: {
        success: 'ゲストアクセス成功',
        error: 'ゲストとしての登録中にエラーが発生しました'
      }
    }
  };

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }
  // Validador personalizado para la foto
  validatePhoto(control: any) {
    if (!control.value) {
      return { required: true };
    }

    if (typeof control.value === 'string') {
      return null;
    }

    if (control.value instanceof File) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(control.value.type)) {
        return { invalidType: true };
      }

      // Validar tamaño (máximo 5MB)
      if (control.value.size > 5 * 1024 * 1024) {
        return { maxSize: true };
      }

      return null;
    }

    return { invalidFormat: true };
  }

  // Getters para errores
  get nombre() {
    return this.formData.get('nombre');
  }

  get nombreError() {
    if (this.nombre?.errors?.['required']) return this.textos[this.currentLang].errors.nombreRequired;
    if (this.nombre?.errors?.['minlength']) return this.textos[this.currentLang].errors.nombreMin;
    if (this.nombre?.errors?.['pattern']) return this.textos[this.currentLang].errors.nombrePattern;
    return null;
  }

  get foto() {
    return this.formData.get('foto');
  }

  get fotoError() {
    if (this.foto?.errors?.['required']) return this.textos[this.currentLang].errors.fotoRequired;
    if (this.foto?.errors?.['invalidType']) return this.textos[this.currentLang].errors.fotoInvalidType;
    if (this.foto?.errors?.['maxSize']) return this.textos[this.currentLang].errors.fotoMaxSize;
    if (this.foto?.errors?.['invalidFormat']) return this.textos[this.currentLang].errors.fotoInvalid;
    return null;
  }

  async takePhoto() {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.photoPreview = photo.dataUrl;

      // Convertir a Blob
      const response = await fetch(photo.dataUrl!);
      const blob = await response.blob();

      // Crear File
      const fileName = `avatar-${Date.now()}.${photo.format}`;
      const file = new File([blob], fileName, { type: blob.type });

      // Actualizar formulario
      this.photoToUpload = file;
      this.formData.patchValue({ foto: file });
      this.formData.get('foto')?.updateValueAndValidity();

    } catch (err) {
      console.error('Error al tomar foto:', err);
    }
  }

  async submitForm() {
    this.formSubmitted = true;

    // Marcar campos como tocados para mostrar errores
    this.formData.markAllAsTouched();

    if (this.formData.valid) {
      this.isLoading = true;
      const nombre = this.formData.value.nombre;
      const foto = this.photoToUpload;
      const clienteAnomimo = { nombre, foto };

      try {
        await this.authService.registerAnonimo(clienteAnomimo);
        this.router.navigateByUrl('/local');
      } catch (error) {
        console.error('Error durante el registro:', error);
      } finally {
        this.isLoading = false;
      }
    } else {
      // Scroll al primer error
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}