import { Injectable, ApplicationRef, ComponentFactoryResolver, Injector, EmbeddedViewRef } from '@angular/core';
import { SnackbarComponent } from '../shared/snackbar.component';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private componentRef: any;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector
  ) {}

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
    }

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(SnackbarComponent);
    this.componentRef = componentFactory.create(this.injector);

    this.componentRef.instance.message = message;
    this.componentRef.instance.type = type;
    this.componentRef.instance.visible = true;

    this.appRef.attachView(this.componentRef.hostView);
    const domElem = (this.componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);

    setTimeout(() => {
      if (this.componentRef) {
        this.appRef.detachView(this.componentRef.hostView);
        this.componentRef.destroy();
        this.componentRef = null;
      }
    }, 3000);
  }
}
