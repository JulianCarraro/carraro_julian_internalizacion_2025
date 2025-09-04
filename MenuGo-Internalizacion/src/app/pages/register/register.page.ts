import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonButton, IonItem, IonInput } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { routes } from '../../app.routes';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { camera, hardwareChip, idCard, lockClosed, lockOpen, logoOctocat, mail, paw, people, person, personAdd, scan, sparkles } from 'ionicons/icons';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerOptions,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerScanResult
} from '@capacitor/barcode-scanner';
import { StorageService } from 'src/app/services/storage.service';
import { ToastController } from '@ionic/angular/standalone';
import { LanguageService } from 'src/app/services/language.service';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, ReactiveFormsModule, MapaidiomaPage]
})
export class RegisterPage implements OnInit {

  usuariosEjemplo = [
    {
      nombre: 'Admin',
      email: 'admin@admin.com',
      password: 'admin123',
      icono: 'paw'
    },
    {
      nombre: 'Invitado',
      email: 'invitado@invitado.com',
      password: '222222',
      icono: 'sparkles'
    },
    {
      nombre: 'Usuario',
      email: 'usuario@usuario.com',
      password: '333333',
      icono: 'logo-octocat'
    },
    {
      nombre: 'Anónimo',
      email: 'anonimo@anonimo.com',
      password: '444444',
      icono: 'star'
    },
    {
      nombre: 'Tester',
      email: 'tester@tester.com',
      password: '555555',
      icono: 'hardware-chip'
    }
  ];

  screen: any = 'signin';
  formData: FormGroup;
  isLoading: boolean = false;
  auth: AuthService = inject(AuthService);
  private router = inject(Router);
  errorLogin: boolean = false;
  errorText: string = "";
  photoPreview: any | null = null;
  photoToUpload: any | null = null;
  isScanning = false;
  qrResult: string | null = null;
  private route: ActivatedRoute = inject(ActivatedRoute);
  formSubmitted = false;
  mapVisible = false;
  langService = inject(LanguageService);
  currentLang: string = 'es';
  

  private async setStatusBar() {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({ color: '#000000' });
    } catch (error) {
      console.error('Error configuring status bar:', error);
    }
  }

  constructor(private fb: FormBuilder, private authService: AuthService, private toastCtrl: ToastController) {
    this.formData = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
      ]],
      nombre: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      apellido: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      dni: ['', [
        Validators.required,
        Validators.pattern(/^\d{7,8}$/),
        Validators.min(1000000),
        Validators.max(99999999)
      ]],
      foto: [null, [
        Validators.required,
        this.validatePhoto.bind(this)
      ]]
    });
  }

  textos: any = {
    es: {
      titulo: 'Registro',
      nombre: 'Nombre',
      placeholderNombre: 'Tu nombre',
      apellido: 'Apellido',
      placeholderApellido: 'Tu apellido',
      dni: 'DNI',
      placeholderDni: 'Número de DNI',
      fotoPerfil: 'Foto de perfil',
      agregarFoto: 'Agregar foto',
      escanearDni: 'Escanear DNI',
      resultadoQr: 'Resultado QR',
      correo: 'Correo Electrónico',
      placeholderCorreo: 'ejemplo@dominio.com',
      contrasena: 'Contraseña',
      repetirContrasena: 'Repetir Contraseña',
      registrar: 'Registrar',
      toasts: {
        success: 'Usuario creado',
        error: 'Error guardando el usuario'
      },
      errors: {
        emailRequired: 'El email es requerido',
        emailInvalid: 'El formato de email es inválido',
        passwordRequired: 'La contraseña es requerida',
        passwordMin: 'Mínimo 6 caracteres',
        passwordPattern: 'Debe contener letras y números',
        nombreRequired: 'El nombre es requerido',
        nombreMin: 'Mínimo 2 caracteres',
        nombrePattern: 'Solo letras y espacios',
        apellidoRequired: 'El apellido es requerido',
        apellidoMin: 'Mínimo 2 caracteres',
        apellidoPattern: 'Solo letras y espacios',
        dniRequired: 'El DNI es requerido',
        dniPattern: 'Debe tener 7 u 8 dígitos',
        dniInvalid: 'DNI inválido',
        fotoRequired: 'La foto es requerida',
        fotoType: 'Formato inválido (solo JPG, PNG, GIF)',
        fotoMax: 'Máximo 5MB',
        fotoFormat: 'Formato inválido'
      }
    },
    en: {
      titulo: 'Register',
      nombre: 'First Name',
      placeholderNombre: 'Your first name',
      apellido: 'Last Name',
      placeholderApellido: 'Your last name',
      dni: 'ID Number',
      placeholderDni: 'Enter your ID',
      fotoPerfil: 'Profile Photo',
      agregarFoto: 'Add photo',
      escanearDni: 'Scan ID',
      resultadoQr: 'QR Result',
      correo: 'Email Address',
      placeholderCorreo: 'example@domain.com',
      contrasena: 'Password',
      repetirContrasena: 'Repeat Password',
      registrar: 'Register',
      toasts: {
        success: 'User created',
        error: 'Error saving user'
      },
      errors: {
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email format',
        passwordRequired: 'Password is required',
        passwordMin: 'Minimum 6 characters',
        passwordPattern: 'Must contain letters and numbers',
        nombreRequired: 'First name is required',
        nombreMin: 'Minimum 2 characters',
        nombrePattern: 'Only letters and spaces allowed',
        apellidoRequired: 'Last name is required',
        apellidoMin: 'Minimum 2 characters',
        apellidoPattern: 'Only letters and spaces allowed',
        dniRequired: 'ID is required',
        dniPattern: 'Must be 7 or 8 digits',
        dniInvalid: 'Invalid ID',
        fotoRequired: 'Photo is required',
        fotoType: 'Invalid format (only JPG, PNG, GIF)',
        fotoMax: 'Maximum 5MB',
        fotoFormat: 'Invalid format'
      }
    },
    pt: {
      titulo: 'Registro',
      nombre: 'Nome',
      placeholderNombre: 'Seu nome',
      apellido: 'Sobrenome',
      placeholderApellido: 'Seu sobrenome',
      dni: 'RG/CPF',
      placeholderDni: 'Número de documento',
      fotoPerfil: 'Foto de perfil',
      agregarFoto: 'Adicionar foto',
      escanearDni: 'Escanear documento',
      resultadoQr: 'Resultado QR',
      correo: 'E-mail',
      placeholderCorreo: 'exemplo@dominio.com',
      contrasena: 'Senha',
      repetirContrasena: 'Repetir senha',
      registrar: 'Registrar',
      toasts: {
        success: 'Usuário criado',
        error: 'Erro ao salvar usuário'
      },
      errors: {
        emailRequired: 'O e-mail é obrigatório',
        emailInvalid: 'Formato de e-mail inválido',
        passwordRequired: 'A senha é obrigatória',
        passwordMin: 'Mínimo de 6 caracteres',
        passwordPattern: 'Deve conter letras e números',
        nombreRequired: 'O nome é obrigatório',
        nombreMin: 'Mínimo de 2 caracteres',
        nombrePattern: 'Apenas letras e espaços',
        apellidoRequired: 'O sobrenome é obrigatório',
        apellidoMin: 'Mínimo de 2 caracteres',
        apellidoPattern: 'Apenas letras e espaços',
        dniRequired: 'O documento é obrigatório',
        dniPattern: 'Deve ter 7 ou 8 dígitos',
        dniInvalid: 'Documento inválido',
        fotoRequired: 'A foto é obrigatória',
        fotoType: 'Formato inválido (apenas JPG, PNG, GIF)',
        fotoMax: 'Máximo de 5MB',
        fotoFormat: 'Formato inválido'
      }
    },
    fr: {
      titulo: 'Inscription',
      nombre: 'Prénom',
      placeholderNombre: 'Votre prénom',
      apellido: 'Nom',
      placeholderApellido: 'Votre nom',
      dni: 'Numéro d’identification',
      placeholderDni: 'Entrez votre ID',
      fotoPerfil: 'Photo de profil',
      agregarFoto: 'Ajouter une photo',
      escanearDni: 'Scanner la carte',
      resultadoQr: 'Résultat QR',
      correo: 'Courriel',
      placeholderCorreo: 'exemple@domaine.com',
      contrasena: 'Mot de passe',
      repetirContrasena: 'Répéter le mot de passe',
      registrar: 'S’inscrire',
      toasts: {
        success: 'Utilisateur créé',
        error: 'Erreur lors de l’enregistrement'
      },
      errors: {
        emailRequired: 'L’e-mail est requis',
        emailInvalid: 'Format d’e-mail invalide',
        passwordRequired: 'Le mot de passe est requis',
        passwordMin: 'Minimum 6 caractères',
        passwordPattern: 'Doit contenir des lettres et des chiffres',
        nombreRequired: 'Le prénom est requis',
        nombreMin: 'Minimum 2 caractères',
        nombrePattern: 'Seulement lettres et espaces',
        apellidoRequired: 'Le nom est requis',
        apellidoMin: 'Minimum 2 caractères',
        apellidoPattern: 'Seulement lettres et espaces',
        dniRequired: 'L’ID est requis',
        dniPattern: 'Doit avoir 7 ou 8 chiffres',
        dniInvalid: 'ID invalide',
        fotoRequired: 'La photo est requise',
        fotoType: 'Format invalide (seulement JPG, PNG, GIF)',
        fotoMax: 'Maximum 5 Mo',
        fotoFormat: 'Format invalide'
      }
    },
    de: {
      titulo: 'Registrierung',
      nombre: 'Vorname',
      placeholderNombre: 'Dein Vorname',
      apellido: 'Nachname',
      placeholderApellido: 'Dein Nachname',
      dni: 'Ausweisnummer',
      placeholderDni: 'ID eingeben',
      fotoPerfil: 'Profilfoto',
      agregarFoto: 'Foto hinzufügen',
      escanearDni: 'Ausweis scannen',
      resultadoQr: 'QR-Ergebnis',
      correo: 'E-Mail',
      placeholderCorreo: 'beispiel@domain.com',
      contrasena: 'Passwort',
      repetirContrasena: 'Passwort wiederholen',
      registrar: 'Registrieren',
      toasts: {
        success: 'Benutzer erstellt',
        error: 'Fehler beim Speichern des Benutzers'
      },
      errors: {
        emailRequired: 'E-Mail ist erforderlich',
        emailInvalid: 'Ungültiges E-Mail-Format',
        passwordRequired: 'Passwort ist erforderlich',
        passwordMin: 'Mindestens 6 Zeichen',
        passwordPattern: 'Muss Buchstaben und Zahlen enthalten',
        nombreRequired: 'Vorname ist erforderlich',
        nombreMin: 'Mindestens 2 Zeichen',
        nombrePattern: 'Nur Buchstaben und Leerzeichen',
        apellidoRequired: 'Nachname ist erforderlich',
        apellidoMin: 'Mindestens 2 Zeichen',
        apellidoPattern: 'Nur Buchstaben und Leerzeichen',
        dniRequired: 'Ausweisnummer ist erforderlich',
        dniPattern: 'Muss 7 oder 8 Ziffern haben',
        dniInvalid: 'Ungültige Ausweisnummer',
        fotoRequired: 'Foto ist erforderlich',
        fotoType: 'Ungültiges Format (nur JPG, PNG, GIF)',
        fotoMax: 'Maximal 5 MB',
        fotoFormat: 'Ungültiges Format'
      }
    },
    ru: {
      titulo: 'Регистрация',
      nombre: 'Имя',
      placeholderNombre: 'Ваше имя',
      apellido: 'Фамилия',
      placeholderApellido: 'Ваша фамилия',
      dni: 'Номер паспорта',
      placeholderDni: 'Введите номер',
      fotoPerfil: 'Фото профиля',
      agregarFoto: 'Добавить фото',
      escanearDni: 'Сканировать документ',
      resultadoQr: 'Результат QR',
      correo: 'Электронная почта',
      placeholderCorreo: 'пример@домен.com',
      contrasena: 'Пароль',
      repetirContrasena: 'Повторите пароль',
      registrar: 'Зарегистрироваться',
      toasts: {
        success: 'Пользователь создан',
        error: 'Ошибка при сохранении пользователя'
      },
      errors: {
        emailRequired: 'Электронная почта обязательна',
        emailInvalid: 'Неверный формат электронной почты',
        passwordRequired: 'Пароль обязателен',
        passwordMin: 'Минимум 6 символов',
        passwordPattern: 'Должен содержать буквы и цифры',
        nombreRequired: 'Имя обязательно',
        nombreMin: 'Минимум 2 символа',
        nombrePattern: 'Только буквы и пробелы',
        apellidoRequired: 'Фамилия обязательна',
        apellidoMin: 'Минимум 2 символа',
        apellidoPattern: 'Только буквы и пробелы',
        dniRequired: 'Номер обязателен',
        dniPattern: 'Должен содержать 7 или 8 цифр',
        dniInvalid: 'Неверный номер',
        fotoRequired: 'Фото обязательно',
        fotoType: 'Неверный формат (только JPG, PNG, GIF)',
        fotoMax: 'Максимум 5 МБ',
        fotoFormat: 'Неверный формат'
      }
    },
    ja: {
      titulo: '登録',
      nombre: '名前',
      placeholderNombre: 'あなたの名前',
      apellido: '苗字',
      placeholderApellido: 'あなたの苗字',
      dni: 'ID番号',
      placeholderDni: 'IDを入力',
      fotoPerfil: 'プロフィール写真',
      agregarFoto: '写真を追加',
      escanearDni: 'IDをスキャン',
      resultadoQr: 'QR結果',
      correo: 'メールアドレス',
      placeholderCorreo: 'example@domain.com',
      contrasena: 'パスワード',
      repetirContrasena: 'パスワードを再入力',
      registrar: '登録',
      toasts: {
        success: 'ユーザーが作成されました',
        error: 'ユーザーの保存中にエラーが発生しました'
      },
      errors: {
        emailRequired: 'メールアドレスは必須です',
        emailInvalid: '無効なメール形式です',
        passwordRequired: 'パスワードは必須です',
        passwordMin: '最低6文字',
        passwordPattern: '文字と数字を含める必要があります',
        nombreRequired: '名前は必須です',
        nombreMin: '最低2文字',
        nombrePattern: '文字とスペースのみ',
        apellidoRequired: '苗字は必須です',
        apellidoMin: '最低2文字',
        apellidoPattern: '文字とスペースのみ',
        dniRequired: 'ID番号は必須です',
        dniPattern: '7桁または8桁でなければなりません',
        dniInvalid: '無効なID番号です',
        fotoRequired: '写真は必須です',
        fotoType: '無効な形式です（JPG、PNG、GIFのみ）',
        fotoMax: '最大5MB',
        fotoFormat: '無効な形式です'
      }
    }
  };


  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  validatePhoto(control: any) {
    if (!control.value) {
      return { required: true };
    }

    if (typeof control.value === 'string') {
      // Es una data URL
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

  limpiarFormulario() {
    this.formData.reset();
    this.errorLogin = false;
    this.errorText = "";
  }

  async ngOnInit() {
    await addIcons({ person, people, idCard, scan, mail, lockClosed, personAdd, camera });
    await this.setStatusBar();
    this.route.queryParams.subscribe(params => {
      if (params['limpiarCampos']) {
        this.limpiarFormulario();
        this.router.navigate([], { queryParams: {} });
      }
    });

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  // get email() {
  //   return this.formData.get('email');
  // }
  // get password() {
  //   return this.formData.get('password');
  // }
  // get nombre() {
  //   return this.formData.get('nombre');
  // }
  // get apellido() {
  //   return this.formData.get('apellido');
  // }
  // get dni() {
  //   return this.formData.get('dni');
  // }
  // get foto() {
  //   return this.formData.get('foto');
  // }
  // Getters actualizados con mensajes de error
  get email() {
    return this.formData.get('email');
  }

  get emailError() {
    if (this.email?.errors?.['required']) return this.textos[this.currentLang].errors.emailRequired;
    if (this.email?.errors?.['email']) return this.textos[this.currentLang].errors.emailInvalid;
    if (this.email?.errors?.['pattern']) return this.textos[this.currentLang].errors.emailInvalid;
    return null;
  }

  get password() {
    return this.formData.get('password');
  }

  get passwordError() {
    if (this.password?.errors?.['required']) return this.textos[this.currentLang].errors.passwordRequired;
    if (this.password?.errors?.['minlength']) return this.textos[this.currentLang].errors.passwordMin;
    if (this.password?.errors?.['pattern']) return this.textos[this.currentLang].errors.passwordPattern;
    return null;
  }

  get nombre() {
    return this.formData.get('nombre');
  }

  get nombreError() {
    if (this.nombre?.errors?.['required']) return this.textos[this.currentLang].errors.nombreRequired;
    if (this.nombre?.errors?.['minlength']) return this.textos[this.currentLang].errors.nombreMin;
    if (this.nombre?.errors?.['pattern']) return this.textos[this.currentLang].errors.nombrePattern;
    return null;
  }

  get apellido() {
    return this.formData.get('apellido');
  }

  get apellidoError() {
    if (this.apellido?.errors?.['required']) return this.textos[this.currentLang].errors.apellidoRequired;
    if (this.apellido?.errors?.['minlength']) return this.textos[this.currentLang].errors.apellidoMin;
    if (this.apellido?.errors?.['pattern']) return this.textos[this.currentLang].errors.apellidoPattern;
    return null;
  }

  get dni() {
    return this.formData.get('dni');
  }

  get dniError() {
    if (this.dni?.errors?.['required']) return this.textos[this.currentLang].errors.dniRequired;
    if (this.dni?.errors?.['pattern']) return this.textos[this.currentLang].errors.dniPattern;
    if (this.dni?.errors?.['min']) return this.textos[this.currentLang].errors.dniInvalid;
    if (this.dni?.errors?.['max']) return this.textos[this.currentLang].errors.dniRequired;
    return null;
  }

  get foto() {
    return this.formData.get('foto');
  }

  get fotoError() {
    if (this.foto?.errors?.['required']) return this.textos[this.currentLang].errors.fotoRequired;
    if (this.foto?.errors?.['invalidType']) return this.textos[this.currentLang].errors.fotoType;
    if (this.foto?.errors?.['maxSize']) return this.textos[this.currentLang].errors.fotoMax;
    if (this.foto?.errors?.['invalidFormat']) return this.textos[this.currentLang].errors.fotoFormat;
    return null;
  }

  // public register() {
  //   const credential: any = {
  //     email: this.email?.value,
  //     password: this.password?.value,
  //     nombre: this.nombre?.value,
  //     apellido: this.apellido?.value,
  //     dni: this.dni?.value,
  //     foto: this.photoToUpload,
  //     tipoCliente: 'registrado'
  //   };

  //   if (this.formData.valid) {
  //     this.isLoading = true;
  //     console.log(this.formData);

  //     const rol = 'cliente';

  //     this.authService.register(credential, rol)
  //       .then(() => {
  //         this.isLoading = false;
  //         this.router.navigateByUrl('/home');
  //       })
  //       .catch((e) => {
  //         this.isLoading = false;
  //         console.error('Error guardando el usuario:', e);
  //         this.errorLogin = true;
  //         this.errorText = 'Hubo un error al guardar los datos del usuario';
  //       });
  //   }
  // }

  public register() {
    this.formSubmitted = true;

    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.formData.controls).forEach(key => {
      this.formData.get(key)?.markAsTouched();
    });

    if (this.formData.valid) {
      const credential: any = {
        email: this.email?.value,
        password: this.password?.value,
        nombre: this.nombre?.value,
        apellido: this.apellido?.value,
        dni: this.dni?.value,
        foto: this.photoToUpload,
        tipoCliente: 'registrado'
      };

      this.isLoading = true;
      const rol = 'cliente';

      this.authService.register(credential, rol)
        .then(async () => {
          this.isLoading = false;
          await this.presentToast(this.textos[this.currentLang].toasts.success, 'success');
          this.router.navigateByUrl('/home');
        })
        .catch(async (e) => {
          this.isLoading = false;
          await this.presentToast(this.textos[this.currentLang].toasts.error, 'danger');
          console.error('Error guardando el usuario:', e);
          this.errorLogin = true;
          this.errorText = this.textos[this.currentLang].toasts.error;
        });
    } else {
      // Scroll al primer error
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  rellenarCredenciales(cuenta: any) {
    this.formData.patchValue({
      email: cuenta.email,
      password: cuenta.password
    });
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      color
    });
    toast.present();
  }



  // async takePhoto() {
  //   try {
  //     const photo = await Camera.getPhoto({
  //       quality: 80,
  //       resultType: CameraResultType.DataUrl,
  //       source: CameraSource.Camera
  //     });
  //     this.photoToUpload = photo.dataUrl;
  //     this.photoPreview = photo.dataUrl;
  //     this.formData.patchValue({ foto: photo.dataUrl });
  //   } catch (err) {
  //     console.error('Error al tomar foto:', err);
  //   }
  // }
  // async takePhoto() {
  //   try {
  //     const photo = await Camera.getPhoto({
  //       quality: 80,
  //       resultType: CameraResultType.DataUrl,
  //       source: CameraSource.Camera
  //     });

  //     // preview en DataURL
  //     this.photoPreview = photo.dataUrl;

  //     // 1) convertí el DataURL a Blob
  //     const response = await fetch(photo.dataUrl!);
  //     const blob = await response.blob(); // tiene blob.type (image/jpeg o png)

  //     // 2) creá un File con nombre y tipo
  //     const fileName = `avatar-${Date.now()}.jpg`;
  //     const file = new File([blob], fileName, { type: blob.type });

  //     // 3) almacenalo en tu variable y en el formulario
  //     this.photoToUpload = file;
  //     this.formData.patchValue({ foto: file });

  //   } catch (err) {
  //     console.error('Error al tomar foto:', err);
  //   }
  // }

  async takePhoto() {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      // Preview en DataURL
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
  async scan() {
    this.isScanning = true;
    try {
      const options: CapacitorBarcodeScannerOptions = {
        hint: 11, // PDF_417 (valor numérico según la documentación)
        scanText: 'Escaneá el DNI',
        scanButton: false,
        cameraDirection: 1, // BACK (cámara trasera)
        android: {
          scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING
        }
      };

      const result: CapacitorBarcodeScannerScanResult = await CapacitorBarcodeScanner.scanBarcode(options);

      if (result.ScanResult) {
        const parts = result.ScanResult.split('@');
        const apellidos = parts[1];
        const nombres = parts[2];
        const dni = parts[4];

        this.cargarFormSegunDni(apellidos, nombres, dni);
      } else {
        // Escaneo cancelado o sin resultado
      }
    } catch (err: any) {
      if (err === 'PERMISSION_DENIED') {
        alert('Por favor, habilita los permisos de cámara en la configuración de tu dispositivo');
      } else {
        alert('Error al escanear: ' + (err.message || err));
      }
      console.error(err);
    } finally {
      this.isScanning = false;
    }
  }

  private cargarFormSegunDni(apellido: string, nombre: string, dni: string) {
    this.formData.patchValue({ apellido, nombre, dni })
    console.log({ apellido, nombre, dni });
  }
}