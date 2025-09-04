// // Incluir los scripts necesarios de Firebase
// importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// // Configuración de Firebase, usando los mismos valores que usas en el front-end.
// const firebaseConfig = {
//   apiKey: "AIzaSyAdKaLrKDqOvhCNYmBKJQxnEU6oK-pRO9A",
//   authDomain: "menugo-8fba4.firebaseapp.com",
//   projectId: "menugo-8fba4",
//   storageBucket: "menugo-8fba4.firebasestorage.app",
//   messagingSenderId: "946956729132",
//   appId: "1:946956729132:web:abf11e721150d1c3d38a89",
//   measurementId: "G-measurement-id"
// };

// // Inicializa Firebase en el Service Worker
// firebase.initializeApp(firebaseConfig);

// // Obtén el servicio de Firebase Messaging
// const messaging = firebase.messaging();

// // Maneja las notificaciones en segundo plano
// messaging.onBackgroundMessage(function(payload) {
//   console.log('[firebase-messaging-sw.js] onBackgroundMessage ', payload);

//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/assets/icons/icon-96x96.png', 
//     badge: '/assets/icons/icon-48x48.png'
//   };

//   // Muestra la notificación
//   self.registration.showNotification(notificationTitle, notificationOptions);
// });
