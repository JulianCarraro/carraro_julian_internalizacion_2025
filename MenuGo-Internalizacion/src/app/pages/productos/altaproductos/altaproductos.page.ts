import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { ProductoService } from 'src/app/services/producto.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { camera, logOut } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { MapaidiomaPage } from "../../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-altaproductos',
  templateUrl: './altaproductos.page.html',
  styleUrls: ['./altaproductos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC, ReactiveFormsModule, MapaidiomaPage]
})
export class AltaproductosPage implements OnInit {

  formData: FormGroup;
  isLoading: boolean = false;
  qrCode: string = '';
  fotoPreviews: (string | null)[] = [null, null, null];
  fotoFiles: (File | null)[] = [null, null, null];
  todasLasFotosCargadas: boolean = false;
  errorLogin: boolean = false;
  errorText: string = "";
  userData: any;
  tipos = [
    { key: 'comidas', valor: 'comidas' },
    { key: 'postres', valor: 'postres' }
  ];
  titulo: string = "plato";
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);


  constructor(private fb: FormBuilder, private productoService: ProductoService,
    private toastCtrl: ToastController, private router: Router, private authService: AuthService
  ) {
    this.formData = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      tiempoElaboracion: ['', [Validators.required]],
      precio: ['', [Validators.required]],
      tipo: [this.tipos[0], [Validators.required]],
      fotos: this.fb.control<File[] | null>(null, [Validators.required])
    });
  }

  ngOnInit() {
    addIcons({ camera, logOut });
    this.userData = this.authService.getUserData();
    console.log("userData", this.userData);
    this.tipos = this.textos[this.currentLang].tipos;

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
      // refrescar opciones del select según idioma
      const actual = this.formData.get('tipo')?.value;
      this.tipos = this.textos[lang].tipos;
      // si el valor anterior no existe en el nuevo idioma, setear el primero
      if (!this.tipos.includes(actual)) {
        this.formData.patchValue({ tipo: this.tipos[0] });
      }
    });

  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  get nombre() {
    return this.formData.get('nombre');
  }

  get descripcion() {
    return this.formData.get('descripcion');
  }

  get tiempoElaboracion() {
    return this.formData.get('tiempoElaboracion');
  }

  get precio() {
    return this.formData.get('precio');
  }

  get tipo() {
    return this.formData.get('tipo');
  }

  get fotosControl() {
    return this.formData.get('fotos');
  }

  get tituloTraducido(): string {
    const roleKey = this.userData?.tipoEmpleado === 'bartender' ? 'bebida' : 'plato';
    return this.textos[this.currentLang].roles[roleKey];
  }

  altaProducto() {

    if (!this.todasLasFotosCargadas) {
      console.log('Faltan fotos por tomar');
      return;
    }

    console.log("fotos", this.fotosControl?.value);

    const sector = this.userData.tipoEmpleado === 'cocinero' ? 'cocina' : 'bar';

    if (this.formData.valid) {
      this.isLoading = true;

      const credential: any = {
        nombre: this.nombre?.value,
        descripcion: this.descripcion?.value,
        tiempoElaboracion: this.tiempoElaboracion?.value,
        precio: this.precio?.value,
        sector,
        fotoUno: this.fotoFiles[0]!,
        fotoDos: this.fotoFiles[1]!,
        fotoTres: this.fotoFiles[2]!
      };

      if (sector === 'cocina') {
        credential.tipo = this.formData.get('tipo')!.value;
      }

      this.productoService.createProducto(credential)
        .then(async () => {
          this.isLoading = false;
          await this.presentToast(this.textos[this.currentLang].toasts.creado, 'success');
          this.router.navigateByUrl('/homeempleados');
        })
        .catch(async (e) => {
          this.isLoading = false;
          await this.presentToast(this.textos[this.currentLang].toasts.errorGuardar, 'danger');
          console.error('Error guardando la mesa:', e);
          this.errorLogin = true;
          this.errorText = this.textos[this.currentLang].errores.guardar;
        });
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


  async capturarFotos() {
    try {
      for (let i = 0; i < 3; i++) {
        // Si ya tengo archivo en la posición i, lo salto
        if (this.fotoFiles[i]) continue;

        const photo = await Camera.getPhoto({
          quality: 80,
          source: CameraSource.Camera,
          resultType: CameraResultType.DataUrl,
        });

        if (!photo.dataUrl) continue;

        // 1) Guarda la preview para mostrar en el HTML
        this.fotoPreviews[i] = photo.dataUrl;

        // 2) Convertir DataURL → Blob → File
        const resp = await fetch(photo.dataUrl);
        const blob = await resp.blob();
        const fileName = `producto-${i + 1}-${Date.now()}.${photo.format}`;
        const file = new File([blob], fileName, { type: blob.type });

        // 3) Guarda el File en el array
        this.fotoFiles[i] = file;

        // 4) Actualiza el formulario (reemplaza todo el array)
        //    Podés usar FormArray o simplemente un campo 'fotos' con el array completo
        this.formData.patchValue({ fotos: this.fotoFiles.filter(f => f !== null) as File[] });
        this.fotosControl?.updateValueAndValidity();
      }

      // Si ya cargué las 3, marco el flag
      this.todasLasFotosCargadas = this.fotoFiles.every(f => f !== null);
    } catch (error) {
      console.error('Error al tomar las fotos:', error);
    }
  }

  tomarFoto() {
    this.capturarFotos();
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

  textos: any = {
    es: {
      header: 'Alta',
      subtitulo: 'Ingresá los datos del producto',
      roles: { plato: 'plato', bebida: 'bebida' },
      labels: {
        nombre: 'Nombre',
        descripcion: 'Descripción',
        tiempo: 'Tiempo de Elaboración',
        precio: 'Precio',
        tipo: 'Tipo',
        agregarFoto: 'Agregar Foto'
      },
      placeholders: {
        nombre: 'Nombre',
        descripcion: 'Descripción',
        tiempo: 'Tiempo de Elaboración',
        precio: 'Precio'
      },
      tipos: { comidas: 'comidas', postres: 'postres' },
      botones: {
        sacarFotos: 'Sacar Fotos',
        guardar: 'Guardar Producto'
      },
      altFoto: 'Foto',
      toasts: {
        creado: 'Producto creado',
        errorGuardar: 'Error guardando el producto',
        faltanFotos: 'Faltan fotos por tomar'
      },
      errores: {
        guardar: 'Hubo un error al guardar los datos del producto'
      }
    },
    en: {
      header: 'Add',
      subtitulo: 'Enter the product details',
      roles: { plato: 'dish', bebida: 'drink' },
      labels: {
        nombre: 'Name',
        descripcion: 'Description',
        tiempo: 'Preparation Time',
        precio: 'Price',
        tipo: 'Type',
        agregarFoto: 'Add Photo'
      },
      placeholders: {
        nombre: 'Name',
        descripcion: 'Description',
        tiempo: 'Preparation Time',
        precio: 'Price'
      },
      tipos: { comidas: 'meals', postres: 'desserts' },
      botones: {
        sacarFotos: 'Take Photos',
        guardar: 'Save Product'
      },
      altFoto: 'Photo',
      toasts: {
        creado: 'Product created',
        errorGuardar: 'Error saving the product',
        faltanFotos: 'Photos are missing'
      },
      errores: {
        guardar: 'There was an error saving the product data'
      }
    },
    pt: {
      header: 'Cadastro',
      subtitulo: 'Insira os dados do produto',
      roles: { plato: 'prato', bebida: 'bebida' },
      labels: {
        nombre: 'Nome',
        descripcion: 'Descrição',
        tiempo: 'Tempo de Preparo',
        precio: 'Preço',
        tipo: 'Tipo',
        agregarFoto: 'Adicionar Foto'
      },
      placeholders: {
        nombre: 'Nome',
        descripcion: 'Descrição',
        tiempo: 'Tempo de Preparo',
        precio: 'Preço'
      },
      tipos: { comidas: 'comidas', postres: 'sobremesas' },
      botones: {
        sacarFotos: 'Tirar Fotos',
        guardar: 'Salvar Produto'
      },
      altFoto: 'Foto',
      toasts: {
        creado: 'Produto criado',
        errorGuardar: 'Erro ao salvar o produto',
        faltanFotos: 'Faltam fotos'
      },
      errores: {
        guardar: 'Ocorreu um erro ao salvar os dados do produto'
      }
    },
    fr: {
      header: 'Création',
      subtitulo: 'Saisissez les informations du produit',
      roles: { plato: 'plat', bebida: 'boisson' },
      labels: {
        nombre: 'Nom',
        descripcion: 'Description',
        tiempo: 'Temps de Préparation',
        precio: 'Prix',
        tipo: 'Type',
        agregarFoto: 'Ajouter une photo'
      },
      placeholders: {
        nombre: 'Nom',
        descripcion: 'Description',
        tiempo: 'Temps de Préparation',
        precio: 'Prix'
      },
      tipos: { comidas: 'plats', postres: 'desserts' },
      botones: {
        sacarFotos: 'Prendre des photos',
        guardar: 'Enregistrer le produit'
      },
      altFoto: 'Photo',
      toasts: {
        creado: 'Produit créé',
        errorGuardar: 'Erreur lors de l’enregistrement du produit',
        faltanFotos: 'Des photos manquent'
      },
      errores: {
        guardar: 'Une erreur est survenue lors de l’enregistrement du produit'
      }
    },
    de: {
      header: 'Anlegen',
      subtitulo: 'Geben Sie die Produktdaten ein',
      roles: { plato: 'Gericht', bebida: 'Getränk' },
      labels: {
        nombre: 'Name',
        descripcion: 'Beschreibung',
        tiempo: 'Zubereitungszeit',
        precio: 'Preis',
        tipo: 'Typ',
        agregarFoto: 'Foto hinzufügen'
      },
      placeholders: {
        nombre: 'Name',
        descripcion: 'Beschreibung',
        tiempo: 'Zubereitungszeit',
        precio: 'Preis'
      },
      tipos: { comidas: 'Gerichte', postres: 'Desserts' },
      botones: {
        sacarFotos: 'Fotos aufnehmen',
        guardar: 'Produkt speichern'
      },
      altFoto: 'Foto',
      toasts: {
        creado: 'Produkt erstellt',
        errorGuardar: 'Fehler beim Speichern des Produkts',
        faltanFotos: 'Fotos fehlen'
      },
      errores: {
        guardar: 'Beim Speichern der Produktdaten ist ein Fehler aufgetreten'
      }
    },
    ru: {
      header: 'Добавить',
      subtitulo: 'Введите данные продукта',
      roles: { plato: 'блюдо', bebida: 'напиток' },
      labels: {
        nombre: 'Название',
        descripcion: 'Описание',
        tiempo: 'Время приготовления',
        precio: 'Цена',
        tipo: 'Тип',
        agregarFoto: 'Добавить фото'
      },
      placeholders: {
        nombre: 'Название',
        descripcion: 'Описание',
        tiempo: 'Время приготовления',
        precio: 'Цена'
      },
      tipos: { comidas: 'блюда', postres: 'десерты' },
      botones: {
        sacarFotos: 'Сделать фото',
        guardar: 'Сохранить продукт'
      },
      altFoto: 'Фото',
      toasts: {
        creado: 'Продукт создан',
        errorGuardar: 'Ошибка при сохранении продукта',
        faltanFotos: 'Не хватает фотографий'
      },
      errores: {
        guardar: 'Произошла ошибка при сохранении данных продукта'
      }
    },
    ja: {
      header: '追加',
      subtitulo: '商品の詳細を入力してください',
      roles: { plato: '料理', bebida: 'ドリンク' },
      labels: {
        nombre: '名前',
        descripcion: '説明',
        tiempo: '調理時間',
        precio: '価格',
        tipo: '種類',
        agregarFoto: '写真を追加'
      },
      placeholders: {
        nombre: '名前',
        descripcion: '説明',
        tiempo: '調理時間',
        precio: '価格'
      },
      tipos: { comidas: '料理', postres: 'デザート' },
      botones: {
        sacarFotos: '写真を撮る',
        guardar: '商品を保存'
      },
      altFoto: '写真',
      toasts: {
        creado: '商品を作成しました',
        errorGuardar: '商品の保存中にエラーが発生しました',
        faltanFotos: '写真が不足しています'
      },
      errores: {
        guardar: '商品のデータ保存中にエラーが発生しました'
      }
    }
  };



}
