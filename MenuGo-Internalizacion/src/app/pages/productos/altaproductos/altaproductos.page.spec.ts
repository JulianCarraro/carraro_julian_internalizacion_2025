import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AltaproductosPage } from './altaproductos.page';

describe('AltaproductosPage', () => {
  let component: AltaproductosPage;
  let fixture: ComponentFixture<AltaproductosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AltaproductosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
