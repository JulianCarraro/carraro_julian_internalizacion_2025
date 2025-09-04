import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, Firestore, getDoc, getDocs, limit, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {

  constructor(private firestore: Firestore) { }

  async getReservaPorId(id: string): Promise<any> {
    const docRef = doc(this.firestore, `reservas/${id}`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`No se encontró la reserva con ID ${id}`);
    }

    return { id: docSnap.id, ...docSnap.data() } as any;
  }

  async getReservaPorIdCliente(idCliente: string): Promise<any | null> {
    try {
      const reservasRef = collection(this.firestore, 'reservas');
      const q = query(
        reservasRef,
        where('clienteId', '==', idCliente),
        where('estado', '==', 'activa'),
        orderBy('fechaReserva', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error cargando reserva:', error);
      throw error;
    }
  }

  obtenerReservasPendientesAprobacion(): Observable<any[]> {
      return new Observable(observer => {
        const usersRef = collection(this.firestore, 'reservas');
        const q = query(
          usersRef,
          where('estado', '==', 'pendiente'),
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




  async cambiarEstadoReserva(idReserva: string, estado: string): Promise<void> {
    try {
      const reservaRef = doc(this.firestore, 'reservas', idReserva);

      const docSnap = await getDoc(reservaRef);

      if (!docSnap.exists()) {
        throw new Error("No se encontró la reserva con ese ID");
      }

      await updateDoc(reservaRef, { estado });

      console.log('Estado de la reserva actualizado a:', estado);
    } catch (error) {
      console.error("Error al cambiar el estado de la reserva:", error);
      throw new Error("Hubo un error al cambiar el estado de la reserva");
    }
  }


  /** Crea una nueva reserva en estado "pendiente" */
  async createReservation(
    mesaId: string,
    clienteId: string,
    start: Date,
    end: Date
  ): Promise<string> {
    
    if (start <= new Date()) {
      throw new Error('La reserva debe ser para un momento futuro');
    }
    // Verificar solapamientos
    const reservasRef = collection(this.firestore, 'reservas');
    const solapeQ = query(
      reservasRef,
      where('mesaId', '==', mesaId),
      where('startTime', '<', Timestamp.fromDate(end)),
      where('endTime', '>', Timestamp.fromDate(start)),
    );
    const solapeSnap = await getDocs(solapeQ);
    if (!solapeSnap.empty) {
      throw new Error('La mesa ya está reservada en esa franja');
    }

    // Crear reserva
    const docRef = await addDoc(reservasRef, {
      mesaId,
      clienteId,
      estado: 'pendiente',
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      createdAt: Timestamp.now(),
      fechaReserva: Timestamp.fromDate(start),
    });
    return docRef.id;
  }

  /** Devuelve las mesas libres en la franja dada */
  async getAvailableMesas(start: Date, end: Date): Promise<any[]> {
    const today =new Date() 
    if (start < today) {
      throw new Error('La fecha de reserva debe ser en el futuro.');
    }
    // 1) Traer todas las mesas
    const mesasSnap = await getDocs(collection(this.firestore, 'mesas'));
    const mesas: any[] = mesasSnap.docs.map(d => ({
      id: d.id,
      ...(d.data() as any)
    }))

    // 2) Traer reservas solapadas
    const reservasRef = collection(this.firestore, 'reservas');

    const solapeQ = query(
      reservasRef,
      where('startTime', '<', Timestamp.fromDate(end)),
      where('endTime', '>', Timestamp.fromDate(start)),
      where('estado', '==', 'activa')
      
    );
    const solapeSnap = await getDocs(solapeQ);
    console.log("solapeSnap",solapeSnap.docs);

    const ocupadas = new Set(solapeSnap.docs.map(d => d.data()['mesaId']));

    console.log("ocupadas",ocupadas);
    

    // 3) Filtrar
    return mesas.filter(m => !ocupadas.has(m.id));
  }
}
