import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MesaasignadaPage } from './mesaasignada.page';

describe('MesaasignadaPage', () => {
  let component: MesaasignadaPage;
  let fixture: ComponentFixture<MesaasignadaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MesaasignadaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
