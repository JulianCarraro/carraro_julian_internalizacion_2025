import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'datos-anonimo',
    loadComponent: () => import('./pages/datos-anonimo/datos-anonimo.page').then( m => m.DatosAnonimoPage)
  },
  {
    path: 'local',
    loadComponent: () => import('./pages/local/local.page').then( m => m.LocalPage)
  },
  {
    path: 'altaproductos',
    loadComponent: () => import('./pages/productos/altaproductos/altaproductos.page').then( m => m.AltaproductosPage)
  },
  {
    path: 'altamesa',
    loadComponent: () => import('./pages/mesas/altamesa/altamesa.page').then( m => m.AltamesaPage)
  },
  {
    path: 'asignarmesa',
    loadComponent: () => import('./pages/mesas/asignarmesa/asignarmesa.page').then( m => m.AsignarmesaPage)
  },
  {
    path: 'mesaasignada',
    loadComponent: () => import('./pages/mesas/mesaasignada/mesaasignada.page').then( m => m.MesaasignadaPage)
  },
  {
    path: 'pedidos-empleado',
    loadComponent: () => import('./pages/pedidos/pedidos-empleado/pedidos-empleado.page').then( m => m.PedidosEmpleadoPage)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios.page').then( m => m.UsuariosPage)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios.page').then( m => m.UsuariosPage)
  },
  {
    path: 'panelmozo',
    loadComponent: () => import('./pages/panelmozo/panelmozo.page').then( m => m.PanelmozoPage)
  },
  {
    path: 'realizarpedido',
    loadComponent: () => import('./pages/pedidos/realizarpedido/realizarpedido.page').then( m => m.RealizarpedidoPage)
  },
  {
    path: 'estado-pedido',
    loadComponent: () => import('./pages/estado-pedido/estado-pedido.page').then( m => m.EstadoPedidoPage)
  },
  {
    path: 'mayor-menor',
    loadComponent: () => import('./pages/juegos/mayor-menor/mayor-menor.page').then( m => m.MayorMenorPage)
  },
  {
    path: 'quiz',
    loadComponent: () => import('./pages/juegos/quiz/quiz.page').then( m => m.QuizPage)
  },
  {
    path: 'menu-juegos',
    loadComponent: () => import('./pages/juegos/menu-juegos/menu-juegos.page').then( m => m.MenuJuegosPage)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
 },
 {
    path: 'realizarpago',
    loadComponent: () => import('./pages/realizarpago/realizarpago.page').then( m => m.RealizarpagoPage)
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat.page').then( m => m.ChatPage)
  },
  {
    path: 'encuesta',
    loadComponent: () => import('./pages/encuesta/encuesta.page').then( m => m.EncuestaPage)
  },
  {
    path: 'estadisticas',
    loadComponent: () => import('./pages/estadisticas/estadisticas.page').then( m => m.EstadisticasPage)
  },
  {
    path: 'reservas',
    loadComponent: () => import('./pages/reservas/reservas.page').then( m => m.ReservasPage)
  },
  {
    path: 'homeempleados',
    loadComponent: () => import('./pages/homeempleados/homeempleados.page').then( m => m.HomeempleadosPage)
  },
  {
    path: 'homeadmin',
    loadComponent: () => import('./pages/homeadmin/homeadmin.page').then( m => m.HomeadminPage)
  },
  {
    path: 'listareservas',
    loadComponent: () => import('./pages/listareservas/listareservas.page').then( m => m.ListareservasPage)
  },
  {
    path: 'mapaidioma',
    loadComponent: () => import('./pages/mapaidioma/mapaidioma.page').then( m => m.MapaidiomaPage)
  },




];
