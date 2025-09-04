import { AfterViewInit, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';

@Component({
  selector: 'app-mapaidioma',
  templateUrl: './mapaidioma.page.html',
  styleUrls: ['./mapaidioma.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IMPORTS_IONIC]
})
export class MapaidiomaPage implements AfterViewInit {
  @Output() idiomaSeleccionado = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();

  private map: any;

  ngAfterViewInit(): void {
    this.map = L.map('mapid').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      const lang = this.definirIdioma(lat, lng);
      this.idiomaSeleccionado.emit(lang);
      this.cerrar.emit();
    });
  }

  private definirIdioma(lat: number, lng: number): string {
    console.log("lat:", lat, "lng", lng);
    if ((lat >= -26.75 && lat <= 1.27 && lng >= -57 && lng <= -35) ||
      (lat >= -17 && lat <= -7 && lng >= 13 && lng <= 22)) {
      return 'pt';
    }
    else if (lat > -60 && lat < 28 && lng > -105 && lng < -30) {
      return 'es';
    }
    else if (lat >= 50.3 && lat <= 53.09 && lng >= 5.14 && lng <= 14.6) {
      return 'de';
    }
    else if (lat >= 43.3 && lat <= 50.09 && lng >= -2.14 && lng <= 6.6) {
      return 'fr';
    }
    else if ((lat >= 30 && lat <= 60 && lng >= -130 && lng <= -60) ||
      (lat >= 5 && lat <= 13 && lng >= 3 && lng <= 12.5) ||
      (lat >= -38 && lat <= -15 && lng >= 114 && lng <= 153) ||
      (lat >= -46 && lat <= -34 && lng >= 167 && lng <= 178) ) {
      return 'en';
    }
    else if (lat >= 40 && lat <= 70 && lng >= 30 && lng <= 167) {
      return 'ru';
    }
    else if (lat >= 34 && lat <= 40 && lng >= 133 && lng <= 140) {
      return 'ja';
    }
    else {
      return 'es';
    }
  }
}
