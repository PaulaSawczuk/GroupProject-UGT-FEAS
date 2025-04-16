import {
    animate,
    style,
    transition,
    trigger,
    query,
    group,
  } from '@angular/animations';
  
  export const slideUpAnimation = trigger('routeAnimations', [
    transition('LandingPage => GuidePage', [
      query(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('3000ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ], { optional: true })
    ])
  ]);
  