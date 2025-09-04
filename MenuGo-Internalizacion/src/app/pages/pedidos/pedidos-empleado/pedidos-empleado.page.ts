import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { AuthService } from 'src/app/services/auth.service';
import { TareaService } from 'src/app/services/tarea.service';
import { ProductoService } from 'src/app/services/producto.service';
import { IonBadge, IonSegment } from "@ionic/angular/standalone";
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { logOut, checkmarkDoneCircleOutline, checkmarkOutline } from 'ionicons/icons';
import { PedidoService } from 'src/app/services/pedido.service';
import { ReservaService } from 'src/app/services/reserva.service';
import { MesaService } from 'src/app/services/mesa.service';
import { firstValueFrom, take } from 'rxjs';

import { forkJoin, of } from 'rxjs';
import { switchMap, finalize, catchError } from 'rxjs/operators';
import { MapaidiomaPage } from "../../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-pedidos-empleado',
  templateUrl: './pedidos-empleado.page.html',
  styleUrls: ['./pedidos-empleado.page.scss'],
  standalone: true,
  imports: [IonSegment, IonBadge, CommonModule, FormsModule, IMPORTS_IONIC, MapaidiomaPage]
})
export class PedidosEmpleadoPage implements OnInit {

  isLoading: boolean = false;
  userData: any;
  tasks: any[] = [];
  modalOpen = false;
  selectedTask: any | null = null;
  etaMinutes!: number;
  estadoSeleccionado: any = 'pendiente';
  tasksByMesa: Array<{ mesaNumero: number; tasks: any }> = [];
  checkIcon = checkmarkOutline;
  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);

  constructor(private authService: AuthService, private tareaService: TareaService,
    private productoService: ProductoService, private router: Router, private pedidoService: PedidoService,
    private reservaService: ReservaService, private mesaService: MesaService) {
    addIcons({ logOut, checkmarkDoneCircleOutline });
  }

  ngOnInit() {

    this.userData = this.authService.getUserData();
    if (!this.userData) {
      console.warn('No hay usuario logueado');
      return;
    }

    console.log("userData", this.userData);

    this.langService.language$.subscribe(lang => {
      this.currentLang = lang;
    });

    this.cargarTareas();
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  private cargarTareas() {

    this.isLoading = true;

    this.tareaService.getTasksBySector(this.userData.tipoEmpleado)
      .subscribe({
        next: async lista => {
          const tareasConDetalles = await Promise.all(lista.map(async tarea => {
            try {

              this.isLoading = true;
              const detalles = await this.productoService.fetchProductosByIds([tarea.idProducto]);

              const pedido = await firstValueFrom(
                this.pedidoService.getPedidoById(tarea.idPedido).pipe(take(1))
              );

              const reserva = await this.reservaService.getReservaPorId(pedido.reservaId);

              const mesa = await this.mesaService.getMesaPorId(reserva.mesaId);
              return {
                ...tarea,
                producto: detalles[0],
                pedido, reserva, mesa
              };

            } catch (e) {
              console.error(`Error trayendo producto ${tarea.idProducto}:`, e);
              return tarea;
            } finally {
              this.isLoading = false;
            }
          }));

          this.tasks = tareasConDetalles;

          console.log("tareas", this.tasks)

          this.groupTasksByMesa();
        },
        error: err => {
          console.error('Error cargando tareas:', err);
          this.isLoading = false;
        }
      });

  }

  private groupTasksByMesa() {
    const filtradas = this.tasks.filter(
      t =>
        t.estado === this.estadoSeleccionado &&
        t.mesa?.numero != null
    );

    const grupos: Record<number, any[]> = {};
    for (const t of filtradas) {
      const nro = t.mesa!.numero;
      if (!grupos[nro]) grupos[nro] = [];
      grupos[nro].push(t);
    }

    this.tasksByMesa = Object.entries(grupos)
      .map(([mesaNumero, tasks]) => ({
        mesaNumero: +mesaNumero,
        tasks
      }))
      .sort((a, b) => a.mesaNumero - b.mesaNumero);
  }

  // private groupTasksByMesa() {
  //   // 1) filtrar según estado seleccionado
  //   const filtradas = this.tasks.filter(t => t.estado === this.estadoSeleccionado);

  //   // 2) agrupar por mesa.numero
  //   const grupos: Record<number, any[]> = {};
  //   for (const t of filtradas) {
  //     const nro = t.mesa.numero;
  //     if (!grupos[nro]) grupos[nro] = [];
  //     grupos[nro].push(t);
  //   }

  //   // 3) asignar a la propiedad tasksByMesa
  //   this.tasksByMesa = Object.entries(grupos)
  //     .map(([mesaNumero, tasks]) => ({
  //       mesaNumero: +mesaNumero,
  //       tasks
  //     }))
  //     .sort((a, b) => a.mesaNumero - b.mesaNumero);
  // }



  async marcarListo(task: any) {

    this.isLoading = true;
    if (!task?.idTarea) {
      console.warn('Tarea inválida o sin ID');
      return;
    }


    try {
      await this.tareaService.marcarComoListo(task.idTarea, task.idPedido);
      console.log(`Tarea ${task.id} marcada como finalizada`);
    } catch (err) {
      console.error('Error al marcar la tarea como lista:', err);

    } finally {

      // this.isLoading = false;
    }
  }

  openEtaModal(task: Task) {
    this.selectedTask = task;

    console.log("selectedTask", this.selectedTask);
    this.etaMinutes = null!;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
  }

  tomarPedido(task: any) {
    this.isLoading = true;
    this.tareaService.takeTask(task.idTarea)
      .then(() => this.modalOpen = false)
    // .finally(() => this.isLoading = false);
  }

  tareasFiltradas() {
    return this.tasks.filter(p => p.estado === this.estadoSeleccionado);
  }

  onEstadoChange(event: any) {
    this.estadoSeleccionado = event.detail.value;
    console.log(this.estadoSeleccionado);
    this.groupTasksByMesa();
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
      header: 'Pedidos',
      subtitulo: (nombre: string) => `Hola, ${nombre}. Aquí están tus tareas pendientes:`,
      segmentos: {
        pendiente: 'Pendiente',
        enPrep: 'En preparación'
      },
      tarjeta: {
        mesa: 'Mesa',
        tarea: 'Tarea',
        producto: 'Producto',
        eta: 'ETA',
        estados: {
          pendiente: 'Pendiente',
          enPrep: 'En preparación'
        },
        tomar: 'Tomar pedido',
        listo: 'Marcar listo'
      },
      empty: {
        titulo: '¡Todo al día!',
        mensaje: 'No hay pedidos pendientes para tu sector.'
      },
      toasts: {
        tareaListo: 'Tarea marcada como lista',
        errorListo: 'Error al marcar la tarea',
        pedidoTomado: 'Pedido tomado',
        errorPedido: 'Error al tomar el pedido'
      }
    },
    en: {
      header: 'Orders',
      subtitulo: (name: string) => `Hello, ${name}. Here are your pending tasks:`,
      segmentos: {
        pendiente: 'Pending',
        enPrep: 'In preparation'
      },
      tarjeta: {
        mesa: 'Table',
        tarea: 'Task',
        producto: 'Product',
        eta: 'ETA',
        estados: {
          pendiente: 'Pending',
          enPrep: 'In preparation'
        },
        tomar: 'Take order',
        listo: 'Mark ready'
      },
      empty: {
        titulo: 'All set!',
        mensaje: 'There are no pending orders for your section.'
      },
      toasts: {
        tareaListo: 'Task marked as ready',
        errorListo: 'Error marking task',
        pedidoTomado: 'Order taken',
        errorPedido: 'Error taking order'
      }
    },
    pt: {
      header: 'Pedidos',
      subtitulo: (nome: string) => `Olá, ${nome}. Aqui estão suas tarefas pendentes:`,
      segmentos: {
        pendiente: 'Pendente',
        enPrep: 'Em preparo'
      },
      tarjeta: {
        mesa: 'Mesa',
        tarea: 'Tarefa',
        producto: 'Produto',
        eta: 'ETA',
        estados: {
          pendiente: 'Pendente',
          enPrep: 'Em preparo'
        },
        tomar: 'Aceitar pedido',
        listo: 'Marcar pronto'
      },
      empty: {
        titulo: 'Tudo em dia!',
        mensagem: 'Não há pedidos pendentes para seu setor.'
      },
      toasts: {
        tareaListo: 'Tarefa marcada como pronta',
        errorListo: 'Erro ao marcar tarefa',
        pedidoTomado: 'Pedido aceito',
        errorPedido: 'Erro ao aceitar pedido'
      }
    },
    fr: {
      header: 'Commandes',
      subtitulo: (nom: string) => `Bonjour, ${nom}. Voici vos tâches en attente :`,
      segmentos: {
        pendiente: 'En attente',
        enPrep: 'En préparation'
      },
      tarjeta: {
        mesa: 'Table',
        tarea: 'Tâche',
        producto: 'Produit',
        eta: 'ETA',
        estados: {
          pendiente: 'En attente',
          enPrep: 'En préparation'
        },
        tomar: 'Prendre commande',
        listo: 'Marquer prêt'
      },
      empty: {
        titulo: 'Tout est à jour !',
        mensaje: 'Aucune commande en attente pour votre section.'
      },
      toasts: {
        tareaListo: 'Tâche marquée comme prête',
        errorListo: 'Erreur lors du marquage de la tâche',
        pedidoTomado: 'Commande prise',
        errorPedido: 'Erreur lors de la prise de commande'
      }
    },
    de: {
      header: 'Bestellungen',
      subtitulo: (name: string) => `Hallo, ${name}. Hier sind deine offenen Aufgaben:`,
      segmentos: {
        pendiente: 'Ausstehend',
        enPrep: 'In Vorbereitung'
      },
      tarjeta: {
        mesa: 'Tisch',
        tarea: 'Aufgabe',
        producto: 'Produkt',
        eta: 'ETA',
        estados: {
          pendiente: 'Ausstehend',
          enPrep: 'In Vorbereitung'
        },
        tomar: 'Bestellung übernehmen',
        listo: 'Als fertig markieren'
      },
      empty: {
        titulo: 'Alles erledigt!',
        mensaje: 'Keine offenen Bestellungen in deinem Bereich.'
      },
      toasts: {
        tareaListo: 'Aufgabe als fertig markiert',
        errorListo: 'Fehler beim Markieren',
        pedidoTomado: 'Bestellung übernommen',
        errorPedido: 'Fehler beim Übernehmen'
      }
    },
    ru: {
      header: 'Заказы',
      subtitulo: (имя: string) => `Привет, ${имя}. Вот твои ожидающие задачи:`,
      segmentos: {
        pendiente: 'В ожидании',
        enPrep: 'Готовится'
      },
      tarjeta: {
        mesa: 'Стол',
        tarea: 'Задача',
        producto: 'Блюдо',
        eta: 'ETA',
        estados: {
          pendiente: 'В ожидании',
          enPrep: 'Готовится'
        },
        tomar: 'Принять заказ',
        listo: 'Отметить готовым'
      },
      empty: {
        titulo: 'Все готово!',
        mensaje: 'Нет ожидающих заказов в вашем секторе.'
      },
      toasts: {
        tareaListo: 'Задача отмечена как готовая',
        errorListo: 'Ошибка при отметке задачи',
        pedidoTomado: 'Заказ принят',
        errorPedido: 'Ошибка при принятии заказа'
      }
    },
    ja: {
      header: '注文',
      subtitulo: (name: string) => `こんにちは、${name}さん。こちらが保留中のタスクです：`,
      segmentos: {
        pendiente: '保留中',
        enPrep: '準備中'
      },
      tarjeta: {
        mesa: 'テーブル',
        tarea: 'タスク',
        producto: '品',
        eta: 'ETA',
        estados: {
          pendiente: '保留中',
          enPrep: '準備中'
        },
        tomar: '注文を受ける',
        listo: '準備完了にする'
      },
      empty: {
        titulo: 'すべて順調！',
        mensaje: 'このセクションに保留中の注文はありません。'
      },
      toasts: {
        tareaListo: 'タスクを準備完了にしました',
        errorListo: 'タスクの更新エラー',
        pedidoTomado: '注文を受けました',
        errorPedido: '注文の処理中にエラー'
      }
    }
  };

}
