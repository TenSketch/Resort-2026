import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResortComponent } from './search-resort.component';

describe('SearchResortComponent', () => {
  let component: SearchResortComponent;
  let fixture: ComponentFixture<SearchResortComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SearchResortComponent]
    });
    fixture = TestBed.createComponent(SearchResortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
