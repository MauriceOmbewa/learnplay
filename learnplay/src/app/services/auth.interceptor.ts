import { HttpInterceptorFn } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';

const sanitize = (value: string): string => String(value).replace(/[\r\n]/g, ' ');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔵 [INTERCEPTOR] Request to:', sanitize(req.url));
  console.log('🔵 [INTERCEPTOR] Method:', sanitize(req.method));

  // Auth uses HttpOnly cookies — attach credentials on every request
  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    tap((event: any) => {
      if (event.type === 4) {
        console.log('🟢 [INTERCEPTOR] Response from:', sanitize(req.url), 'Status:', sanitize(String(event.status)));
      }
    }),
    catchError((error) => {
      console.error('🔴 [INTERCEPTOR] Error from:', sanitize(req.url), error);
      throw error;
    })
  );
};
