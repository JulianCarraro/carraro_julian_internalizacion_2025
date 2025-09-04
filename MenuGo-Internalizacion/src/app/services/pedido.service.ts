import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, docData, Firestore, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { ProductoService } from './producto.service';
import { AuthService } from './auth.service';
import { MesaService } from './mesa.service';
import { ReservaService } from './reserva.service';

interface IntentoJuego {
  idJuego: string;
  primerIntento: boolean;
  gano: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  constructor(private firestore: Firestore, private productoService: ProductoService, private authService: AuthService, private mesaService: MesaService, private reservaService: ReservaService) { }

  async crearPedido(productos: any[], reservaId: any): Promise<string> {
    const pedidosCol = collection(this.firestore, 'pedidos');

    const pedidoRef = doc(pedidosCol);

    const idsList = productos;

    const uniqueIds: string[] = Array.from(new Set(idsList));

    const detalles = await this.productoService.fetchProductosByIds(uniqueIds);

    const tiempoEstimado = detalles.reduce(
      (max, p) => Math.max(max, p.tiempoElaboracion),
      0
    );

    const priceMap = new Map(detalles.map(d => [d.id, d.precio]));

    const precioTotal = productos.reduce((sum, prodId) => {
      const precio = Number(priceMap.get(prodId));
      return sum + (isNaN(precio) ? 0 : precio);
    }, 0);

    const juegos = await this.getAllGames();

    const intentoJuegos: IntentoJuego[] = juegos.map(juego => ({
      idJuego: juego.id,
      primerIntento: true,
      gano: false
    }));

    const nuevoPedido: any = {
      idPedido: pedidoRef.id,
      productos,
      tiempoEstimado,
      precioTotal,
      estado: 'pendiente_aprobacion',
      creadoEn: serverTimestamp(),
      reservaId: reservaId,
      intentoJuegos: intentoJuegos
    };

    await setDoc(pedidoRef, nuevoPedido).then(() => {
      const clienteId = this.authService.getUserData()["id"];
      const clienteRef = doc(this.firestore, 'users', clienteId);
      updateDoc(clienteRef, { estado: 'esperando aprobacion de pedido' });
    })
      .catch((error) => {
        console.error('Error al crear pedido:', error);
        throw new Error(`Hubo un error al crear el pedido: ${error.message}`);
      });

    return pedidoRef.id;
  }

  async getAllGames(): Promise<any[]> {
    const gamesRef = collection(this.firestore, 'juegos');
    const snap = await getDocs(gamesRef);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async confirmarPedido(pedidoId: string): Promise<void> {

    const pedidoRef = doc(this.firestore, 'pedidos', pedidoId);
    const pedidoSnap = await getDoc(pedidoRef);
    if (!pedidoSnap.exists()) {
      throw new Error(`Pedido ${pedidoId} no encontrado`);
    }
    const pedidoData = pedidoSnap.data() as any;


    await updateDoc(pedidoRef, { estado: 'en preparacion' });

    const idsList = pedidoData.productos;

    const uniqueIds: string[] = Array.from(new Set(idsList));

    const detalles = await this.productoService.fetchProductosByIds(uniqueIds);

    const reservaId = pedidoData.reservaId;
    const reservaRef = doc(this.firestore, 'reservas', reservaId);
    const reservaSnap = await getDoc(reservaRef);

    if (!reservaSnap.exists()) {
      throw new Error(`Reserva ${reservaId} no encontrada`);
    }

    const reservaData = reservaSnap.data() as any;
    const clienteId = reservaData.clienteId;

    const clienteRef = doc(this.firestore, 'users', clienteId);
    await updateDoc(clienteRef, { estado: 'esperando pedido' });

    const tareasCol = collection(this.firestore, 'tareas');
    const tareasPromises: Promise<void>[] = [];

    const ultimaTareaQuery = query(tareasCol, orderBy('nroDeTarea', 'desc'), limit(1));
    const ultimaTareaSnap = await getDocs(ultimaTareaQuery);

    let nroInicial = 1;
    if (!ultimaTareaSnap.empty) {
      const ultima = ultimaTareaSnap.docs[0].data();
      nroInicial = (parseInt(ultima['nroDeTarea']) || 0) + 1;
    }

    idsList.forEach((prodId: any, index: number) => {

      const detalle = detalles.find(d => d.id === prodId)!;
      // Generamos la tarea
      const tareaRef = doc(tareasCol);
      const tareaDoc = {
        idTarea: tareaRef.id,
        idPedido: pedidoId,
        idProducto: detalle.id,
        sector: detalle.sector,
        estado: 'pendiente',
        creadoEn: serverTimestamp(),
        nroDeTarea: nroInicial + index
      };
      tareasPromises.push(setDoc(tareaRef, tareaDoc));
    });


    await Promise.all(tareasPromises);
  }

  async rechazarPedido(pedidoId: string): Promise<void> {
    const pedidoRef = doc(this.firestore, 'pedidos', pedidoId);
    await updateDoc(pedidoRef, { estado: 'rechazado' });
  }

  async entregarPedido(pedidoId: string): Promise<void> {
    const pedidoRef = doc(this.firestore, 'pedidos', pedidoId);
    const pedidoSnap = await getDoc(pedidoRef);
    if (!pedidoSnap.exists()) {
      throw new Error(`Pedido ${pedidoId} no encontrado`);
    }
    const pedidoData = pedidoSnap.data() as any;

    await updateDoc(pedidoRef, { estado: 'entregado' });

    const reservaId = pedidoData.reservaId;
    const reservaRef = doc(this.firestore, 'reservas', reservaId);
    const reservaSnap = await getDoc(reservaRef);

    if (!reservaSnap.exists()) {
      throw new Error(`Reserva ${reservaId} no encontrada`);
    }

    const reservaData = reservaSnap.data() as any;
    const clienteId = reservaData.clienteId;

    const clienteRef = doc(this.firestore, 'users', clienteId);
    await updateDoc(clienteRef, { estado: 'confirmar entrega' });
  }

  obtenerPedidosEnTiempoReal(): Observable<any[]> {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const q = query(pedidosRef, orderBy('creadoEn', 'asc'));

    return collectionData(q, { idField: 'id' }).pipe(
      switchMap(async (pedidos: any[]) => {
        const pedidosFiltrados = pedidos.filter(pedido => pedido.estado !== 'entregado');

        return await Promise.all(pedidosFiltrados.map(async pedido => {
          const detalles = await this.productoService.fetchProductosByIds(pedido.productos);

          const resumen = pedido.productos.reduce((acc: any, id: string) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
          }, {});

          const productosDetallados = detalles.map(prod => ({
            ...prod,
            cantidad: resumen[prod.id] || 1
          }));

          return {
            ...pedido,
            productosDetallados
          };
        }));
      }),
      switchMap(result => of(result))
    );
  }


  // obtenerPedidosEnTiempoReal(): Observable<any[]> {
  //   const pedidosRef = collection(this.firestore, 'pedidos');
  //   const q = query(pedidosRef, orderBy('creadoEn', 'asc'));
  //   return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  // }

  watchPedido(pedidoId: string) {
    const tareasRef = collection(this.firestore, 'tareas');
    const q = query(tareasRef, where('idPedido', '==', pedidoId));
    collectionData(q).subscribe((tareas: any[]) => {

      const estados = new Set(tareas.map(t => t.estado));
      let nuevoEstado: any['estado'] = 'pendiente';
      if (estados.has('pendiente')) {
        nuevoEstado = 'pendiente';
      } else if (estados.has('en preparacion')) {
        nuevoEstado = 'en preparacion';
      } else {
        nuevoEstado = 'listo para servir';
      }

      const maxTime = tareas
        .filter(t => t.tiempoEstimado)
        .reduce((max, t) => Math.max(max, t.tiempoEstimado), 0);
      const eta = maxTime
        ? Timestamp.fromMillis(maxTime)
        : null;

      const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);
      updateDoc(pedidoRef, { estado: nuevoEstado, eta });
    });
  }

  getPedidoById(pedidoId: string): Observable<any> {
    const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);

    return docData(pedidoRef, { idField: 'id' }) as Observable<any>;
  }

  getPedidoPorReservaId(reservaId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const pedidosRef = collection(this.firestore, 'pedidos');
      const q = query(
        pedidosRef,
        where('reservaId', '==', reservaId),
        orderBy('creadoEn', 'desc'),
        limit(1)
      );

      getDocs(q).then(querySnapshot => {
        const pedidos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        resolve(pedidos);
      }).catch(error => {
        reject(error);
      });
    });
  }

  async cambiarEstadoPedido(idPedido: string, estado: string): Promise<void> {
    try {

      const q = query(
        collection(this.firestore, 'pedidos'),
        where('idPedido', '==', idPedido)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No se encontró el pedido con ese id");
      }


      const pedidoDoc = querySnapshot.docs[0];
      const pedidoRef = doc(this.firestore, 'pedidos', pedidoDoc.id);


      await updateDoc(pedidoRef, { estado: estado });

      console.log('Estado del pedido actualizado a:', estado);
    } catch (error) {
      console.error("Error al cambiar el estado del pedido:", error);
      throw new Error("Hubo un error al cambiar el estado del pedido");
    }
  }

  async agregarPropina(idPedido: string, propina: number): Promise<void> {
    try {
      const q = query(
        collection(this.firestore, 'pedidos'),
        where('idPedido', '==', idPedido)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No se encontró el pedido con ese id");
      }

      const pedidoDoc = querySnapshot.docs[0];
      const pedidoRef = doc(this.firestore, 'pedidos', pedidoDoc.id);


      await updateDoc(pedidoRef, { propina: propina });

      console.log('propina actualizado a:', propina);
    } catch (error) {
      console.error("Error al cambiar el estado del pedido:", error);
      throw new Error("Hubo un error al cambiar el estado del pedido");
    }
  }


  async cerrarPedidoPorReservaId(reserva: any): Promise<void> {
    try {

      const pedidos = await this.getPedidoPorReservaId(reserva.id);

      if (pedidos.length === 0) {
        throw new Error("No se encontró ningún pedido asociado a esta reserva.");
      }

      const idPedido = pedidos[0].idPedido;

      await this.cambiarEstadoPedido(idPedido, "finalizado");

      const mesaId = reserva.mesaId;

      const mesa = await this.mesaService.getMesaPorId(mesaId);

      await this.mesaService.cambiarEstadoMesa(mesa.id, "disponible");
      await this.reservaService.cambiarEstadoReserva(reserva.id, "finalizada");

      console.log("Pedido cerrado correctamente y mesa marcada como disponible.");
    } catch (error) {
      console.error("Error al cerrar el pedido:", error);
      throw new Error("Hubo un error al cerrar el pedido.");
    }
  }



}
