import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResortOnlyComponent } from './search-resort-only.component';

describe('SearchResortOnlyComponent', () => {
  let component: SearchResortOnlyComponent;
  let fixture: ComponentFixture<SearchResortOnlyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SearchResortOnlyComponent]
    });
    fixture = TestBed.createComponent(SearchResortOnlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
