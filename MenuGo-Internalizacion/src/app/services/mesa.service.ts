import { Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, limit, orderBy, query, setDoc, updateDoc, where, Timestamp } from '@angular/fire/firestore';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment.prod';
import { ClienteService } from './cliente.service';
import { AuthService } from './auth.service';
import { logoFacebook } from 'ionicons/icons';
import { getDoc } from 'firebase/firestore';
import { ReservaService } from './reserva.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class MesaService {

  // private supabase: SupabaseClient;

  constructor(private firestore: Firestore, private clienteService: ClienteService,
    private authService: AuthService, private storageService: StorageService, private reservaService: ReservaService) {

    // this.supabase = createClient(
    //   environment.supabaseUrl,
    //   environment.supabaseAnonKey
    // );
  }


  private readonly GRACE_PERIOD_MINUTES = 3;

  async getUltimaMesa(): Promise<any | undefined> {
    const col = collection(this.firestore, 'mesas');
    const q = query(col, orderBy('numero', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return undefined;
    const data = snap.docs[0].data() as any;
    data.id = snap.docs[0].id;
    return data;
  }

  async createMesa(mesaCredential: any): Promise<string> {
    const col = collection(this.firestore, 'mesas');

    // const numeroMesaAnterior = await this.getUltimaMesa();
    // const nuevoNumeroMesa = (numeroMesaAnterior?.numero ?? 0) + 1;

    const foto = await this.storageService.uploadMesa(mesaCredential.numero, mesaCredential.foto)
    const qrCode = `mesa${mesaCredential.numero}`;

    const mesaData: any = {
      numero: mesaCredential.numero,
      estado: 'disponible',
      cantComensales: mesaCredential.cantComensales,
      fechaCreacion: new Date(),
      foto: foto,
      qrCode: qrCode,
    };

    const docRef = await addDoc(col, mesaData);

    await updateDoc(docRef, { idMesa: docRef.id });

    return docRef.id;
  }

  async obtenerMesaPorId(mesaId: string): Promise<any> {
    const ref = doc(this.firestore, 'mesas', mesaId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Mesa no encontrada');
    return snap.data() as any;
  }

  agregarMesaConQR(productoData: any, qrCode: string): Promise<any> {

    const productosRef = collection(this.firestore, 'mesas');

    return addDoc(productosRef, {
      numero: productoData.numero,
      cantComensales: productoData.cantComensales,
      tipo: productoData.tipo,
      // fotos: productoData.fotos,
      estado: 'disponible',
      qrCode: qrCode,
      fechaCreacion: new Date(),
    }).then((docRef) => {

      return setDoc(docRef, {
        idMesa: docRef.id
      }, { merge: true });
    });
  }

  async getPhotoUrl(fotoFile: any): Promise<string> {

    return new Promise((resolve) => {

      resolve(fotoFile);
    });
  }

  async obtenerMesasDisponibles() {
    const mesasRef = collection(this.firestore, 'mesas');
    const querySnapshot = await getDocs(mesasRef);

    return querySnapshot.docs
      .map((doc) => ({
        idMesa: doc.id,
        ...doc.data(),
      }))
      .filter((mesa: any) => mesa.estado === 'disponible');
  }


  async asignarMesaACliente(clienteId: string, mesaId: string) {
    const reservaRef = collection(this.firestore, 'reservas');

    // Obtener la fecha y hora actual
    const fechaReserva = new Date();

    const reservaData = {
      clienteId: clienteId,
      mesaId: mesaId,
      fechaReserva: fechaReserva,
      estado: 'activa',
      resena: false
    };

    try {
      await addDoc(reservaRef, reservaData);
      console.log('Reserva realizada con éxito');
      await this.cambiarEstadoMesa(mesaId, 'ocupada');

      return await this.clienteService.cambiarEstadoUsuario(clienteId, 'en mesa');
    } catch (error) {
      console.error('Error al asignar mesa al cliente:', error);
    }
  }

  async cambiarEstadoMesa(mesaId: string, estado: string): Promise<void> {
    try {
      const q = query(
        collection(this.firestore, 'mesas'),
        where('idMesa', '==', mesaId),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No se encontró una mesa con ese id");
      }


      const mesaDoc = querySnapshot.docs[0];
      const mesaRef = doc(this.firestore, 'mesas', mesaDoc.id);


      await updateDoc(mesaRef, { estado: estado });

      console.log('Estado de la mesa actualizado a:', estado);
    } catch (error) {
      console.error("Error al cambiar el estado de la mesa:", error);
      throw new Error("Hubo un error al cambiar el estado de la mesa");
    }
  }

  // async validarMesaUsuario(qrMesa: string, idCliente: string) {
  //   try {
  //     // 1. Buscar la mesa escaneada por su QR
  //     const q1 = query(
  //       collection(this.firestore, 'mesas'),
  //       where('qrCode', '==', qrMesa),
  //     );

  //     const queryMesasSnapshot = await getDocs(q1);
  //     if (queryMesasSnapshot.empty) throw new Error("Mesa no encontrada");

  //     const mesaDoc = queryMesasSnapshot.docs[0];
  //     const mesaIdEscaneada = mesaDoc.id;
  //     const numeroMesaEscaneada = mesaDoc.data()["numero"];

  //     // 2. Verificar el estado del cliente
  //     const userDocRef = doc(this.firestore, 'users', idCliente);
  //     const userSnap = await getDoc(userDocRef);

  //     if (!userSnap.exists()) {
  //       throw new Error("Usuario no encontrado.");
  //     }

  //     const userData = userSnap.data();
  //     const estadoCliente = userData["estado"];

  //     if (estadoCliente === "aprobado") {
  //       throw new Error("Primero debe anotarse en la lista de espera.");
  //     }

  //     // 3. Buscar la reserva del cliente
  //     const qReserva = query(
  //       collection(this.firestore, 'reservas'),
  //       where('clienteId', '==', idCliente)
  //     );

  //     const reservasSnapshot = await getDocs(qReserva);
  //     if (reservasSnapshot.empty) throw new Error("No se encontró una reserva para este cliente.");

  //     const reserva = reservasSnapshot.docs[0].data();
  //     const mesaIdAsignada = reserva["mesaId"];

  //     // 4. Comparar mesa escaneada con la mesa asignada
  //     if (mesaIdEscaneada !== mesaIdAsignada) {
  //       const mesaAsignadaDoc = await getDoc(doc(this.firestore, 'mesas', mesaIdAsignada));
  //       const numeroMesaAsignada = mesaAsignadaDoc.exists() ? mesaAsignadaDoc.data()["numero"] : 'desconocida';

  //       throw new Error(`Usted tiene asignada la mesa ${numeroMesaAsignada}.`);
  //     }

  //     // 5. OK - mesa correcta
  //     return {
  //       mesaId: mesaIdEscaneada,
  //       numero: numeroMesaEscaneada
  //     };

  //   } catch (error) {
  //     console.error("Error de validación de mesa:", error);
  //     throw error;
  //   }
  // }

  async validarMesaUsuario(qrMesa: string, idCliente: string) {
    try {
      // 1. Buscar la mesa escaneada por su QR
      const q1 = query(
        collection(this.firestore, 'mesas'),
        where('qrCode', '==', qrMesa),
      );
      const queryMesasSnapshot = await getDocs(q1);
      if (queryMesasSnapshot.empty) throw new Error("Mesa no encontrada");

      const mesaDoc = queryMesasSnapshot.docs[0];
      const mesaIdEscaneada = mesaDoc.id;
      const numeroMesaEscaneada = mesaDoc.data()["numero"];

      // 2. Verificar el estado del cliente
      const userDocRef = doc(this.firestore, 'users', idCliente);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) throw new Error("Usuario no encontrado.");

      const estadoCliente = userSnap.data()!["estado"];
      if (estadoCliente === "aprobado") {
        throw new Error("Primero debe anotarse en la lista de espera.");
      }

      // 3. Obtener la última reserva del cliente (más reciente)
      const reservasRef = collection(this.firestore, 'reservas');
      const qRes = query(
        reservasRef,
        where('clienteId', '==', idCliente),
        orderBy('fechaReserva', 'desc'),
        limit(1)
      );

      const reservasSnap = await getDocs(qRes);
      if (reservasSnap.empty) {
        throw new Error("No se encontró una reserva para este cliente.");
      }

      // 4. Cargar datos de la reserva
      const reservaDoc = reservasSnap.docs[0];
      const reserva = reservaDoc.data() as any;
      const reservaId = reservaDoc.id;

      // 5. Si existe startTime/endTime, comprobamos expiración (caso 2)
      if (reserva.startTime && reserva.endTime) {
        const startTs = reserva.startTime as Timestamp;
        const startMs = startTs.toDate().getTime();
        const endTs = reserva.endTime as Timestamp;
        const endMs = endTs.toDate().getTime();
        const grace = this.GRACE_PERIOD_MINUTES * 60 * 1000; // 15 minutos
        const currentTime = Date.now();

        if (currentTime < startMs || currentTime > endMs) {
          // Si la hora actual está fuera del rango de la reserva
          throw new Error('La reserva no está en el rango de tiempo válido.');
        }
        if (Date.now() > startMs + grace) {
          // Expiró → cancelamos y devolvemos error
          await this.reservaService.cambiarEstadoReserva(reservaId, 'cancelada');
          this.clienteService.cambiarEstadoUsuario(idCliente, "aprobado");   
          throw new Error('Su reserva ha expirado');
        }
      }
      // 6. Si NO tiene startTime/endTime, es reserva “activa inmediata”: permitimos
      else if (reserva.estado !== 'activa' && reserva.estado !== 'confirmada') {
        // Si el estado no es ninguno de estos, bloqueamos
        throw new Error(`Reserva en estado inválido: ${reserva.estado}`);
      }

      // 7. Verificar que la mesa escaneada sea la asignada
      if (mesaIdEscaneada !== reserva.mesaId) {
        const asignadaSnap = await getDoc(doc(this.firestore, 'mesas', reserva.mesaId));
        const numAsignada = asignadaSnap.exists() ? asignadaSnap.data()!["numero"] : 'desconocida';
        throw new Error(`Usted tiene asignada la mesa ${numAsignada}.`);
      }

      // 8. Todo OK: devolvemos datos de la mesa
      return {
        mesaId: mesaIdEscaneada,
        numero: numeroMesaEscaneada
      };

    } catch (error) {
      console.error("Error de validación de mesa:", error);
      throw error;
    }
  }

  guardarIdMesa(id: string) {
    localStorage.setItem('mesaId', id);
  }

  obtenerIdMesa(): string | null {
    return localStorage.getItem('mesaId');
  }

  eliminarIdMesa() {
    localStorage.removeItem('mesaId');
  }

  guardarReservaId(id: string) {
    localStorage.setItem('reservaId', id);
  }

  obtenerReservaId(): string | null {
    return localStorage.getItem('reservaId');
  }

  eliminarReservaId() {
    localStorage.removeItem('reservaId');
  }

  async obtenerUltimaReserva(clienteId: string): Promise<string | null> {
    const reservasRef = collection(this.firestore, 'reservas');
    const q = query(
      reservasRef,
      where('clienteId', '==', clienteId),
      orderBy('fechaReserva', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.id;
    }

    return null;
  }

  async obtenerReserva(clienteId: string): Promise<any | null> {
    const reservasRef = collection(this.firestore, 'reservas');
    const q = query(
      reservasRef,
      where('clienteId', '==', clienteId),
      orderBy('fechaReserva', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      // devolvemos todo el data() y el id del documento
      return { id: docSnap.id, ...docSnap.data() };
    }

    return null;
  }

  async getMesaPorId(id: string): Promise<any> {

    console.log("idMesa en mesa service", id);
    const docRef = doc(this.firestore, 'mesas', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`No se encontró la mesa con ID ${id}`);
    }

    return { id: docSnap.id, ...docSnap.data() } as any;
  }
}
