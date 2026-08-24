import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
  className?: string;
}

function FieldWrapper({ label, error, helperText, required, children, className = "" }: FieldWrapperProps) {
  const generatedId = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={generatedId} className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="ml-0.5 text-danger-600">*</span>}
        </label>
      )}
      {children(generatedId)}
      {error ? (
        <p className="text-xs font-medium text-danger-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
  startAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, required, className = "", wrapperClassName, id, startAdornment, ...rest },
  ref
) {
  return (
    <FieldWrapper label={label} error={error} helperText={helperText} required={required} className={wrapperClassName}>
      {(generatedId) => (
        <div className="relative">
          {startAdornment && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              {startAdornment}
            </span>
          )}
          <input
            ref={ref}
            id={id ?? generatedId}
            required={required}
            className={`${inputBase} ${startAdornment ? "pl-9" : ""} ${
              error ? "border-danger-400 focus:border-danger-500 focus:ring-danger-500/30" : "border-neutral-300"
            } ${className}`}
            {...rest}
          />
        </div>
      )}
    </FieldWrapper>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helperText, required, className = "", wrapperClassName, id, children, ...rest },
  ref
) {
  return (
    <FieldWrapper label={label} error={error} helperText={helperText} required={required} className={wrapperClassName}>
      {(generatedId) => (
        <select
          ref={ref}
          id={id ?? generatedId}
          required={required}
          className={`${inputBase} appearance-none bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px] pr-9 ${
            error ? "border-danger-400 focus:border-danger-500 focus:ring-danger-500/30" : "border-neutral-300"
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  );
});

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, className = "", id, ...rest },
  ref
) {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={resolvedId} className="flex cursor-pointer items-start gap-2.5 text-sm text-neutral-700">
        <input
          ref={ref}
          id={resolvedId}
          type="checkbox"
          className={`mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${className}`}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && <p className="ml-6 text-xs font-medium text-danger-600">{error}</p>}
    </div>
  );
});
