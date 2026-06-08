import type { Appearance } from '@clerk/types';

// Light "Counter" appearance tuned to the Aurex palette so Clerk's widget feels
// native inside the auth shell: ink as the action color, white surfaces, graphite
// text, and money hues for danger/success.
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#16181d',
    colorBackground: '#ffffff',
    colorText: '#16181d',
    colorTextSecondary: '#3a414b',
    colorInputBackground: '#ffffff',
    colorInputText: '#16181d',
    colorNeutral: '#16181d',
    colorDanger: '#c0392b',
    colorSuccess: '#117a4b',
    colorWarning: '#b45309',
    borderRadius: '10px',
    fontFamily: 'var(--font-sans), system-ui, sans-serif',
    fontSize: '14px',
  },
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none border-0 bg-transparent p-0',
    cardBox: 'shadow-none border-0 bg-transparent w-full',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',
    developmentMode: 'hidden',
    footer:
      'bg-transparent text-[13px] text-[var(--aurex-text-3)] [&_a]:text-[var(--aurex-text-1)] [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-[var(--aurex-text-2)]',
    footerActionLink:
      'text-[var(--aurex-text-1)] underline underline-offset-2 hover:text-[var(--aurex-text-2)] font-medium',
    formButtonPrimary:
      'bg-[#16181d] hover:bg-[#2b2f36] text-white text-sm font-medium normal-case h-10 rounded-[10px] transition-colors',
    socialButtonsBlockButton:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] hover:bg-[var(--aurex-surface-hover)] text-[var(--aurex-text-1)] normal-case h-10 rounded-[10px]',
    socialButtonsBlockButtonText: 'text-[var(--aurex-text-1)] font-medium',
    formFieldInput:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] placeholder:text-[var(--aurex-text-3)] focus:border-[var(--aurex-ink)] focus:ring-1 focus:ring-[var(--aurex-ink)]/40 h-10 rounded-[10px]',
    formFieldLabel: 'text-[var(--aurex-text-2)] font-medium text-[13px]',
    formFieldInputShowPasswordButton:
      'text-[var(--aurex-text-3)] hover:text-[var(--aurex-text-1)]',
    formFieldErrorText: 'text-[#c0392b] text-[12.5px]',
    formFieldSuccessText: 'text-[var(--aurex-income)] text-[12.5px]',
    formFieldAction:
      'text-[var(--aurex-text-1)] underline underline-offset-2 hover:text-[var(--aurex-text-2)] font-medium',
    formResendCodeLink:
      'text-[var(--aurex-text-1)] underline underline-offset-2 hover:text-[var(--aurex-text-2)]',
    spinner: 'text-[var(--aurex-text-1)]',
    dividerLine: 'bg-[var(--aurex-border)]',
    dividerText: 'text-[var(--aurex-text-3)] text-[12px]',
    identityPreview:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] rounded-[10px]',
    identityPreviewText: 'text-[var(--aurex-text-1)]',
    identityPreviewEditButton:
      'text-[var(--aurex-text-1)] hover:text-[var(--aurex-text-2)]',
    otpCodeFieldInput:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] rounded-[10px]',
    alertText: 'text-[var(--aurex-text-2)]',
    alert:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] rounded-[10px]',
  },
};
