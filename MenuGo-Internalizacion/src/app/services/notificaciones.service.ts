import { Injectable } from '@angular/core';
import {
    PushNotifications,
    Token,
    PushNotificationSchema,
    ActionPerformed
} from '@capacitor/push-notifications';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { ToastController } from '@ionic/angular';
import { collection, getDoc, getDocs, onSnapshot, orderBy, query, where } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { getMessaging, getToken } from 'firebase/messaging';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

export interface NotificationPayload {
    token: string;
    title: string;
    body: string;
    link: string;
}



@Injectable({
    providedIn: 'root'
})
export class NotificacionesService {

    private url = environment.backend;
    constructor(
        private firestore: Firestore,
        private toastCtrl: ToastController,
        private http: HttpClient,
    ) {
        this.initPush();
    }

    initPush(): void {
        PushNotifications.requestPermissions().then(permission => {
            if (permission.receive === 'granted') {
                PushNotifications.register();
                this.addListeners();

                // if ('serviceWorker' in navigator) {
                //     navigator.serviceWorker.register('assets/firebase-messaging-sw.js') // Usar ruta relativa
                //         .then((registration) => {
                //             console.log('Service Worker registrado correctamente:', registration);
                //             const messaging = getMessaging();
                //             getToken(messaging, { vapidKey: 'BOsE4T-F6ynZPrTscaY0CVqU784p3wIXFs4LrQejZKmVX2UkT3dn1PGQnjO14gEMNg2oS5UoZnaKDKdrLH5NTFI' })
                //                 .then((currentToken) => {
                //                     if (currentToken) {
                //                         console.log('FCM Token:', currentToken);
                //                     } else {
                //                         console.log('No se pudo obtener el token');
                //                     }
                //                 })
                //                 .catch((err) => {
                //                     console.log('Error al obtener el token:', err);
                //                 });
                //         })
                //         .catch((err) => {
                //             console.log('Error al registrar el Service Worker:', err);
                //         });
                // }
            }
        });
    }

    sendNotification(payload: NotificationPayload): Observable<any> {
        console.log("enviando");

        return this.http.post(this.url, payload);
    }

    private addListeners(): void {
        PushNotifications.addListener('registration', (token: Token) => {
            this.fcmToken = token.value; // lo guardás local, no en Firestore todavía
        });

        PushNotifications.addListener('pushNotificationReceived', (notif) => {
            console.log('Noti recibida:', notif);
        });

        // PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        //     console.log('Acción en noti:', action);
        // });
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            const notification = action.notification;
            console.log('Acción en la notificación:', notification);

            // Aquí puedes redirigir a la vista adecuada, usando el enlace enviado en la notificación
            if (notification.data.link) {
                window.location.href = notification.data.link; // Redirige a la URL que proporcionas
            }
        });
    }

    private fcmToken: string | null = null;

    guardarTokenEnFirestore(uid: string): Promise<void> {
        console.log('notis', this.fcmToken);

        if (!this.fcmToken) return Promise.resolve();

        const ref = doc(this.firestore, 'users', uid);
        return setDoc(ref, {
            fcmToken: this.fcmToken,
            updatedAt: new Date()
        }, { merge: true });
    }

    async eliminarTokenEnFirestore(uid: string): Promise<void> {
        const ref = doc(this.firestore, 'users', uid);
        return await setDoc(ref, {
            fcmToken: '',
            updatedAt: new Date()
        }, { merge: true });
    }



    private async showToast(msg: string) {
        const t = await this.toastCtrl.create({ message: msg, duration: 2000 });
        await t.present();
    }

    sendNotificationToAdmins(title: string, message: string, link: string): void {
        const adminsCollection = collection(this.firestore, 'users');
        const q = query(adminsCollection, where("rol", "==", "dueño"));

        getDocs(q).then(snapshot => {
            if (snapshot.empty) {
                return;
            }

            snapshot.forEach(doc => {
                const admin = doc.data();
                const token = admin['fcmToken']; // Accede al fcmToken del administrador
                let payload: NotificationPayload;

                if (token) {
                    payload = {
                        token: token,
                        title: title,
                        body: message,
                        link: `https://localhost${link}`
                    };
                    // Llama a la función de Firebase para enviar la notificación
                    this.sendNotification(payload).subscribe({
                        next: res => {
                            // aquí puedes mostrar un toast o alerta de éxito
                        },
                        error: err => {
                            console.error('Error al enviar:', err);
                            // manejar error (p. ej. alerta)
                        }
                    });
                }
            });
        }).catch((error) => {
            console.error("Error al obtener administradores:", error);
        });
    }

    sendNotificationToMaitres(title: string, message: string, link: string): void {
        const adminsCollection = collection(this.firestore, 'users');
        const q = query(adminsCollection, where("tipoEmpleado", "==", "maitre"));

        console.log("empezando");


        getDocs(q).then(snapshot => {
            if (snapshot.empty) {
                return;
            }
            console.log("snap", snapshot);

            snapshot.forEach(doc => {
                const admin = doc.data();
                const token = admin['fcmToken']; // Accede al fcmToken del administrador
                let payload: NotificationPayload;

                console.log("token");

                if (token) {
                    payload = {
                        token: token,
                        title: title,
                        body: message,
                        link: `https://localhost${link}`
                    };
                    // Llama a la función de Firebase para enviar la notificación
                    this.sendNotification(payload).subscribe({
                        next: res => {
                            // aquí puedes mostrar un toast o alerta de éxito
                        },
                        error: err => {
                            console.error('Error al enviar:', err);
                            // manejar error (p. ej. alerta)
                        }
                    });
                }
            });
        }).catch((error) => {
            console.error("Error al obtener maitres:", error);
        });
    }

    sendNotificationToSectores(title: string, message: string, link: string): void {
        const adminsCollection = collection(this.firestore, 'users');
        const q = query(adminsCollection, where('tipoEmpleado', 'in', ['cocinero', 'bartender']));

        console.log("empezando");


        getDocs(q).then(snapshot => {
            if (snapshot.empty) {
                return;
            }
            console.log("snap", snapshot);

            snapshot.forEach(doc => {
                const admin = doc.data();
                const token = admin['fcmToken']; // Accede al fcmToken del administrador
                let payload: NotificationPayload;

                console.log("token");

                if (token) {
                    payload = {
                        token: token,
                        title: title,
                        body: message,
                        link: `https://localhost${link}`
                    };
                    // Llama a la función de Firebase para enviar la notificación
                    this.sendNotification(payload).subscribe({
                        next: res => {
                            // aquí puedes mostrar un toast o alerta de éxito
                        },
                        error: err => {
                            console.error('Error al enviar:', err);
                            // manejar error (p. ej. alerta)
                        }
                    });
                }
            });
        }).catch((error) => {
            console.error("Error al obtener maitres:", error);
        });
    }



    sendNotificationMesaAsignada(title: string, message: string, link: string, id: string): void {
        const adminsCollection = collection(this.firestore, 'users');
        const q = query(adminsCollection, where("id", "==", id));

        getDocs(q).then(snapshot => {
            if (snapshot.empty) {
                return;
            }

            snapshot.forEach(doc => {
                const admin = doc.data();
                const token = admin['fcmToken']; // Accede al fcmToken del administrador
                let payload: NotificationPayload;

                if (token) {
                    payload = {
                        token: token,
                        title: title,
                        body: message,
                        link: `https://localhost${link}`
                    };
                    // Llama a la función de Firebase para enviar la notificación
                    this.sendNotification(payload).subscribe({
                        next: res => {
                            // aquí puedes mostrar un toast o alerta de éxito
                        },
                        error: err => {
                            console.error('Error al enviar:', err);
                            // manejar error (p. ej. alerta)
                        }
                    });
                }
            });
        }).catch((error) => {
            console.error("Error al obtener el usuario:", error);
        });
    }

    sendConsultaMozos(title: string, message: string, link: string): void {
        const adminsCollection = collection(this.firestore, 'users');
        const q = query(adminsCollection, where("tipoEmpleado", "==", "mozo"));

        getDocs(q).then(snapshot => {
            if (snapshot.empty) {
                return;
            }

            snapshot.forEach(doc => {
                const admin = doc.data();
                const token = admin['fcmToken']; // Accede al fcmToken del administrador
                let payload: NotificationPayload;

                if (token) {
                    payload = {
                        token: token,
                        title: title,
                        body: message,
                        link: `https://localhost${link}`
                    };
                    // Llama a la función de Firebase para enviar la notificación
                    this.sendNotification(payload).subscribe({
                        next: res => {
                            // aquí puedes mostrar un toast o alerta de éxito
                        },
                        error: err => {
                            console.error('Error al enviar:', err);
                            // manejar error (p. ej. alerta)
                        }
                    });
                }
            });
        }).catch((error) => {
            console.error("Error al obtener mozos:", error);
        });
    }

    // private sendNotificationViaFirebaseFunction(token: string, message: string, link: string): void {
    //     const payload = {
    //         token: token,
    //         title: 'Nuevo cliente registrado',
    //         body: message,
    //         link: link // Incluye el link en los datos
    //     };

    //     // Llama a tu función de Firebase
    //     this.http.post('https://us-central1-menugo-8fba4.cloudfunctions.net/sendPushNotification', payload).subscribe(
    //         response => {
    //             console.log('Notificación enviada correctamente', response);
    //         },
    //         error => {
    //             console.error('Error enviando notificación:', error);
    //         }
    //     );
    // }

    // sendNotificationToAdmins(message: string, link: string): void {
    //     const adminsCollection = collection(this.firestore, 'users');
    //     const q = query(adminsCollection, where("rol", "==", "dueño"));

    //     getDocs(q).then(snapshot => {
    //         if (snapshot.empty) {
    //             console.log("No se encontraron administradores.");
    //             return;
    //         }

    //         snapshot.forEach(doc => {
    //             const admin = doc.data();
    //             const token = admin['fcmToken']; // Accede al fcmToken del administrador

    //             if (token) {
    //                 this.sendFCMNotification(token, message, link); // Envía la notificación
    //             }
    //         });
    //     }).catch((error) => {
    //         console.error("Error al obtener administradores:", error);
    //     });
    // }


    // private sendFCMNotification(token: string, message: string, link: string): void {
    //     const payload = {
    //         notification: {
    //             title: 'Nuevo cliente registrado',
    //             body: message,
    //         },
    //         data: {
    //             link: link
    //         }
    //     };

    //     console.log('enviando');


    //     fetch('https://fcm.googleapis.com/fcm/send', {
    //         method: 'POST',
    //         headers: {
    //             'Authorization': 'key=AIzaSyDuQV9DU6vC6L7sPGXqE00GAp3Dzap_lSs', // Reemplaza con tu clave de servidor FCM
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({
    //             to: token,
    //             notification: payload.notification,
    //             data: payload.data
    //         })
    //     })
    //         .then(response => response.json())
    //         .then(data => {
    //             console.log('Notificación enviada:', data);
    //         })
    //         .catch(error => {
    //             console.error('Error enviando notificación:', error);
    //         });
    // }
}
