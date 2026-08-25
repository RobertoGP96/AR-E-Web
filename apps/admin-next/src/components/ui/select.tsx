'use client';

import type { OptionHTMLAttributes, ReactNode } from 'react';
import { Children, isValidElement, useContext, useState } from 'react';
import { cn, ListBox, Select as HeroUISelect } from '@heroui/react';

import { FieldLabelContext } from './form';

/**
 * Select of the design system (HeroUI Select: styled trigger + listbox
 * dropdown with animations and typeahead). It keeps the native-select
 * contract so call sites read like a <select>:
 *
 *   - accepts <option value>label</option> children (arrays, fragments
 *     and conditionals included),
 *   - `name` submits the plain option value with FormData via a hidden
 *     input (server actions unchanged),
 *   - `onChange` receives `{ target: { value } }`,
 *   - with no value/defaultValue it auto-selects the first option,
 *     matching native <select> submission semantics.
 *
 * The accessible name comes from `aria-label` or, when rendered inside
 * `Field`, from the field label via context.
 */

// RAC selection treats '' ambiguously, so empty option values ride
// under a sentinel key and are mapped back everywhere they surface.
const EMPTY_KEY = '__empty__';

type ParsedOption = {
  key: string;
  value: string;
  label: ReactNode;
  text: string;
  disabled?: boolean;
};

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return '';
}

function collectOptions(children: ReactNode, out: ParsedOption[]): ParsedOption[] {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.type === 'option') {
      const props = child.props as OptionHTMLAttributes<HTMLOptionElement>;
      const label = props.children as ReactNode;
      const value = props.value != null ? String(props.value) : textOf(label);
      out.push({
        key: value === '' ? EMPTY_KEY : value,
        value,
        label,
        text: textOf(label) || value,
        disabled: props.disabled,
      });
    } else {
      collectOptions((child.props as { children?: ReactNode }).children, out);
    }
  }
  return out;
}

export function Select({
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  invalid,
  required,
  placeholder,
  className,
  triggerClassName,
  children,
  'aria-label': ariaLabel,
}: {
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: { target: { value: string } }) => void;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  children: ReactNode;
  'aria-label'?: string;
}) {
  const fieldLabel = useContext(FieldLabelContext);
  const options = collectOptions(children, []);

  const [internal, setInternal] = useState<string>(() => {
    if (defaultValue != null) return String(defaultValue);
    if (value != null) return String(value);
    return options[0]?.value ?? '';
  });
  const current = value != null ? String(value) : internal;
  const hasCurrent = options.some((option) => option.value === current);

  return (
    <>
      <HeroUISelect
        aria-label={ariaLabel ?? fieldLabel}
        selectedKey={hasCurrent ? (current === '' ? EMPTY_KEY : current) : null}
        onSelectionChange={(key) => {
          const next = key == null || key === EMPTY_KEY ? '' : String(key);
          setInternal(next);
          onChange?.({ target: { value: next } });
        }}
        placeholder={placeholder}
        isDisabled={disabled}
        isInvalid={invalid}
        fullWidth
        className={className}
      >
        <HeroUISelect.Trigger className={cn('w-full', triggerClassName)}>
          <HeroUISelect.Value />
          <HeroUISelect.Indicator />
        </HeroUISelect.Trigger>
        <HeroUISelect.Popover>
          <ListBox>
            {options.map((option) => (
              <ListBox.Item
                key={option.key}
                id={option.key}
                textValue={option.text}
                isDisabled={option.disabled}
              >
                {option.label}
              </ListBox.Item>
            ))}
          </ListBox>
        </HeroUISelect.Popover>
      </HeroUISelect>
      {name ? (
        // In-flow but invisible so the value submits with FormData AND
        // `required` still blocks submit via native constraint
        // validation (a type="hidden" input would skip both the
        // validation and the browser bubble).
        <input
          type="text"
          name={name}
          value={current}
          required={required}
          disabled={disabled}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none block h-0 w-0 self-start border-0 p-0 opacity-0"
        />
      ) : null}
    </>
  );
}
