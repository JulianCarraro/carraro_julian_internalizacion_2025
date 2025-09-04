import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner, IonButton, IonItem, IonInput } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { routes } from '../../app.routes';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { hardwareChip, lockOpen, logoOctocat, paw, sparkles } from 'ionicons/icons';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { ButtonProviderComponent } from "src/app/componentes/button-provider/button-provider.component";
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";
import { Idioma, LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, ReactiveFormsModule, ButtonProviderComponent, MapaidiomaPage]
})
export class LoginPage implements OnInit {

  usuariosEjemplo: any = [
    {
      nombre: {
        es: 'Administrador',
        en: 'Administrator',
        pt: 'Administrador',
        fr: 'Administrateur',
        de: 'Administrator',
        ru: 'Администратор',
        ja: '管理者'
      },
      email: 'admin@gmail.com',
      password: 'abc123',
    },
    {
      nombre: {
        es: 'Mozo',
        en: 'Waiter',
        pt: 'Garçom',
        fr: 'Serveur',
        de: 'Kellner',
        ru: 'Официант',
        ja: 'ウェイター'
      },
      email: 'elcocinero@gmail.com',
      password: '12345678',
    },
    {
      nombre: {
        es: 'Bar',
        en: 'Bartender',
        pt: 'Barman',
        fr: 'Barman',
        de: 'Barkeeper',
        ru: 'Бармен',
        ja: 'バーテンダー'
      },
      email: 'bartender@gmail.com',
      password: 'abc123',
    },
    {
      nombre: {
        es: 'Cocinero',
        en: 'Cook',
        pt: 'Cozinheiro',
        fr: 'Cuisinier',
        de: 'Koch',
        ru: 'Повар',
        ja: '料理人'
      },
      email: 'neymar@gmail.com',
      password: 'abc123',
    },
    {
      nombre: {
        es: 'Maître',
        en: 'Maître',
        pt: 'Maître',
        fr: 'Maître',
        de: 'Maître',
        ru: 'Метрдотель',
        ja: 'メートル'
      },
      email: 'elmaitre@gmail.com',
      password: 'abc123',
    }
  ];

  textos: any = {
    es: {
      titulo: 'MenúGo',
      subtitulo: 'Tu aplicación de restaurantes favorita.',
      correo: '📧 Correo Electrónico',
      contrasena: '🔒 Contraseña',
      acceder: 'Acceder',
      error: 'Hubo un error al intentar iniciar sesión.',
      accesoRapido: 'Acceso rápido:',
      placeholders: {
        email: 'ejemplo@dominio.com',
        password: '••••••••'
      },
      errors: {
        pendingApproval: 'Tu cuenta está siendo evaluada.',
        rejected: 'Usted no pertenece al restaurante.',
        invalidEmail: 'El email es inválido.',
        missingPassword: 'La contraseña es inválida.',
        invalidCredential: 'Credenciales incorrectas.',
        generic: 'Hubo un error al intentar iniciar sesión.'
      }
    },
    en: {
      titulo: 'MenúGo',
      subtitulo: 'Your favorite restaurant app.',
      correo: '📧 Email Address',
      contrasena: '🔒 Password',
      acceder: 'Sign in',
      error: 'There was an error trying to log in.',
      accesoRapido: 'Quick access:',
      placeholders: {
        email: 'example@domain.com',
        password: '••••••••'
      },
      errors: {
        pendingApproval: 'Your account is under review.',
        rejected: 'You don’t belong to the restaurant.',
        invalidEmail: 'Invalid email address.',
        missingPassword: 'Password is required.',
        invalidCredential: 'Incorrect credentials.',
        generic: 'There was an error trying to log in.'
      }
    },
    pt: {
      titulo: 'MenúGo',
      subtitulo: 'Seu aplicativo de restaurantes favorito.',
      correo: '📧 E-mail',
      contrasena: '🔒 Senha',
      acceder: 'Entrar',
      error: 'Ocorreu um erro ao tentar entrar.',
      accesoRapido: 'Acesso rápido:',
      placeholders: {
        email: 'exemplo@dominio.com',
        password: '••••••••'
      },
      errors: {
        pendingApproval: 'Sua conta está em avaliação.',
        rejected: 'Você não pertence ao restaurante.',
        invalidEmail: 'E-mail inválido.',
        missingPassword: 'Senha obrigatória.',
        invalidCredential: 'Credenciais incorretas.',
        generic: 'Ocorreu um erro ao tentar entrar.'
      }
    },
    fr: {
      titulo: 'MenúGo',
      subtitulo: 'Votre application de restaurants préférée.',
      correo: '📧 Courriel',
      contrasena: '🔒 Mot de passe',
      acceder: 'Se connecter',
      error: 'Une erreur est survenue lors de la connexion.',
      accesoRapido: 'Accès rapide:',
      placeholders: {
        email: 'exemple@domaine.com',
        password: '••••••••'
      },
      errors: {
        pendingApproval: 'Votre compte est en cours d’examen.',
        rejected: 'Vous n’appartenez pas au restaurant.',
        invalidEmail: 'Adresse courriel invalide.',
        missingPassword: 'Mot de passe requis.',
        invalidCredential: 'Identifiants incorrects.',
        generic: 'Une erreur est survenue lors de la connexion.'
      }
    },
    de: {
      titulo: 'MenúGo',
      subtitulo: 'Deine Lieblings-Restaurant-App.',
      correo: '📧 E-Mail',
      contrasena: '🔒 Passwort',
      acceder: 'Anmelden',
      error: 'Beim Anmelden ist ein Fehler aufgetreten.',
      accesoRapido: 'Schnellzugriff:',
      placeholders: {
        email: 'beispiel@domain.de',
        password: '••••••••'
      },
      errors: {
        pendingApproval: 'Dein Konto wird geprüft.',
        rejected: 'Du gehörst nicht zum Restaurant.',
        invalidEmail: 'Ungültige E-Mail-Adresse.',
        missingPassword: 'Passwort ist erforderlich.',
        invalidCredential: 'Falsche Zugangsdaten.',
        generic: 'Beim Anmelden ist ein Fehler aufgetreten.'
      }
    },
    ru: {
      titulo: 'MenúGo',
      subtitulo: 'Ваше любимое приложение для ресторанов.',
      correo: '📧 Электронная почта',
      contrasena: '🔒 Пароль',
      acceder: 'Войти',
      error: 'Произошла ошибка при входе.',
      accesoRapido: 'Быстрый доступ:',
      placeholders: {
        email: 'example@domain.com',
        password: '••••••••'
      },
      errors: {
        pendingApproval: 'Ваша учетная запись на рассмотрении.',
        rejected: 'Вы не являетесь сотрудником ресторана.',
        invalidEmail: 'Некорректный адрес электронной почты.',
        missingPassword: 'Требуется пароль.',
        invalidCredential: 'Неверные учетные данные.',
        generic: 'Произошла ошибка при входе.'
      }
    },
    ja: {
      titulo: 'MenúGo',
      subtitulo: 'お気に入りのレストランアプリ。',
      correo: '📧 メールアドレス',
      contrasena: '🔒 パスワード',
      acceder: 'ログイン',
      error: 'ログイン中にエラーが発生しました。',
      accesoRapido: 'クイックアクセス:',
      placeholders: {
        email: 'example@domain.com',
        password: '••••••••'
      },
      errors: {
        pendingApproval: 'アカウントは審査中です。',
        rejected: 'このレストランの所属ではありません。',
        invalidEmail: 'メールアドレスが無効です。',
        missingPassword: 'パスワードは必須です。',
        invalidCredential: '認証情報が正しくありません。',
        generic: 'ログイン中にエラーが発生しました。'
      }
    }
  };

  screen: any = 'signin';
  formData: FormGroup;
  isLoading: boolean = false;
  auth: AuthService = inject(AuthService);
  private router = inject(Router);
  errorLogin: boolean = false;
  errorText: string = "";
  userData: any;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);
  errorCode: string = "";
  private route: ActivatedRoute = inject(ActivatedRoute);
  private async setStatusBar() {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: false }); // Cambiado a false
      await StatusBar.setBackgroundColor({ color: '#000000' });
    } catch (error) {
      console.error('Error configuring status bar:', error);
    }
  }

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.formData = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  limpiarFormulario() {
    this.formData.reset();
    this.errorLogin = false;
    this.errorText = "";
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  async ngOnInit() {
    // await this.setStatusBar();
    addIcons({ logoOctocat, lockOpen, paw, sparkles, hardwareChip });
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

  // async ngOnInit() {
  //   addIcons({ logoOctocat, lockOpen, paw, sparkles, hardwareChip });

  //   // 1) Procesa si venimos de Google
  //   await this.auth.handleRedirectResult();
  //   this.userData = this.auth.getUserData();
  //   if (this.userData) {
  //     this.navigateAfterLogin();
  //   }

  //   // 2) Tu lógica de limpiar campos, statusbar, etc.
  //   this.route.queryParams.subscribe(params => {
  //     if (params['limpiarCampos']) {
  //       this.limpiarFormulario();
  //       this.router.navigate([], { queryParams: {} });
  //     }
  //   });
  // }

  get email() {
    return this.formData.get('email');
  }
  get password() {
    return this.formData.get('password');
  }

  login() {
    const credential: any = {
      email: this.email?.value,
      password: this.password?.value,
    }

    if (this.formData.valid) {
      this.isLoading = true;
      console.log(this.formData)
      this.auth.logIn(credential).then((res) => {
        this.isLoading = false;

        this.userData = this.authService.getUserData();

        if (this.userData.rol == "dueño" || this.userData.rol == "supervisor") {
          this.router.navigateByUrl('/homeadmin');
        }
        else if (this.userData.rol == "empleado") {
          switch (this.userData.tipoEmpleado) {
            case 'maitre':
              this.router.navigateByUrl('/asignarmesa');
              break;
            case 'mozo':
              this.router.navigateByUrl('/panelmozo');
              break;
            case 'cocinero':
            case 'bartender':
              this.router.navigateByUrl('/homeempleados');
              break;
          }
        }
        else {
          this.router.navigateByUrl('/local');
        }
      }).catch((e: { code?: string; message?: string }) => {
        this.isLoading = false;
        this.errorLogin = true;
        this.errorCode = this.getErrorCode(e.code, e.message);
      })
    }
  }

  private getErrorCode(code?: string, rawMessage?: string): string {
    if (rawMessage === 'pendiente de aprobacion') return 'pendingApproval';
    if (rawMessage === 'rechazado') return 'rejected';

    switch (code) {
      case 'auth/invalid-email': return 'invalidEmail';
      case 'auth/missing-password': return 'missingPassword';
      case 'auth/invalid-credential': return 'invalidCredential';
      default: return 'generic';
    }
  }

  rellenarCredenciales(cuenta: any) {
    this.formData.patchValue({
      email: cuenta.email,
      password: cuenta.password
    });
  }

  // async loginWithGoogle() {
  //   this.isLoading = true;
  //   this.errorLogin = false;
  //   try {
  //     await this.auth.signInWithGoogleProvider();
  //     // Recupera tu objeto completo desde sessionStorage
  //     this.userData = this.authService.getUserData();
  //     // Rutea igual que en login()
  //     // this.navigateAfterLogin();

  //   } catch (e: any) {
  //     // Si tu AuthService lanza 'pendiente de aprobacion' o 'rechazado'
  //     this.errorLogin = true;
  //     if (e.message === 'pendiente de aprobacion') {
  //       this.errorText = "Siendo evaluado";
  //     } else if (e.message === 'rechazado') {
  //       this.errorText = "Usted no pertenece al restaurante";
  //     } else {
  //       this.errorText = "Hubo un error al intentar iniciar sesión.";
  //     }

  //   } finally {
  //     this.isLoading = false;
  //   }
  // }

  // async loginWithGoogle() {
  //   this.isLoading = true;
  //   this.errorLogin = false;
  //   try {
  //     // Dispara el redirect; NO vuelve aquí hasta recarga
  //     await this.auth.signInWithGoogleProvider();
  //   } catch (e: any) {
  //     this.errorLogin = true;
  //     if (e.message === 'pendiente de aprobacion') {
  //       this.errorText = "Siendo evaluado";
  //     } else if (e.message === 'rechazado') {  
  //       this.errorText = "Usted no pertenece al restaurante";
  //     } else {
  //       this.errorText = "Hubo un error al intentar iniciar sesión.";
  //     }
  //   } finally {
  //     this.isLoading = false;
  //   }
  // }    

  async loginWithGoogle() {
    this.isLoading = true;
    this.errorLogin = false;
    try {
      await this.auth.signOutAll();
      // dispara todo el flow nativo + guardado de sesión
      await this.auth.signInWithGoogleProvider();

      // aquí ya hay sessionStorage, así que:
      this.userData = this.authService.getUserData();
      this.navigateAfterLogin();

    } catch (e: any) {
      this.errorLogin = true;
      this.errorCode = this.getErrorCode(e?.code, e?.message);
    } finally {
      this.isLoading = false;
    }
  }

  private navigateAfterLogin() {
    const u = this.userData;
    if (u.rol === "dueño" || u.rol === "supervisor") {
      this.router.navigateByUrl('/usuarios');
    } else if (u.rol === "empleado") {
      switch (u.tipoEmpleado) {
        case 'maitre': this.router.navigateByUrl('/asignarmesa'); break;
        case 'mozo': this.router.navigateByUrl('/panelmozo'); break;
        case 'cocinero':
        case 'bartender': this.router.navigateByUrl('/pedidos-empleado'); break;
      }
    } else {
      this.router.navigateByUrl('/local');
    }
  }




}
