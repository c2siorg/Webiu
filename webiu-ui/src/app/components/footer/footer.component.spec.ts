import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        FooterComponent
      ],
    }).compileComponents();
    
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render Quick Links section', () => {
    const quickLinks = fixture.debugElement.query(By.css('.footer-section h4')).nativeElement;
    expect(quickLinks.textContent).toContain('Quick Links');
  });

  it('should have navigation links', () => {
    const links = fixture.debugElement.queryAll(By.css('.footer-section ul li a'));
    expect(links.length).toBeGreaterThan(0);

    const firstLink = links[0].nativeElement as HTMLAnchorElement;
    expect(firstLink.textContent).toContain('Home');
  });

 it('should have correct routerLinks on navigation links', () => {
  fixture.detectChanges();  
  const routerLinks = fixture.debugElement.queryAll(By.css('a[routerLink]'));
   expect(routerLinks.length).toBeGreaterThan(0);
   const expectedLinks = [
    '/',           
    '/projects',   
    '/publications',
    '/contributors', 
    '/community',   
    '/gsoc',        
    '/terms',       
    '/privacy'      
  ];
   routerLinks.forEach((link, index) => {
    expect(link.nativeElement.getAttribute('routerLink')).toBe(expectedLinks[index]);
  });
});

  it('should display current year in copyright', () => {
    const footerBottom = fixture.debugElement.query(By.css('.footer-bottom p')).nativeElement;
    const currentYear = new Date().getFullYear();
    expect(footerBottom.textContent).toContain(`© ${currentYear}`);
  });

  it('should have Terms of Service and Privacy Policy links', () => {
    const links = fixture.debugElement.queryAll(By.css('.footer-bottom a'));
    const termsLink = links.find(link => link.nativeElement.textContent === 'Terms of Service');
    const privacyLink = links.find(link => link.nativeElement.textContent === 'Privacy Policy');

    expect(termsLink).toBeTruthy();
    expect(privacyLink).toBeTruthy();
  });

  it('should not have empty footer-bottom section', () => {
    const footerBottom = fixture.debugElement.query(By.css('.footer-bottom'));
    expect(footerBottom.nativeElement.textContent.trim()).not.toBe('');
  });

  it('should have social media links', () => {
    const socialLinks = fixture.debugElement.queryAll(By.css('.social-links a'));
    expect(socialLinks.length).toBeGreaterThan(0);

    const firstSocialLink = socialLinks[0].nativeElement as HTMLAnchorElement;
    expect(firstSocialLink.href).toContain('https');
  });

  it('should have correct social media links', () => {
    const socialLinks = fixture.debugElement.queryAll(By.css('.social-links a'));
    socialLinks.forEach(link => {
      expect(link.nativeElement.href).toContain('http');
    });
  });

  it('should have footer class applied', () => {
    const footer = fixture.debugElement.query(By.css('.footer'));
    expect(footer).toBeTruthy();
  });

  it('should render footer in mobile view correctly', fakeAsync(() => {
    window.innerWidth = 500; 
    fixture.detectChanges(); 
    tick(); 

    const footerContainer = fixture.debugElement.query(By.css('.footer-container'));
    expect(footerContainer.nativeElement.style.flexDirection).toBe('column'); 
  }));
});
