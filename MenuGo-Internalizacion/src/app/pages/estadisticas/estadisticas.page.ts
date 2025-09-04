import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonIcon, IonSpinner, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js';
import { AuthService } from 'src/app/services/auth.service';
import { firstValueFrom } from 'rxjs';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  LineController,
  LineElement,
  PointElement,
  PieController,
  PolarAreaController,
  RadialLinearScale
} from 'chart.js';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { statsChart, calendar, home } from 'ionicons/icons';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { IMPORTS_IONIC } from 'src/shared/imports-ionic';
import { ClienteService } from 'src/app/services/cliente.service';
import { Router } from '@angular/router';
import { MapaidiomaPage } from "../mapaidioma/mapaidioma.page";
import { LanguageService } from 'src/app/services/language.service';


// Registrar todos los componentes de Chart.js necesarios
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  LineController,
  LineElement,
  PointElement,
  PieController,
  PolarAreaController,
  RadialLinearScale
);

interface Survey {
  comments: string;
  date: any; // Timestamp o Date
  foodRating: number;
  foto: string;
  priceRating: number;
  serviceRating: number;
  userEmail: string;
  userId: string;
  userName: string;
}

@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.page.html',
  styleUrls: ['./estadisticas.page.scss'],
  standalone: true,
  imports: [CommonModule, IMPORTS_IONIC, FormsModule, BaseChartDirective, MapaidiomaPage]
})
export class EstadisticasPage implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  isLoading: boolean = true;
  private authSvc = inject(AuthService);
  private firestore: Firestore = inject(Firestore);
  allSurveys: Survey[] = [];

  currentLang: string = 'es';
  mapVisible = false;
  langService = inject(LanguageService);
  selectRerender = true;

  // Variables para gráficos
  // chartType: 'doughnut' | 'bar' | 'line' | 'pie' | 'polarArea' = 'doughnut';
  ratingType: 'food' | 'price' | 'service' = 'food';
  // chartData!: ChartData;
  // timelineData!: ChartData<'line'>;
  recentComments: Survey[] = [];

  // // Opciones de gráficos
  // chartOptions!: ChartOptions;
  // lineOptions!: ChartOptions<'line'>;
  chartType: ChartType = 'doughnut';
  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };
  chartOptions: ChartConfiguration['options'] = {};

  timelineData: ChartConfiguration['data'] = {
    labels: [],
    datasets: []
  };
  lineOptions: ChartConfiguration['options'] = {};
  private clienteService = inject(ClienteService)
  private router = inject(Router);
  private authService = inject(AuthService);
  private generateColorPalette(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#8AC926', '#1982C4', '#6A4C93', '#F15BB5'
    ];
    return colors.slice(0, count);
  }

  private localeMap: Record<string, string> = {
    es: 'es-ES', en: 'en-US', pt: 'pt-BR', fr: 'fr-FR',
    de: 'de-DE', ru: 'ru-RU', ja: 'ja-JP'
  };
  async ngOnInit() {
    this.isLoading = true;
    try {
      addIcons({ statsChart, calendar, home });
      await this.loadSurveyData();
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      this.isLoading = false;
      this.langService.language$.subscribe(lang => {
        this.currentLang = lang;
        this.selectRerender = false;
        setTimeout(() => this.selectRerender = true);
      });
    }
  }

  cambiarIdioma(lang: any) {
    this.langService.changeLanguage(lang);
  }

  async loadSurveyData() {
    this.isLoading = true;
    try {
      const surveysCollection = collection(this.firestore, 'encuestas');
      const snapshot = await getDocs(surveysCollection);
      const surveys: Survey[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as Survey;
        surveys.push({
          ...data,
          date: data.date.toDate ? data.date.toDate() : data.date
        });
      });

      // Guarda todas las encuestas en una propiedad
      this.allSurveys = surveys;

      // Ordenar por fecha (más reciente primero)
      surveys.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Tomar los 5 comentarios más recientes
      this.recentComments = surveys.slice(0, 5);

      // Preparar datos para gráficos
      this.prepareChartOptions();
      this.updateChartData();
    } catch (error) {
      console.error('Error cargando encuestas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  prepareChartOptions() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 20,
            boxHeight: 20,
            padding: 15,
            font: {
              size: 14,
              weight: 'normal'
            },
            color: '#4a5568',
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.9)',
          titleFont: { size: 14 },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8
        }
      },
      // Animación simplificada para Chart.js v8
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    };

    this.lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.9)',
          titleFont: { size: 14 },
          bodyFont: { size: 12 },
          padding: 12
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#718096' }
        },
        y: {
          min: 0,
          max: 5,
          grid: { color: '#e2e8f0' },
          ticks: {
            color: '#718096',
            stepSize: 1,
            callback: (value) => `${value}★`
          }
        }
      },
      elements: {
        line: {
          tension: 0.3
        },
        point: {
          radius: 5,
          hoverRadius: 7
        }
      }
    };
  }

  updateChartData(event?: any) {
    if (event == null || event == undefined) {
      this.ratingType = "food"
      this.chartType = "doughnut";
    }
    else {
      if (event.detail.value == "food" || event.detail.value == "price" || event.detail.value == "service") {
        this.ratingType = event.detail.value;
      } else {
        this.chartType = event.detail.value;
      }
    }

    if (!this.allSurveys || this.allSurveys.length === 0) return;


    // Actualizar gráfico de distribución
    this.updateMainChartData();

    // Actualizar gráfico de evolución temporal
    this.updateTimelineChartData();

    // Forzar actualización del gráfico
    setTimeout(() => {
      this.chart?.update();
    }, 100);
  }

  // updateChartData() {

  //   console.log(this.ratingType);
  //   console.log(!this.allSurveys);
  //   console.log(this.allSurveys.length);

  //   if (!this.allSurveys || this.allSurveys.length === 0) return;

  //   this.updateMainChartData();
  //   this.updateTimelineChartData();

  //   setTimeout(() => {
  //     this.chart?.update();
  //   }, 100);
  // }

  updateMainChartData() {
    const ratings = [1, 2, 3, 4, 5];
    const ratingKey = `${this.ratingType}Rating` as keyof Survey;

    const counts = ratings.map(rating =>
      this.allSurveys.filter(s => s[ratingKey] === rating).length
    );

    this.chartData = {
      labels: ratings.map(r => `${r} ${this.textos[this.currentLang].charts.starsSuffix}`),
      datasets: [{
        label: this.textos[this.currentLang].charts.ratingsOf.replace('{x}', this.getRatingLabel()),
        data: counts,
        backgroundColor: this.generateColorPalette(5),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 10
      }]
    };
  }

  updateTimelineChartData() {
    const groupedByDate: Record<string, { sum: number; count: number }> = {};
    const ratingKey = `${this.ratingType}Rating` as keyof Survey;

    this.allSurveys.forEach(survey => {
      const dateObj = survey.date.toDate ? survey.date.toDate() : new Date(survey.date);
      const dateStr = dateObj.toISOString().split('T')[0];

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { sum: 0, count: 0 };
      }

      groupedByDate[dateStr].sum += survey[ratingKey] as number;
      groupedByDate[dateStr].count++;
    });

    // Ordenar por fecha
    const sortedDates = Object.keys(groupedByDate).sort();
    const locale = this.localeMap[this.currentLang] || 'es-ES';

    const labels = sortedDates.map(date =>
      new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    );

    const data = sortedDates.map(date =>
      parseFloat((groupedByDate[date].sum / groupedByDate[date].count).toFixed(2))
    );

    this.timelineData = {
      labels: labels,
      datasets: [{
        label: this.textos[this.currentLang].charts.dailyAvgOf.replace('{x}', this.getRatingLabel()),
        data: data,
        fill: false,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#764ba2',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#764ba2'
      }]
    };
  }


  prepareTimelineData(surveys: Survey[]) {
    // Agrupar por fecha (solo día, sin hora)
    const groupedByDate: Record<string, { sum: number; count: number }> = {};

    surveys.forEach(survey => {
      const dateStr = survey.date.toISOString().split('T')[0];

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { sum: 0, count: 0 };
      }

      // Construimos la clave y la “cast-eamos” a keyof Survey
      const ratingKey = `${this.ratingType}Rating` as keyof Survey;

      // Ahora TS sabe que survey[ratingKey] es un número
      groupedByDate[dateStr].sum += survey[ratingKey] as number;
      groupedByDate[dateStr].count++;
    });

    // Finalmente, convertir groupedByDate en arrays ordenados, etc.
    return Object.entries(groupedByDate)
      .map(([date, { sum, count }]) => ({
        date,
        average: sum / count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getRatingLabel(): string {
    const r = this.textos[this.currentLang].selects.rating;
    switch (this.ratingType) {
      case 'food': return r.food;
      case 'price': return r.price;
      case 'service': return r.service;
      default: return '';
    }
  }

  formatDate(date: Date): string {
    const locale = this.localeMap[this.currentLang] || 'es-ES';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async back() {
    this.isLoading = true;
    const userData = await this.authService.getUserData();
    if (userData.estado == 'pago aprobado') {
      await this.clienteService.cambiarEstadoUsuario(userData.id, 'aprobado');
    }
    this.isLoading = false;
    this.router.navigate(["/local"]);
  }

  textos: any = {
    es: {
      header: "Resultados de Encuestas",
      selects: {
        ratingTypeLabel: "Tipo de calificación",
        chartTypeLabel: "Tipo de gráfico",
        rating: { food: "Comida", price: "Precio", service: "Servicio" },
        chart: {
          doughnut: "Torta", bar: "Barras", line: "Líneas",
          pie: "Pastel", polarArea: "Área Polar"
        }
      },
      charts: {
        distributionTitle: "Distribución de Calificaciones",
        timelineTitle: "Evolución Temporal",
        starsSuffix: "estrellas",
        ratingsOf: "Calificaciones de {x}",
        dailyAvgOf: "Promedio diario de {x}"
      },
      toasts: { loadError: "Error cargando encuestas." }
    },
    en: {
      header: "Survey Results",
      selects: {
        ratingTypeLabel: "Rating type",
        chartTypeLabel: "Chart type",
        rating: { food: "Food", price: "Price", service: "Service" },
        chart: {
          doughnut: "Doughnut", bar: "Bars", line: "Lines",
          pie: "Pie", polarArea: "Polar Area"
        }
      },
      charts: {
        distributionTitle: "Ratings Distribution",
        timelineTitle: "Timeline",
        starsSuffix: "stars",
        ratingsOf: "Ratings of {x}",
        dailyAvgOf: "Daily average of {x}"
      },
      toasts: { loadError: "Error loading surveys." }
    },
    pt: {
      header: "Resultados das Pesquisas",
      selects: {
        ratingTypeLabel: "Tipo de avaliação",
        chartTypeLabel: "Tipo de gráfico",
        rating: { food: "Comida", price: "Preço", service: "Serviço" },
        chart: {
          doughnut: "Rosquinha", bar: "Barras", line: "Linhas",
          pie: "Pizza", polarArea: "Área Polar"
        }
      },
      charts: {
        distributionTitle: "Distribuição das Avaliações",
        timelineTitle: "Evolução Temporal",
        starsSuffix: "estrelas",
        ratingsOf: "Avaliações de {x}",
        dailyAvgOf: "Média diária de {x}"
      },
      toasts: { loadError: "Erro ao carregar pesquisas." }
    },
    fr: {
      header: "Résultats des Enquêtes",
      selects: {
        ratingTypeLabel: "Type d’évaluation",
        chartTypeLabel: "Type de graphique",
        rating: { food: "Nourriture", price: "Prix", service: "Service" },
        chart: {
          doughnut: "Beignet", bar: "Barres", line: "Lignes",
          pie: "Camembert", polarArea: "Aire polaire"
        }
      },
      charts: {
        distributionTitle: "Répartition des Évaluations",
        timelineTitle: "Évolution Temporelle",
        starsSuffix: "étoiles",
        ratingsOf: "Évaluations de {x}",
        dailyAvgOf: "Moyenne quotidienne de {x}"
      },
      toasts: { loadError: "Erreur lors du chargement des enquêtes." }
    },
    de: {
      header: "Umfrageergebnisse",
      selects: {
        ratingTypeLabel: "Bewertungstyp",
        chartTypeLabel: "Diagrammtyp",
        rating: { food: "Essen", price: "Preis", service: "Service" },
        chart: {
          doughnut: "Donut", bar: "Balken", line: "Linien",
          pie: "Torte", polarArea: "Polarbereich"
        }
      },
      charts: {
        distributionTitle: "Verteilung der Bewertungen",
        timelineTitle: "Zeitlicher Verlauf",
        starsSuffix: "Sterne",
        ratingsOf: "Bewertungen von {x}",
        dailyAvgOf: "Tagesdurchschnitt von {x}"
      },
      toasts: { loadError: "Fehler beim Laden der Umfragen." }
    },
    ru: {
      header: "Результаты опросов",
      selects: {
        ratingTypeLabel: "Тип оценки",
        chartTypeLabel: "Тип диаграммы",
        rating: { food: "Еда", price: "Цена", service: "Сервис" },
        chart: {
          doughnut: "Кольцевая", bar: "Столбцы", line: "Линии",
          pie: "Круговая", polarArea: "Полярная область"
        }
      },
      charts: {
        distributionTitle: "Распределение оценок",
        timelineTitle: "Динамика",
        starsSuffix: "звезды",
        ratingsOf: "Оценки: {x}",
        dailyAvgOf: "Среднее за день: {x}"
      },
      toasts: { loadError: "Ошибка загрузки опросов." }
    },
    ja: {
      header: "アンケート結果",
      selects: {
        ratingTypeLabel: "評価タイプ",
        chartTypeLabel: "グラフ種類",
        rating: { food: "料理", price: "価格", service: "サービス" },
        chart: {
          doughnut: "ドーナツ", bar: "棒", line: "折れ線",
          pie: "円", polarArea: "ポーラーエリア"
        }
      },
      charts: {
        distributionTitle: "評価の分布",
        timelineTitle: "タイムライン",
        starsSuffix: "星",
        ratingsOf: "{x} の評価",
        dailyAvgOf: "{x} の日次平均"
      },
      toasts: { loadError: "アンケートの読み込みエラー。" }
    }
  };
}