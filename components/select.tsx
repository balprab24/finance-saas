'use client';

import { useMemo } from 'react';
import { SingleValue, StylesConfig, GroupBase } from 'react-select';
import CreatableSelect from 'react-select/creatable';

type Option = { label: string; value: string };

type Props = {
  onChange: (value?: string) => void;
  onCreate?: (value: string) => void;
  options?: Option[];
  value?: string | null | undefined;
  disabled?: boolean;
  placeholder?: string;
};

// Centralized dark-theme styles. react-select renders its own DOM and ignores
// Tailwind class targets reliably across versions, so we set explicit styles
// against the Aurex CSS variables via inline values.
const styles: StylesConfig<Option, false, GroupBase<Option>> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: state.isFocused ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
    boxShadow: state.isFocused ? '0 0 0 1px rgba(99, 102, 241, 0.4)' : 'none',
    ':hover': {
      borderColor: state.isFocused ? '#6366f1' : 'rgba(255, 255, 255, 0.16)',
    },
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '2px 10px',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#5a5d6e',
    fontSize: 14,
  }),
  singleValue: (base) => ({
    ...base,
    color: '#eef0f6',
    fontSize: 14,
  }),
  input: (base) => ({
    ...base,
    color: '#eef0f6',
    fontSize: 14,
    margin: 0,
    padding: 0,
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? '#b4b8c4' : '#7d8090',
    ':hover': { color: '#b4b8c4' },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: '#7d8090',
    ':hover': { color: '#fb7185' },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#14161e',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    marginTop: 4,
    zIndex: 60,
  }),
  menuList: (base) => ({
    ...base,
    padding: 4,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'rgba(99, 102, 241, 0.18)'
      : state.isFocused
        ? 'rgba(255, 255, 255, 0.05)'
        : 'transparent',
    color: state.isSelected ? '#eef0f6' : '#b4b8c4',
    cursor: 'pointer',
    fontSize: 14,
    padding: '8px 10px',
    borderRadius: 6,
    ':active': { backgroundColor: 'rgba(99, 102, 241, 0.22)' },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: '#7d8090',
    fontSize: 13,
  }),
  loadingMessage: (base) => ({
    ...base,
    color: '#7d8090',
    fontSize: 13,
  }),
};

export function Select({ value, onChange, onCreate, options = [], disabled, placeholder }: Props) {
  const onSelect = (option: SingleValue<Option>) => onChange(option?.value);
  const formattedValue = useMemo(() => options.find((o) => o.value === value), [options, value]);

  return (
    <CreatableSelect
      placeholder={placeholder}
      styles={styles}
      value={formattedValue ?? null}
      onChange={onSelect}
      options={options}
      onCreateOption={onCreate}
      isDisabled={disabled}
      isClearable
      formatCreateLabel={(input) => `Create "${input}"`}
      noOptionsMessage={() => 'No matches — type to create'}
    />
  );
}
