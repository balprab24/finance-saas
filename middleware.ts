import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth) => {
  await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard(.*)',
    '/accounts(.*)',
    '/categories(.*)',
    '/transactions(.*)',
  ],
};
