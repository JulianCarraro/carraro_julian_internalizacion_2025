import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class JuegosService {

  constructor(private firestore: Firestore) { }

  async actualizarEstadoJuegoPedido(idUsuario: string, juegoId: string, gano: boolean, primerIntento: boolean = false ): Promise<void> {

    const reserva = await this.cargarReservaActual(idUsuario)
    const pedido = await this.cargarPedidoActual(reserva!.id);
    
    console.log("iduser", idUsuario,"juegoid",  juegoId,"gano",  gano,"primer intento", primerIntento);
    
    const q = query(
      collection(this.firestore, 'pedidos'),
      where('idPedido', '==', pedido!.id)
    );
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Pedido no encontrado');

    const docSnap = snap.docs[0];
    const docRef = doc(this.firestore, 'pedidos', docSnap.id);
    const data = docSnap.data() as any;
    
    const intentos: Array<{ idJuego: string; primerIntento: boolean; gano: boolean }> =
      Array.isArray(data.intentoJuegos) ? data.intentoJuegos : [];

    const intentosActualizados = intentos.map(i =>
      i.idJuego == juegoId
        ? { ...i, primerIntento, gano }
        : i
    );
    console.log("intentosActualizados", intentosActualizados);

    await updateDoc(docRef, { intentoJuegos: intentosActualizados });
  }

  async traerEstadoJuegoPedido(idUsuario: string, juegoId: string) {

    const reserva = await this.cargarReservaActual(idUsuario)
    const pedido = await this.cargarPedidoActual(reserva!.id);    

    const q = query(
      collection(this.firestore, 'pedidos'),
      where('idPedido', '==', pedido!.id)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error('Pedido no encontrado');
    }

    const docSnap = snap.docs[0];

    const pedidoData = docSnap.data();

    console.log(pedidoData);


    const intentos = pedidoData["intentoJuegos"] as any[];

    console.log('intentos', intentos);
    

    const intentosJuegos = intentos.filter(i => i.idJuego === juegoId);

    return intentosJuegos[0];
  }

  private async cargarPedidoActual(idReserva: string) {
    try {
      const pedidosRef = collection(this.firestore, 'pedidos');
      const q = query(
        pedidosRef,
        where('reservaId', '==', idReserva),
        orderBy('creadoEn', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const pedidoActual = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };

        return pedidoActual;
      } else {
        return;
      }
    } catch (error) {
      console.error('Error cargando pedido:', error);
      throw error;
      return;
    } finally {
    }
  }

  private async cargarReservaActual(idUser: string) {
    try {
      const reservasRef = collection(this.firestore, 'reservas');
      const q = query(
        reservasRef,
        where('clienteId', '==', idUser),
        where('estado', '==', 'activa'),
        orderBy('fechaReserva', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const reservaActual = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
        return reservaActual;
      }
      return;
    } catch (error) {
      console.error('Error cargando reserva:', error);
      throw error;
      return;
    }
  }

  async traerNombreJuegoPorId(id: string): Promise<string | null> {
    try {
      const juegosRef = collection(this.firestore, 'juegos');
      const q = query(juegosRef, where('id', '==', id));  

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error(`No se encontró un juego con ID: ${id}`);
        return null; 
      }

      const docSnap = querySnapshot.docs[0];  
      const juegoData = docSnap.data();
      
  
      return juegoData['nombre'];
    } catch (error) {
      console.error('Error al obtener el nombre del juego:', error);
      throw error;
    }
  }


}
