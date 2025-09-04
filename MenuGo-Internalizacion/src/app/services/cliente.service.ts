import { Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, orderBy, query, updateDoc, where, serverTimestamp, collectionData, limit, setDoc, getDoc } from '@angular/fire/firestore';
import { onSnapshot } from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { NotificacionesService } from './notificaciones.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private unsubscribe!: () => void;
  constructor(private firestore: Firestore, private notisService: NotificacionesService) { }

  async agregarAListaEspera(id: string): Promise<void> {
    try {

      const q = query(
        collection(this.firestore, 'users'),
        where('id', '==', id)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No se encontró el usuario con ese id");
      }

      const userDoc = querySnapshot.docs[0];
      const userRef = doc(this.firestore, 'users', userDoc.id);


      await updateDoc(userRef, {
        estado: 'en lista de espera',
        fechaUltimaModificacion: new Date()
      });

      this.notisService.sendNotificationToMaitres("Lista de Espera 🚨", "Un cliente acaba de unirse a la lista de espera.", "/asignarmesa");

      console.log('Cliente agregado a la lista de espera');
    } catch (error) {
      console.error("Error al agregar cliente a la lista de espera:", error);
      throw new Error("Hubo un error al agregar el cliente a la lista de espera");
    }
  }

  async cambiarEstadoUsuario(idUser: string, estado: string): Promise<void> {
    try {

      const q = query(
        collection(this.firestore, 'users'),
        where('id', '==', idUser)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No se encontró el usuario con ese id");
      }

      
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(this.firestore, 'users', userDoc.id); 

      
      await updateDoc(userRef, { estado: estado });

      console.log('Estado del usuario actualizado a:', estado);
    } catch (error) {
      console.error("Error al cambiar el estado del usuario:", error);
      throw new Error("Hubo un error al cambiar el estado del usuario");
    }
  }

  async verificarEstadoCliente(email: string): Promise<string | null> {
    try {

      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('email', '==', email));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {

        const clienteDoc = querySnapshot.docs[0];
        const clienteData = clienteDoc.data();
        return clienteData['estado'];
      }
      return null;
    } catch (error) {
      console.error('Error verificando el estado del cliente:', error);
      return null;
    }
  }

  obtenerListaEspera(): Observable<any[]> {
    return new Observable(observer => {
      const usersRef = collection(this.firestore, 'users');
      const q = query(
        usersRef,
        where('estado', '==', 'en lista de espera')
        // orderBy('fechaUltimaModificacion', 'asc')
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        const usuarios = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        observer.next(usuarios);
      }, error => {
        console.error('Error en tiempo real obteniendo la lista de espera:', error);
        observer.error(error);
      });

      return () => unsubscribe(); 
    });
  }

  // obtenerClientesPidiendoCuenta(): Observable<any[]> {
  //   return new Observable(observer => {
  //     const usersRef = collection(this.firestore, 'users');
  //     const q = query(
  //       usersRef,
  //       where('estado', '==', 'esperando cuenta'),
  //       orderBy('fechaUltimaModificacion', 'asc')
  //     );

  //     const unsubscribe = onSnapshot(q, snapshot => {
  //       const usuarios = snapshot.docs.map(doc => ({
  //         id: doc.id,
  //         ...doc.data()
  //       }));
  //       observer.next(usuarios);
  //     }, error => {
  //       console.error('Error en tiempo real obteniendo la lista:', error);
  //       observer.error(error);
  //     });

  //     return () => unsubscribe(); 
  //   });
  // }

  obtenerClientesPidiendoCuenta(): Observable<any[]> {
    return new Observable(observer => {
      const usersRef = collection(this.firestore, 'users');

      // Primera consulta: usuarios con estado "esperando cuenta"
      const q1 = query(
        usersRef,
        where('estado', '==', 'esperando cuenta'),
        orderBy('fechaUltimaModificacion', 'asc')
      );

      // Segunda consulta: usuarios con estado "confirmando pago"
      const q2 = query(
        usersRef,
        where('estado', '==', 'confirmando pago'),
        orderBy('fechaUltimaModificacion', 'asc')
      );

      // Obtenemos los datos de ambas consultas
      const unsubscribe1 = onSnapshot(q1, snapshot => {
        const usuarios1 = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Obtenemos los datos de la segunda consulta
        const unsubscribe2 = onSnapshot(q2, snapshot2 => {
          const usuarios2 = snapshot2.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Unimos los resultados de ambas consultas
          const usuariosCombinados = [...usuarios1, ...usuarios2];
          observer.next(usuariosCombinados);
        }, error => {
          console.error('Error en tiempo real obteniendo los usuarios con estado "confirmando pago":', error);
          observer.error(error);
        });

        return () => {
          unsubscribe2();
        };
      }, error => {
        console.error('Error en tiempo real obteniendo los usuarios con estado "esperando cuenta":', error);
        observer.error(error);
      });

      return () => unsubscribe1(); 
    });
  }



  agregarQR(qrData: any): Promise<any> {
    const qrsRef = collection(this.firestore, 'qrs');
    return addDoc(qrsRef, {
      qrData: qrData,
      fechaCreacion: new Date(),
    });
  }

  async obtenerQR(): Promise<any> {
    const qrsRef = collection(this.firestore, 'qrs');
    const q = query(qrsRef);

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const qrDoc = querySnapshot.docs[0].data();
      return qrDoc['qrData'];
    }
    return null;
  }
  async actualizarEstadoCliente(id: string, estado: string) {
    const clienteRef = doc(this.firestore, 'clientes', id);
    await updateDoc(clienteRef, { estado });
  }

  // Método para obtener el estado en tiempo real (usando onSnapshot)
  obtenerEstadoClienteEnTiempoReal(id: string, callback: (estado: string) => void) {
    const clienteRef = doc(this.firestore, 'users', id);
    // onSnapshot se suscribe a los cambios en tiempo real

    onSnapshot(clienteRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const estado = docSnapshot.data()?.['estado'];
        callback(estado);  // Llama al callback con el estado actualizado

        if (estado === 'en mesa') {  // Cambia 'habilitado' por el valor que necesites
          this.unsubscribe();  // Deja de escuchar los cambios
        }
      }
    });
  }

  async enviarMensajeCliente(
    clienteId: string,
    texto: string,
    nombreCliente: string,
    mesa?: string
  ) {
  
    await setDoc(doc(this.firestore, 'chats', clienteId), {
      lastUpdate: serverTimestamp(),
      mesa: mesa ?? null,
    }, { merge: true });

    const mensajesRef = collection(this.firestore, 'chats', clienteId, 'messages');
    const data = {
      text: texto,
      author: nombreCliente,
      date: serverTimestamp(),
      tipo: 'cliente',
      estado: 'sin contestar',
      mesa: mesa ?? 'desconocida'
    };

    await addDoc(mensajesRef, data);

    this.notisService.sendConsultaMozos(`❓Consulta mesa #${mesa}`, `Mensaje: ${texto}`, "/panelmozo")
  }

  async responderMensajeMozo(
    clienteId: string,
    textoMozo: string,
    nombreMozo: string
  ) {
    const mensajesRef = collection(this.firestore, 'chats', clienteId, 'messages');

  
    const snap = await getDocs(query(
      mensajesRef,
      where('tipo', '==', 'cliente'),
      where('estado', '==', 'sin contestar'),
      orderBy('date', 'desc'),
      limit(1)
    ));

    if (!snap.empty) {
      const msgDoc = snap.docs[0];
      await updateDoc(msgDoc.ref, { estado: 'contestado' });
    }

  
    await setDoc(doc(this.firestore, 'chats', clienteId), {
      lastUpdate: serverTimestamp()
    }, { merge: true });

   
    await addDoc(mensajesRef, {
      text: textoMozo,
      author: nombreMozo,
      date: serverTimestamp(),
      tipo: 'mozo',
      estado: 'contestado'
    });
  }

  getMessages(clienteId: string): Observable<any[]> {
    const roomRef = doc(this.firestore, 'chats', clienteId);
    const messagesRef = collection(roomRef, 'messages');
    const messagesQuery = query(messagesRef, orderBy('date', 'asc'));
    return collectionData(messagesQuery, { idField: 'id' }) as Observable<any[]>;
  }

  getConsultasPendientesRealtime(): Observable<any[]> {
    return new Observable(observer => {
      const chatsRef = collection(this.firestore, 'chats');

      const unsubscribe = onSnapshot(chatsRef, async snapshot => {
        const consultas: any[] = [];

        for (const doc of snapshot.docs) {
          const clienteId = doc.id;
          const mensajesRef = collection(this.firestore, 'chats', clienteId, 'messages');

          const mensajesSnap = await getDocs(query(
            mensajesRef,
            where('tipo', '==', 'cliente'),
            where('estado', '==', 'sin contestar'),
            orderBy('date', 'desc'),
            limit(1)
          ));

          mensajesSnap.forEach(msg => {
            const data = msg.data();
            consultas.push({
              nombre: data['author'],
              fecha: data['date']?.toDate?.() ?? new Date(),
              mensaje: data['text'],
              mesa: data['mesa'],
              clienteId: clienteId
            });
          });
        }

        observer.next(consultas); 
      });

      return () => unsubscribe(); 
    });
  }

  async getClientePorId(id: string): Promise<any> {
    const docRef = doc(this.firestore, `users/${id}`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`No se encontró la reserva con ID ${id}`);
    }

    return { id: docSnap.id, ...docSnap.data() } as any;
  }

}
