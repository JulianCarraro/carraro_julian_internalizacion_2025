import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNote, IonCardSubtitle } from '@ionic/angular/standalone';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { MesaService } from 'src/app/services/mesa.service';
import { addIcons } from 'ionicons';
import { camera, logOut } from 'ionicons/icons';
import { ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { LanguageService } from 'src/app/services/language.service';
import { MapaidiomaPage } from "../../mapaidioma/mapaidioma.page";

@Component({
  selector: 'app-altamesa',
  templateUrl: './altamesa.page.html',
  styleUrls: ['./altamesa.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, ReactiveFormsModule, MapaidiomaPage]
})
export class AltamesaPage implements OnInit {

  formData: FormGroup;
  isLoading: boolean = false;
  qrCode: string = '';
  todasLasFotosCargadas: boolean = false;
  photoPreview: any | null = null;
  photoToUpload: any | null = null;
  formSubmitted = false;
  errorLogin: boolean = false;
  errorText: string = "";
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  tipos: string[] = [
    'VIP',
    'Discapacitados',
    'Estándar',
  ];

  textos: any = {
    es: {
      titulo: 'Alta Mesa',
      subtitulo: 'Ingresá los datos de la mesa',
      numero: 'Número',
      placeholderNumero: 'Número',
      cantComensales: 'Cantidad de comensales',
      placeholderComensales: '10',
      tipo: 'Tipo',
      tipos: ['VIP', 'Discapacitados', 'Estándar'],
      fotoPerfil: 'Foto de perfil',
      agregarFoto: 'Agregar foto',
      guardar: 'Guardar Mesa',
      mensajes: {
        creada: 'Mesa creada',
      },
      errores: {
        fotoRequerida: 'La foto es requerida',
        fotoTipo: 'Formato inválido (solo JPG, PNG, GIF)',
        fotoMax: 'Máximo 5MB',
        fotoFormato: 'Formato inválido',
        guardar: 'Hubo un error al guardar los datos de la mesa'
      },
    },
    en: {
      titulo: 'Add Table',
      subtitulo: 'Enter the table details',
      numero: 'Number',
      placeholderNumero: 'Number',
      cantComensales: 'Number of diners',
      placeholderComensales: '10',
      tipo: 'Type',
      tipos: ['VIP', 'Disabled', 'Standard'],
      fotoPerfil: 'Profile photo',
      agregarFoto: 'Add photo',
      guardar: 'Save Table',
      mensajes: {
        creada: 'Table created',
      },
      errores: {
        fotoRequerida: 'Photo is required',
        fotoTipo: 'Invalid format (only JPG, PNG, GIF)',
        fotoMax: 'Maximum size 5MB',
        fotoFormato: 'Invalid format',
        guardar: 'There was an error saving the table data'
      }
    },
    pt: {
      titulo: 'Cadastrar Mesa',
      subtitulo: 'Insira os dados da mesa',
      numero: 'Número',
      placeholderNumero: 'Número',
      cantComensales: 'Quantidade de clientes',
      placeholderComensales: '10',
      tipo: 'Tipo',
      tipos: ['VIP', 'Deficientes', 'Padrão'],
      fotoPerfil: 'Foto de perfil',
      agregarFoto: 'Adicionar foto',
      guardar: 'Salvar Mesa',
      mensajes: {
        creada: 'Mesa criada',
      },
      errores: {
        fotoRequerida: 'A foto é obrigatória',
        fotoTipo: 'Formato inválido (apenas JPG, PNG, GIF)',
        fotoMax: 'Tamanho máximo 5MB',
        fotoFormato: 'Formato inválido',
        guardar: 'Ocorreu um erro ao salvar os dados da mesa'
      }
    },
    fr: {
      titulo: 'Ajouter une Table',
      subtitulo: 'Entrez les données de la table',
      numero: 'Numéro',
      placeholderNumero: 'Numéro',
      cantComensales: 'Nombre de convives',
      placeholderComensales: '10',
      tipo: 'Type',
      tipos: ['VIP', 'Handicapés', 'Standard'],
      fotoPerfil: 'Photo de profil',
      agregarFoto: 'Ajouter une photo',
      guardar: 'Enregistrer la Table',
      mensajes: {
        creada: 'Table créée',
      },
      errores: {
        fotoRequerida: 'La photo est requise',
        fotoTipo: 'Format invalide (seulement JPG, PNG, GIF)',
        fotoMax: 'Taille maximale 5 Mo',
        fotoFormato: 'Format invalide',
        guardar: 'Une erreur est survenue lors de l’enregistrement de la table'
      }
    },
    de: {
      titulo: 'Tisch Anlegen',
      subtitulo: 'Geben Sie die Tischdaten ein',
      numero: 'Nummer',
      placeholderNumero: 'Nummer',
      cantComensales: 'Anzahl der Gäste',
      placeholderComensales: '10',
      tipo: 'Typ',
      tipos: ['VIP', 'Behindertengerecht', 'Standard'],
      fotoPerfil: 'Profilfoto',
      agregarFoto: 'Foto hinzufügen',
      guardar: 'Tisch Speichern',
      mensajes: {
        creada: 'Tisch erstellt',
      },
      errores: {
        fotoRequerida: 'Das Foto ist erforderlich',
        fotoTipo: 'Ungültiges Format (nur JPG, PNG, GIF)',
        fotoMax: 'Maximal 5MB',
        fotoFormato: 'Ungültiges Format',
        guardar: 'Fehler beim Speichern der Tischdaten'
      }
    },
    ru: {
      titulo: 'Добавить Стол',
      subtitulo: 'Введите данные стола',
      numero: 'Номер',
      placeholderNumero: 'Номер',
      cantComensales: 'Количество посетителей',
      placeholderComensales: '10',
      tipo: 'Тип',
      tipos: ['VIP', 'Для инвалидов', 'Стандарт'],
      fotoPerfil: 'Фото профиля',
      agregarFoto: 'Добавить фото',
      guardar: 'Сохранить Стол',
      mensajes: {
        creada: 'Стол создан',
      },
      errores: {
        fotoRequerida: 'Фото обязательно',
        fotoTipo: 'Неверный формат (только JPG, PNG, GIF)',
        fotoMax: 'Максимум 5 МБ',
        fotoFormato: 'Неверный формат',
        guardar: 'Произошла ошибка при сохранении данных стола'
      }
    },
    ja: {
      titulo: 'テーブル登録',
      subtitulo: 'テーブル情報を入力してください',
      numero: '番号',
      placeholderNumero: '番号',
      cantComensales: '利用者数',
      placeholderComensales: '10',
      tipo: '種類',
      tipos: ['VIP', '障害者用', '標準'],
      fotoPerfil: 'プロフィール写真',
      agregarFoto: '写真を追加',
      guardar: 'テーブルを保存',
      mensajes: {
        creada: 'テーブルが作成されました',
      },
      errores: {
        fotoRequerida: '写真は必須です',
        fotoTipo: '無効な形式（JPG、PNG、GIFのみ）',
        fotoMax: '最大サイズ 5MB',
        fotoFormato: '無効な形式',
        guardar: 'テーブルデータの保存中にエラーが発生しました'
      }
    }
  };

  constructor(private fb: FormBuilder, private mesaService: MesaService,
    private toastCtrl: ToastController, private router: Router, private authService: AuthService) {
    this.formData = this.fb.group({
      numero: ['', [Validators.required]],
      cantComensales: ['', [Validators.required]],
      tipo: [this.tipos[0], [Validators.required]],
      foto: [null, [
        Validators.required,
        this.validatePhoto.bind(this)
      ]]
    });
  }

  ngOnInit() {
    addIcons({ camera, logOut });

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  get fotoError() {
    if (this.foto?.errors?.['required']) return 'La foto es requerida';
    if (this.foto?.errors?.['invalidType']) return 'Formato inválido (solo JPG, PNG, GIF)';
    if (this.foto?.errors?.['maxSize']) return 'Máximo 5MB';
    if (this.foto?.errors?.['invalidFormat']) return 'Formato inválido';
    return null;
  }

  validatePhoto(control: any) {
    if (!control.value) {
      return { required: true };
    }

    if (typeof control.value === 'string') {
      // Es una data URL
      return null;
    }

    if (control.value instanceof File) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(control.value.type)) {
        return { invalidType: true };
      }

      // Validar tamaño (máximo 5MB)
      if (control.value.size > 5 * 1024 * 1024) {
        return { maxSize: true };
      }

      return null;
    }

    return { invalidFormat: true };
  }

  get numero() {
    return this.formData.get('numero');
  }

  get cantComensales() {
    return this.formData.get('cantComensales');
  }

  get tipo() {
    return this.formData.get('tipo');
  }


  get foto() {
    return this.formData.get('foto');
  }

  altaMesa() {
    if (this.formData.valid) {
      this.isLoading = true;

      const credential: any = {
        numero: this.numero?.value.toString(),
        cantComensales: this.cantComensales?.value,
        tipo: this.tipo?.value,
        foto: this.photoToUpload
      };

      this.mesaService.createMesa(credential)
        .then(async () => {
          this.isLoading = false;
          await this.presentToast(this.textos[this.currentLang].mensajes.creada, 'success');
          this.router.navigateByUrl('/homeadmin');
        })
        .catch(async (e) => {
          this.isLoading = false;
          await this.presentToast(this.textos[this.currentLang].errores.guardar, 'danger');
          console.error('Error guardando la mesa:', e);
          this.errorLogin = true;
          this.errorText = this.textos[this.currentLang].errores.guardar;
        });


      // QRCode.toDataURL(JSON.stringify(qrData))
      //   .then((url: string) => {
      //     this.qrCode = url;


      //     this.mesaService.subirFotosYGuardarMesa(this.fotos, mesaData, this.qrCode)
      //       .then((response) => {
      //         console.log('Mesa guardado con éxito', response);
      //         this.isLoading = false;
      //       })
      //       .catch((error) => {
      //         console.error('Error al guardar el mesa', error);
      //         this.isLoading = false;
      //       });
      //   })
      //   .catch((error: any) => {
      //     console.error('Error al generar el QR', error);
      //     this.isLoading = false;
      //   });
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      color
    });
    toast.present();
  }


  async takePhoto() {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      // Preview en DataURL
      this.photoPreview = photo.dataUrl;

      // Convertir a Blob
      const response = await fetch(photo.dataUrl!);
      const blob = await response.blob();

      // Crear File
      const fileName = `mesa-${Date.now()}.${photo.format}`;
      const file = new File([blob], fileName, { type: blob.type });

      // Actualizar formulario
      this.photoToUpload = file;
      this.formData.patchValue({ foto: file });
      this.formData.get('foto')?.updateValueAndValidity();

    } catch (err) {
      console.error('Error al tomar foto:', err);
    }
  }

  logOut() {
    this.isLoading = true;
    this.authService.logOut().then(() => {
      this.isLoading = false;
      this.router.navigate(['/home'], {
        queryParams: { limpiarCampos: true },
        replaceUrl: true
      });
    })
  }


}
