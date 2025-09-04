import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private supabase: SupabaseClient;
  constructor() {
    this.supabase = createClient(
      'https://ykisgutbszmgkqoreuyp.supabase.co',  // tu URL
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraXNndXRic3ptZ2txb3JldXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTExNDAsImV4cCI6MjA2NTY2NzE0MH0.SjLCvjMxoZU5DfRbcuezxYVU1BQ8HpgukPHr2tQ73JU'
    );
  }

  async uploadAvatar(id: string, file: File): Promise<string> {
    try {
      const bucketName = 'menugo'; // el bucket donde subes
      // ejemplo de path: "public/los-correos/userAvatar.jpg"
      const filePath = `public/perfiles/${id}/avatar-${Date.now()}.jpg`;


      // Subir la imagen
      const { error: uploadError } = await this.supabase
        .storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo imagen: ', uploadError.message);
        throw uploadError;
      }

      // Obtener URL pública
      const { data } = this.supabase
        .storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('No se pudo obtener URL pública');
      }

      return data.publicUrl;
    } catch (err) {
      console.error('uploadAvatar catch error:', err);
      throw err;
    }
  }

  async uploadComida(id: string, tipo: string, file: File): Promise<string> {
    try {
      const bucketName = 'menugo'; // el bucket donde subes
      // ejemplo de path: "public/los-correos/userAvatar.jpg"
      const filePath = `public/comidas/tipo/${id}/comida-${Date.now()}.jpg`;

      // Subir la imagen
      const { error: uploadError } = await this.supabase
        .storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo imagen: ', uploadError.message);
        throw uploadError;
      }

      // Obtener URL pública
      const { data } = this.supabase
        .storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('No se pudo obtener URL pública');
      }

      return data.publicUrl;
    } catch (err) {
      console.error('uploadAvatar catch error:', err);
      throw err;
    }
  }

  async uploadMesa(nroMesa: string, file: File): Promise<string> {
    try {
      const bucketName = 'menugo'; // el bucket donde subes
      // ejemplo de path: "public/los-correos/userAvatar.jpg"
      const filePath = `public/mesas/${nroMesa}.jpg`;

      // Subir la imagen
      const { error: uploadError } = await this.supabase
        .storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo imagen: ', uploadError.message);
        throw uploadError;
      }

      // Obtener URL pública
      const { data } = this.supabase
        .storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('No se pudo obtener URL pública');
      }

      return data.publicUrl;
    } catch (err) {
      console.error('uploadAvatar catch error:', err);
      throw err;
    }
  }

  async uploadProducto(nombre: string, nroFoto: string, file: File): Promise<string> {
    try {
      const bucketName = 'menugo'; // el bucket donde subes
      // ejemplo de path: "public/los-correos/userAvatar.jpg"
      const filePath = `public/products/${nombre}${nroFoto}.jpg`;

      // Subir la imagen
      const { error: uploadError } = await this.supabase
        .storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo imagen: ', uploadError.message);
        throw uploadError;
      }

      // Obtener URL pública
      const { data } = this.supabase
        .storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('No se pudo obtener URL pública');
      }

      return data.publicUrl;
    } catch (err) {
      console.error('uploadAvatar catch error:', err);
      throw err;
    }
  }
}
