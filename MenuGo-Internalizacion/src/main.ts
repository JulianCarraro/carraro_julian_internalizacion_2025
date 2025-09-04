import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideHttpClient } from '@angular/common/http';
import { getMessaging, getToken } from 'firebase/messaging';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideCharts(withDefaultRegisterables()),
    provideIonicAngular(),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)), provideFirebaseApp(() => initializeApp({ projectId: "menugo-8fba4", appId: "1:946956729132:web:abf11e721150d1c3d38a89", storageBucket: "menugo-8fba4.firebasestorage.app", apiKey: "AIzaSyAdKaLrKDqOvhCNYmBKJQxnEU6oK-pRO9A", authDomain: "menugo-8fba4.firebaseapp.com", messagingSenderId: "946956729132"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()),
  ],
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then(async (registration) => {
      console.log('SW registrado en scope:', registration.scope);

      // 1) Verificamos que el navegador soporte Notifications
      if (typeof Notification === 'undefined') {
        console.warn('Notifications API no disponible en este navegador.');
        return;
      }

      // 2) Pedimos permiso al usuario
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') {
        console.warn('Permiso de notificaciones denegado.');
        return;
      }

      // 3) Si tenemos permiso, obtenemos el token pasándole el registration
      const messaging = getMessaging();
      try {
        const currentToken = await getToken(messaging, {
          vapidKey: 'BOsE4T-F6ynZPrTscaY0CVqU784p3wIXFs4LrQejZKmVX2UkT3dn1PGQnjO14gEMNg2oS5UoZnaKDKdrLH5NTFI',
          serviceWorkerRegistration: registration
        });
        if (currentToken) {
          console.log('FCM Token:', currentToken);
        } else {
          console.log('No se pudo obtener el token FCM.');
        }
      } catch (err) {
        console.error('Error al obtener el token FCM:', err);
      }
    })
    .catch(err => {
      console.error('Error al registrar el Service Worker:', err);
    });
}
