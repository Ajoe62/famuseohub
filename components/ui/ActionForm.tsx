"use client";

import { cloneElement, createContext, isValidElement, useContext, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/capstone/validation";
import { useToast } from "./Toaster";

type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

const FormContext = createContext<{ id: string; state: ActionResult | null; pending: boolean }>({ id: "form", state: null, pending: false });

/**
 * Wraps a server action with pending state, field errors and toasts.
 * Calls the action directly (not via the form `action` prop, which always resets
 * the form), so inputs are cleared only on success and a student keeps what
 * they typed when validation fails.
 */
export default function ActionForm({
  id,
  action,
  children,
  className = "space-y-3",
  resetOnSuccess = true,
}: {
  /** Unique on the page; prefixes field ids so each label targets its own input. */
  id: string;
  action: FormAction;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <FormContext.Provider value={{ id, state, pending }}>
      <form
        noValidate
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
          const data = new FormData(form, submitter);
          startTransition(async () => {
            const result = await action(state, data);
            // Toast from here, not from an effect: approving an item removes it (and this
            // form) from the page, and the confirmation must still appear.
            if (result.message) toast(result.message, result.ok ? "success" : "error");
            if (result.ok && resetOnSuccess) form.reset();
            setState(result);
          });
        }}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Touch devices get 16px text: iOS zooms the page when focusing a field with smaller text.
export const fieldClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs pointer-coarse:text-base focus:outline-none focus:ring-2 focus:ring-canvas-sidebar aria-[invalid=true]:border-red-500";

/** Label + control + server-side error message. The child control gets its id and ARIA wiring from here. */
export function FormField({
  label,
  name,
  hint,
  hideLabel = false,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  /** Keep the label for screen readers only, when the context already makes it obvious. */
  hideLabel?: boolean;
  children: React.ReactElement;
}) {
  const { id: formId, state } = useContext(FormContext);
  const id = `${formId}-${name}`;
  const error = state?.fieldErrors?.[name]?.[0];
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  const control = isValidElement<React.InputHTMLAttributes<HTMLElement>>(children)
    ? cloneElement(children, { id, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })
    : children;

  return (
    <div>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "block text-xs font-bold text-slate-700 mb-1"}>
        {label}
      </label>
      {control}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  className,
  name,
  value,
  pendingLabel = "Saving…",
}: {
  children: React.ReactNode;
  className: string;
  name?: string;
  value?: string;
  pendingLabel?: string;
}) {
  const { pending } = useContext(FormContext);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={`${className} disabled:opacity-60 disabled:cursor-wait`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
