import React, { useId } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-ink/80 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={fieldId}
          ref={ref}
          aria-invalid={!!error}
          className={`w-full resize-none bg-surface border border-line rounded-lg px-4 py-2.5 text-ink text-sm placeholder-ink-muted/60 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 focus:bg-card transition-all ${
            error ? "border-red-400 focus:border-red-400" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
