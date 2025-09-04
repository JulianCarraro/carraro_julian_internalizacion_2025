import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NotificacionesService } from '../services/notificaciones.service';
import { LanguageService } from '../services/language.service';
import { MapaidiomaPage } from "../pages/mapaidioma/mapaidioma.page";
import { CommonModule } from '@angular/common';
// import { SafeArea } from "capacitor-plugin-safe-area";

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IMPORTS_IONIC, MapaidiomaPage, CommonModule],
})
export class HomePage {

  public starIcon: string = 'star-outline';
  public arrowIcon: string = 'arrow-down-circle-outline';
  mapVisible = false;
  langService = inject(LanguageService);
  currentLang: string = 'es';

  constructor(private router: Router, private notis: NotificacionesService) {
    this.setStatusBar();


    // SafeArea.getSafeAreaInsets().then((data) => {
    //   const { insets } = data;
    //   document.body.style.setProperty("--ion-safe-area-top", `${insets.top}px`);
    //   document.body.style.setProperty(
    //     "--ion-safe-area-right",
    //     `${insets.right}px`
    //   );
    //   document.body.style.setProperty(
    //     "--ion-safe-area-bottom",
    //     `${insets.bottom}px`
    //   );
    //   document.body.style.setProperty(
    //     "--ion-safe-area-left",
    //     `${insets.left}px`
    //   );
    // });
  }

  async ngOnInit() {
    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  textos: any = {
    es: {
      titulo: 'MenúGo',
      subtitulo: 'Bienvenidos',
      crearUsuario: 'CREAR USUARIO',
      iniciarSesion: 'INICIAR SESIÓN',
      anonimo: 'ANÓNIMO'
    },
    en: {
      titulo: 'MenúGo',
      subtitulo: 'Welcome',
      crearUsuario: 'CREATE ACCOUNT',
      iniciarSesion: 'SIGN IN',
      anonimo: 'GUEST'
    },
    pt: {
      titulo: 'MenúGo',
      subtitulo: 'Bem-vindos',
      crearUsuario: 'CRIAR USUÁRIO',
      iniciarSesion: 'INICIAR SESSÃO',
      anonimo: 'ANÔNIMO'
    },
    fr: {
      titulo: 'MenúGo',
      subtitulo: 'Bienvenue',
      crearUsuario: 'CRÉER UN COMPTE',
      iniciarSesion: 'SE CONNECTER',
      anonimo: 'ANONYME'
    },
    de: {
      titulo: 'MenúGo',
      subtitulo: 'Willkommen',
      crearUsuario: 'BENUTZER ERSTELLEN',
      iniciarSesion: 'ANMELDEN',
      anonimo: 'ANONYM'
    },
    ru: {
      titulo: 'MenúGo',
      subtitulo: 'Добро пожаловать',
      crearUsuario: 'СОЗДАТЬ ПОЛЬЗОВАТЕЛЯ',
      iniciarSesion: 'ВОЙТИ',
      anonimo: 'АНОНИМНО'
    },
    ja: {
      titulo: 'MenúGo',
      subtitulo: 'ようこそ',
      crearUsuario: 'ユーザー作成',
      iniciarSesion: 'ログイン',
      anonimo: '匿名'
    }
  };


  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  public crearUsuario(): void {
    this.router.navigate(['/register']);
  }

  public iniciarSesion(): void {
    this.router.navigate(['/login']);
  }

  public accesoAnonimo(): void {
    this.router.navigate(['/datos-anonimo']);
  }

  private async setStatusBar() {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: false }); // Cambiado a false
      await StatusBar.setBackgroundColor({ color: '#000000' });
    } catch (error) {
      console.error('Error configuring status bar:', error);
    }
  }

  // noti()
  // {
  //   this.notis.sendNotificationToMaitres("test","test","test");
  // }
}
