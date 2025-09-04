import { Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, query, updateDoc } from '@angular/fire/firestore';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment.prod';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  // private supabase: SupabaseClient;

  constructor(private firestore: Firestore, private storageService: StorageService) 
  { 
    // this.supabase = createClient(
    //   environment.supabaseUrl,
    //   environment.supabaseAnonKey
    // );
  }

  async getProductos(): Promise<any[]> {
    try {
      const productosRef = collection(this.firestore, 'productos');
      const q = query(
        productosRef
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error: any) {
      console.error('Error obteniendo los productos:', error);
      throw new Error(`Hubo un error al obtener los productos: ${error.message}`);
    }
  }

  async createProducto(productoCredential: any): Promise<string> {
      const col = collection(this.firestore, 'productos');
  
      const fotoUno = await this.storageService.uploadProducto(productoCredential.nombre, "1", productoCredential.fotoUno)
      const fotoDos = await this.storageService.uploadProducto(productoCredential.nombre, "2", productoCredential.fotoDos)
      const fotoTres = await this.storageService.uploadProducto(productoCredential.nombre, "3", productoCredential.fotoTres)
      
      const qrCode = `${productoCredential.nombre}`;
  
      const productoData: any = {
        descripcion: productoCredential.nombre,
        detalle: productoCredential.descripcion,
        precio: productoCredential.precio,
        sector: productoCredential.sector,
        tiempoElaboracion: productoCredential.tiempoElaboracion,
        fotos: [fotoUno, fotoDos, fotoTres],
        qrCode: qrCode,
      };

      if (productoCredential.tipo) {
        productoData.tipo = productoCredential.tipo;
      }
  
      const docRef = await addDoc(col, productoData);
  
      await updateDoc(docRef, { id: docRef.id });
  
      return docRef.id;
    }
  

  async subirFotosYGuardarProducto(fotoFiles: any[], productoData: any, qrCode: string): Promise<any> {
    const fotosUrls: string[] = [];

    const uploadPromises = fotoFiles.map((fotoFile) => {
      return this.getPhotoUrl(fotoFile).then((url) => {
        fotosUrls.push(url);
      });
    });

    
    await Promise.all(uploadPromises);

   
    return this.agregarProductoConQR({
      ...productoData,
      fotos: fotosUrls
    }, qrCode);
  }



  agregarProductoConQR(productoData: any, qrCode: string): Promise<any> {

    const productosRef = collection(this.firestore, 'productos');
    
    return addDoc(productosRef, {
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      tiempoElaboracion: productoData.tiempoElaboracion,
      precio: productoData.precio,
      // fotos: productoData.fotos, 
      qrCode: qrCode, 
      fechaCreacion: new Date() 
    });
  }

  async getPhotoUrl(fotoFile: any): Promise<string> {

    return new Promise((resolve) => {

      resolve(fotoFile); 
    });
  }

  async fetchProductosByIds(ids: string[]): Promise<any[]> {
    const promises = ids.map(async id => {
      const ref = doc(this.firestore, `productos/${id}`);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error(`Producto ${id} no existe`);
      return {
        id: snap.id,
        ...(snap.data() as Omit<any, 'id'>)
      };
    });
    return Promise.all(promises);
  }
}
