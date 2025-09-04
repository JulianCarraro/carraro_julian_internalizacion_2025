import { inject, Injectable } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getRedirectResult, signInWithRedirect, signInWithCredential } from '@angular/fire/auth';
import { collection, doc, Firestore, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, where } from '@angular/fire/firestore';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { NotificacionesService, NotificationPayload } from './notificaciones.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = inject(Auth);
  private storageKey = 'userData';
  userSubject: BehaviorSubject<any | null>;
  public user$: Observable<any | null>;
  private storageService: StorageService = inject(StorageService);
  private notiService: NotificacionesService = inject(NotificacionesService);


  constructor(private firestore: Firestore, private notificationService: NotificacionesService) {

    const data = sessionStorage.getItem(this.storageKey);
    const parsedData = data ? JSON.parse(data) : null;


    this.userSubject = new BehaviorSubject<any | null>(parsedData);


    this.user$ = this.userSubject.asObservable();

  }

  public register(userCredential: any, rol: string) {
    return createUserWithEmailAndPassword(this.auth, userCredential.email, userCredential.password)
      .then(async response => {

        console.log("response", response);

        const userEmail = response.user.email;
        const userId = response.user.uid;

        const foto = await this.storageService.uploadAvatar(userId, userCredential.foto)

        const userData: any = {
          id: userId,
          email: userEmail,
          rol: rol,
          estado: 'pendiente de aprobacion',
          fechaCreacion: new Date(),
          foto: foto,
          nombre: userCredential.nombre,
        };



        if (rol === 'cliente' && userCredential.tipoCliente === 'anonimo') {

          userData['tipoCliente'] = 'anonimo';
        } else if (rol === 'cliente' && userCredential.tipoCliente === 'registrado') {

          userData['apellido'] = userCredential.apellido;
          userData['DNI'] = userCredential.dni;
          userData['tipoCliente'] = 'registrado';
        }


        if (rol === 'dueño' || rol === 'supervisor') {
          userData['apellido'] = userCredential.apellido;
          userData['DNI'] = userCredential.DNI;
          userData['CUIL'] = userCredential.CUIL;
        }


        if (rol === 'empleado') {
          userData['apellido'] = userCredential.apellido;
          userData['DNI'] = userCredential.DNI;
          userData['CUIL'] = userCredential.CUIL;
          userData['tipoEmpleado'] = userCredential.tipoEmpleado;
        }


        if (userCredential.DNIQR) {
          userData['DNIQR'] = userCredential.DNIQR;
        }

        try {

          await setDoc(doc(this.firestore, 'users', userId), userData);
          this.guardarSesion({ id: userId, email: userEmail, rol: rol });
          this.notiService.guardarTokenEnFirestore(userId);



          console.log('llamando a notis');

          this.notificationService.sendNotificationToAdmins(
            'Nuevo Cliente',
            `Un nuevo cliente (${userData.nombre}) ha sido registrado y está pendiente de aprobación.`,
            '/usuarios'
          );

          return response;
        } catch (error) {
          console.error("Error registrando el usuario:", error);
          throw new Error("Hubo un error al registrar al usuario");
        }
      });


  }


  public async registerAnonimo(userCredential: any) {

    const userId = userCredential.nombre + Date.now();
    const userEmail = userId + '@anonimo.com';
    const foto = await this.storageService.uploadAvatar(userId, userCredential.foto)

    const userData: any = {
      id: userId,
      email: userEmail,
      rol: 'cliente',
      estado: 'aprobado',
      fechaCreacion: new Date(),
      foto: foto,
      nombre: userCredential.nombre,
      tipoCliente: 'anonimo'
    };

    try {
      await setDoc(doc(this.firestore, 'users', userId), userData);
      console.log('nombre:', userCredential.nombre);

      this.guardarSesion({ id: userId, email: userEmail, rol: 'cliente', nombre: userCredential.nombre, tipoCliente: 'anonimo' });
      this.notiService.guardarTokenEnFirestore(userId);

    } catch (error) {
      console.error("Error registrando el usuario:", error);
      throw new Error("Hubo un error al registrar al usuario");
    }
  }

  public logIn(userCredential: any) {

    let errorEstado = false;
    let estado = "";


    return signInWithEmailAndPassword(this.auth, userCredential.email, userCredential.password)
      .then(async response => {

        console.log("response", response);

        const userEmail = response.user.email;

        const q = query(
          collection(this.firestore, 'users'),
          where('email', '==', userEmail)
        );

        try {
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw new Error("No se encontró el usuario en la base de datos");
          }

          const userDoc = querySnapshot.docs[0];
          const data = userDoc.data() as { [key: string]: any };

          if (data['estado'] === 'pendiente de aprobacion' || data['estado'] === 'rechazado') {
            errorEstado = true;
            estado = data['estado'];
            throw new Error(`error`);
          }
          console.log('por llamar a notis1');

          const { password, ...userWithoutPassword } = data;

          const userToSave = { id: userDoc.id, ...userWithoutPassword };

          this.guardarSesion(userToSave);
          console.log('por llamar a notis2');

          this.notiService.guardarTokenEnFirestore(userDoc.id);

          return response;
        } catch (error) {
          console.error("Error obteniendo el rol:", error);

          if (errorEstado) {
            throw new Error(`${estado}`);
          } else {
            throw new Error("Hubo un error al obtener el rol del usuario");
          }
        }
      });
  }

  async obtenerUsuarioPorEmail(email: string) {
    const userRef = doc(this.firestore, 'users', email);  // Usamos el email como el ID del documento
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log("No se encontró el usuario");
      return null;
    }
  }

  async logOut(): Promise<void> {
    const data = await this.getUserData();
    await this.notiService.eliminarTokenEnFirestore(data.id);
    localStorage.clear();
    sessionStorage.clear();
    return this.auth.signOut();
  }

  public guardarSesion(userData: any): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(userData));
    this.userSubject.next(userData);
  }

  getUserData(): any {
    const data = sessionStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  async getCurrentUser() {
    return firstValueFrom(authState(this.auth));
  }

  obtenerUsuariosPendientesAprobacion(): Observable<any[]> {
    return new Observable(observer => {
      const usersRef = collection(this.firestore, 'users');
      const q = query(
        usersRef,
        where('estado', '==', 'pendiente de aprobacion'),
        // orderBy('fechaCreacion', 'asc')
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        const usuarios = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log("usuarios en service", usuarios);
        observer.next(usuarios);
      }, error => {
        console.error('Error en tiempo real:', error);
        observer.error(error);
      });

      // Limpiar el listener cuando se desuscribe
      return () => unsubscribe();
    });
  }

  acceptUser(userId: string) {
    return setDoc(doc(this.firestore, 'users', userId), { estado: 'aprobado' }, { merge: true })
      .then(() => {
        console.log(`Usuario ${userId} aprobado`);
      })
      .catch((error) => {
        console.error('Error al aprobar el usuario:', error);
        throw new Error(`Hubo un error al aprobar el usuario: ${error.message}`);
      });
  }

  rejectUser(userId: string) {
    return setDoc(doc(this.firestore, 'users', userId), { estado: 'rechazado' }, { merge: true })
      .then(() => {
        console.log(`Usuario ${userId} rechazado`);
      })
      .catch((error) => {
        console.error('Error al rechazar el usuario:', error);
        throw new Error(`Hubo un error al rechazar el usuario: ${error.message}`);
      });
  }

  // signInWithGoogleProvider(): Promise<any> {
  //   const provider = new GoogleAuthProvider();

  //   return this.callPopUp(provider);
  // }

  // async signInWithGoogleProvider(): Promise<void> {
  //   const provider = new GoogleAuthProvider();
  //   const result = await signInWithPopup(this.auth, provider);
  //   const fbUser = result.user!;
  //   const userRef = doc(this.firestore, 'users', fbUser.uid);
  //   const userSnap = await getDoc(userRef);

  //   // Si es la primera vez, lo creamos pendiente de aprobación
  //   if (!userSnap.exists()) {
  //     await setDoc(userRef, {
  //       id: fbUser.uid,
  //       email: fbUser.email,
  //       nombre: fbUser.displayName,
  //       foto: fbUser.photoURL,
  //       rol: 'cliente',
  //       estado: 'pendiente de aprobacion',
  //       fechaCreacion: new Date()
  //     });
  //   }

  //   // Ahora recuperamos siempre el doc para validar estado
  //   const { estado, ...rest } = (await getDoc(userRef)).data() as any;

  //   if (estado === 'pendiente de aprobacion' || estado === 'rechazado') {
  //     // 1) cerramos sesión en Firebase
  //     await this.auth.signOut();
  //     // 2) limpiamos tu sesión local
  //     this.userSubject.next(null);
  //     sessionStorage.removeItem(this.storageKey);
  //     // 3) lanzamos un error para que el componente muestre mensaje
  //     throw new Error(estado);
  //   }

  //   // Si está aprobado, guardamos la sesión normalmente
  //   const userData = { id: fbUser.uid, estado, ...rest };
  //   this.guardarSesion(userData);
  //   await this.notiService.guardarTokenEnFirestore(fbUser.uid);
  // }

  // async signInWithGoogleProvider(): Promise<void> {
  //   const provider = new GoogleAuthProvider();
  //   await signInWithRedirect(this.auth, provider);
  //   // En este punto la app irá a Google y **no** vuelve aquí hasta reload/redirect.
  // }

  async signInWithGoogleProvider(): Promise<void> {
    // 1) Login nativo
    const g = await GoogleAuth.signIn();

    // 2) Credencial Firebase
    const credential = GoogleAuthProvider.credential(
      g.authentication.idToken,
      g.authentication.accessToken
    );

    // 3) Autentica en Firebase
    const result = await signInWithCredential(this.auth, credential);
    const fbUser = result.user;

    // 4) Firestore: doc “users”
    const userRef = doc(this.firestore, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);

    const dniAleatorio = (Math.floor(Math.random() * 90000000) + 10000000).toString();


    // 5) Si es la primera vez: crearlo “pendiente de aprobacion”
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        id: fbUser.uid,
        email: fbUser.email,
        nombre: fbUser.displayName,
        foto: fbUser.photoURL,
        rol: 'cliente',
        DNI: dniAleatorio,
        estado: 'pendiente de aprobacion',
        fechaCreacion: new Date()
      });
    }

    // 6) Recuperar datos y validar estado
    const data = (await getDoc(userRef)).data() as any;
    const { estado, ...rest } = data;
    if (estado === 'pendiente de aprobacion' || estado === 'rechazado') {
      // cerrar sesión Firebase + limpiar sesión local
      await this.auth.signOut();
      this.userSubject.next(null);
      sessionStorage.removeItem(this.storageKey);
      throw new Error(estado);
    }

    // 7) Guardar sesión local
    const userData = { id: fbUser.uid, estado, ...rest };
    this.guardarSesion(userData);

    // 8) Token de notificaciones
    await this.notiService.guardarTokenEnFirestore(fbUser.uid);
  }

  async signOutAll(): Promise<void> {
    // 1) Firebase Auth
    await this.auth.signOut();

    // 2) Plugin GoogleAuth
    try {
      await GoogleAuth.signOut();
    } catch {
      // si no hay sesión, lo ignoramos
    }

    // 3) Limpia tu sesión local
    this.userSubject.next(null);
    sessionStorage.removeItem(this.storageKey);
  }

  // async signInWithGoogleProvider(): Promise<void> {
  //   const g = await GoogleAuth.signIn();
  //   const cred = GoogleAuthProvider.credential(g.authentication.idToken);
  //   const result = await signInWithCredential(this.auth, cred);
  //   // …tu lógica de creación/validación/guardado de sesión…
  // }

  // /** Procesa el resultado tras volver de Google */
  // async handleRedirectResult(): Promise<void> {
  //   const result = await getRedirectResult(this.auth);
  //   if (!result) {
  //     // No venimos de un redirect, nada que hacer.
  //     return;
  //   }

  //   const fbUser = result.user!;
  //   const userRef = doc(this.firestore, 'users', fbUser.uid);
  //   const userSnap = await getDoc(userRef);

  //   // Si es la primera vez, lo creamos pendiente de aprobación
  //   if (!userSnap.exists()) {
  //     await setDoc(userRef, {
  //       id: fbUser.uid,
  //       email: fbUser.email,
  //       nombre: fbUser.displayName,
  //       foto: fbUser.photoURL,
  //       rol: 'cliente',
  //       estado: 'pendiente de aprobacion',
  //       fechaCreacion: new Date()
  //     });
  //   }

  //   // Recuperamos siempre el doc para validar estado
  //   const { estado, ...rest } = (await getDoc(userRef)).data() as any;

  //   if (estado === 'pendiente de aprobacion' || estado === 'rechazado') {
  //     // 1) cerramos sesión en Firebase
  //     await this.auth.signOut();
  //     // 2) limpiamos tu sesión local
  //     this.userSubject.next(null);
  //     sessionStorage.removeItem(this.storageKey);
  //     // 3) lanzamos un error para que el componente muestre mensaje
  //     throw new Error(estado);
  //   }

  //   // Si está aprobado, guardamos la sesión normalmente
  //   const userData = { id: fbUser.uid, estado, ...rest };
  //   this.guardarSesion(userData);
  //   await this.notiService.guardarTokenEnFirestore(fbUser.uid);
  // }


}
