import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsignarmesaPage } from './asignarmesa.page';

describe('AsignarmesaPage', () => {
  let component: AsignarmesaPage;
  let fixture: ComponentFixture<AsignarmesaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AsignarmesaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
