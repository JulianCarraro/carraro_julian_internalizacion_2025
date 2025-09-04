import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-mesaasignada',
  templateUrl: './mesaasignada.page.html',
  styleUrls: ['./mesaasignada.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class MesaasignadaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
