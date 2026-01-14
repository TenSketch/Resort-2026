import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VanavihariMaredumilliComponent } from './vanavihari-maredumilli.component';

describe('VanavihariMaredumilliComponent', () => {
  let component: VanavihariMaredumilliComponent;
  let fixture: ComponentFixture<VanavihariMaredumilliComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VanavihariMaredumilliComponent]
    });
    fixture = TestBed.createComponent(VanavihariMaredumilliComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
