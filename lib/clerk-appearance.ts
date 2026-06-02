import type { Appearance } from '@clerk/types';

// Dark theme appearance tuned to the Aurex palette so Clerk's widget feels
// native inside the auth shell instead of dropping in a white modal.
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#6366f1',
    colorBackground: '#12141c',
    colorText: '#eef0f6',
    colorTextSecondary: '#b4b8c4',
    colorInputBackground: 'rgba(255, 255, 255, 0.04)',
    colorInputText: '#eef0f6',
    colorNeutral: '#eef0f6',
    colorDanger: '#fb7185',
    colorSuccess: '#34d399',
    colorWarning: '#fbbf24',
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
      'bg-transparent text-[13px] text-[var(--aurex-text-3)] [&_a]:text-[var(--aurex-brand-text)] [&_a:hover]:text-[#c4cbff]',
    footerActionLink:
      'text-[var(--aurex-brand-text)] hover:text-[#c4cbff] font-medium',
    formButtonPrimary:
      'bg-[#6366f1] hover:bg-[#7a7df7] text-white text-sm font-medium normal-case h-10 rounded-[10px] transition-colors',
    socialButtonsBlockButton:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] hover:bg-[var(--aurex-surface-hover)] text-[var(--aurex-text-1)] normal-case h-10 rounded-[10px]',
    socialButtonsBlockButtonText: 'text-[var(--aurex-text-1)] font-medium',
    formFieldInput:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] placeholder:text-[var(--aurex-text-4)] focus:border-[var(--aurex-brand)] focus:ring-1 focus:ring-[var(--aurex-brand)]/40 h-10 rounded-[10px]',
    formFieldLabel: 'text-[var(--aurex-text-2)] font-medium text-[13px]',
    formFieldInputShowPasswordButton:
      'text-[var(--aurex-text-3)] hover:text-[var(--aurex-text-1)]',
    formFieldErrorText: 'text-[#fb7185] text-[12.5px]',
    formFieldSuccessText: 'text-[var(--aurex-income)] text-[12.5px]',
    formFieldAction:
      'text-[var(--aurex-brand-text)] hover:text-[#c4cbff] font-medium',
    formResendCodeLink:
      'text-[var(--aurex-brand-text)] hover:text-[#c4cbff]',
    spinner: 'text-[var(--aurex-brand-text)]',
    dividerLine: 'bg-[var(--aurex-border)]',
    dividerText: 'text-[var(--aurex-text-3)] text-[12px]',
    identityPreview:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] rounded-[10px]',
    identityPreviewText: 'text-[var(--aurex-text-1)]',
    identityPreviewEditButton:
      'text-[var(--aurex-brand-text)] hover:text-[#c4cbff]',
    otpCodeFieldInput:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] text-[var(--aurex-text-1)] rounded-[10px]',
    alertText: 'text-[var(--aurex-text-2)]',
    alert:
      'border-[var(--aurex-border)] bg-[var(--aurex-surface)] rounded-[10px]',
  },
};
