import { Injectable } from '@angular/core';
import { collection, collectionData, doc, Firestore, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { NotificacionesService } from './notificaciones.service';

@Injectable({
  providedIn: 'root'
})
export class TareaService {

  constructor(private firestore: Firestore, private notiServices: NotificacionesService) { }

  //solo trae pedidos que no esten listos para servir
  getTasksBySector(sector: string): Observable<any[]> {

    let auxSector;

    if (sector == "cocinero") {
      auxSector = 'cocina';
    }
    else {
      auxSector = 'bar';
    }

    console.log('Buscando tareas para el sector:', auxSector);


    const tareasRef = collection(this.firestore, 'tareas');
    const q = query(
      tareasRef,
      where('sector', '==', auxSector),
      orderBy('creadoEn', 'asc')
    );

    return collectionData(q).pipe(
      map(tareas => tareas.filter(t => t['estado'] !== 'listo para servir'))
    );
  }

  async takeTask(id: string): Promise<void> {
    const tareaRef = doc(this.firestore, 'tareas', id);
    await updateDoc(tareaRef, {
      estado: 'en preparacion',
      iniciadoEn: serverTimestamp()
    });
  }

  
  async marcarComoListo(idTarea: string, pedidoId: string): Promise<void> {
    const tareaRef = doc(this.firestore, 'tareas', idTarea);
    await updateDoc(tareaRef, { estado: 'listo para servir' });

    const tareasRef = collection(this.firestore, 'tareas');
    const q = query(tareasRef, where('idPedido', '==', pedidoId));
    const snap = await getDocs(q);

    const todasListas = snap.docs.every(doc => doc.data()['estado'] === 'listo para servir');

    if (todasListas) {
      const pedidoRef = doc(this.firestore, 'pedidos', pedidoId);
      await updateDoc(pedidoRef, { estado: 'listo para servir' });
      this.notiServices.sendConsultaMozos("Pedido listo", "Hay un nuevo pedido listo para servir", "");
    }
  }

  getTareasPorPedidoEnTiempoReal(idPedido: string): Observable<any[]> {
    const tareasRef = collection(this.firestore, 'tareas');
    const q = query(tareasRef, where('idPedido', '==', idPedido));
    return collectionData(q, { idField: 'id' });
  }


  getTareasPorPedido(idPedido: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const tareasRef = collection(this.firestore, 'tareas');
      const q = query(
        tareasRef,
        where('idPedido', '==', idPedido)
      );

      getDocs(q).then(querySnapshot => {
        const tareas = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        resolve(tareas);
      }).catch(error => {
        reject(error);
      });
    });
  }
}
