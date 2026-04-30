import type { Appearance } from '@clerk/types';

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#2563eb',
    borderRadius: '0.625rem',
    fontFamily: 'var(--font-geist-sans)',
  },
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none border-0 bg-transparent p-0',
    cardBox: 'shadow-none border-0 bg-transparent w-full',
    header: 'hidden',
    footer: 'bg-transparent',
    formButtonPrimary:
      'bg-blue-600 hover:bg-blue-700 text-sm font-medium normal-case shadow-none',
    socialButtonsBlockButton:
      'border-slate-200 hover:bg-slate-50 text-slate-700 normal-case',
    formFieldInput: 'border-slate-200 focus:border-blue-500 focus:ring-blue-500',
    formFieldLabel: 'text-slate-700 font-medium',
    dividerLine: 'bg-slate-200',
    dividerText: 'text-slate-400',
    footerActionLink: 'text-blue-600 hover:text-blue-700',
    identityPreviewEditButton: 'text-blue-600 hover:text-blue-700',
  },
};
