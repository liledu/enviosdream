import { defineMiddleware } from 'astro:middleware';
import { getSessionUserFromCookies } from './lib/auth';

function isProtectedPath(pathname: string) {
  return pathname === '/machote' || pathname === '/clientes';
}

export const onRequest = defineMiddleware(async (context, next) => {
  const user = await getSessionUserFromCookies(context.cookies);
  context.locals.user = user;

  if (isProtectedPath(context.url.pathname) && !user) {
    return context.redirect('/');
  }

  if (context.url.pathname === '/' && user) {
    return context.redirect('/machote');
  }

  return next();
});
