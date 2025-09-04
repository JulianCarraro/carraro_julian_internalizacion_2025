import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreenPage } from "./componentes/splash-screen/splash-screen.page";
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

import { Platform } from '@ionic/angular';
import { NotificacionesService } from './services/notificaciones.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { environment } from 'src/environments/environment.prod';
import { LanguageService } from './services/language.service';
import * as L from 'leaflet';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, SplashScreenPage],
})
export class AppComponent {
  private map: any;
  constructor(private noti: NotificacionesService, private platform: Platform, private languageService: LanguageService
  ) {
    this.noti.initPush();

    this.platform.ready().then(() => {
      const responseGoogle = GoogleAuth.initialize({
        clientId: environment.ClientId,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      })
    });
  }

  private initMap() {
    if (this.map) return;

    this.map = L.map('mapid').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      console.log('Click en:', e.latlng);
      this.definirIdioma(lat, lng);
    });
  }

  definirIdioma(lat: number, lng: number) {
    if (lat >= -26.75 && lat <= 1.27 && lng >= -57 && lng <= -35 || lat >= -17 && lat <= -7 && lng >= 13 && lng <= 22) {
      this.languageService.changeLanguage('pt');
    }
    else if (lat > -60 && lat < 28 && lng > -105 && lng < -30) {
      this.languageService.changeLanguage('es');
    }
    else if (lat >= 50.3 && lat <= 53.09 && lng >= 5.14 && lng <= 14.6) {
      this.languageService.changeLanguage('de');
    }
    else if (lat >= 43.3 && lat <= 50.09 && lng >= -2.14 && lng <= 6.6) {
      this.languageService.changeLanguage('fr');
    }
    else if (lat >= 30 && lat <= 60 && lng >= -130 && lng <= -60 || lat >= 5 && lat <= 13 && lng >= 3 && lng <= 12.5
      || lat >= -15 && lat <= 38 && lng >= 114 && lng <= 153) {
      this.languageService.changeLanguage('en');
    }
    else if (lat >= 40 && lat <= 70 && lng >= 30 && lng <= 167) {
      this.languageService.changeLanguage('ru');
    }
    else if (lat >= 34 && lat <= 40 && lng >= 133 && lng <= 140) {
      this.languageService.changeLanguage('ja');
    }
    else {
      this.languageService.changeLanguage('es');
    }
  }

}
