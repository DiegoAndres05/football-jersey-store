"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

const FormItemContext = React.createContext<{ id: string } | null>(null);

function useFormItemId() {
  const ctx = React.useContext(FormItemContext);
  return ctx?.id;
}

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, id: idProp, ...props }, ref) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => {
    const id = useFormItemId();
    return (
      <Label
        ref={ref}
        htmlFor={id}
        className={cn(required && "after:content-['*'] after:text-destructive after:ml-0.5", className)}
        {...props}
      >
        {children}
      </Label>
    );
  },
);
FormLabel.displayName = "FormLabel";

interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ children, ...props }, ref) => {
    const id = useFormItemId();
    const child = React.Children.only(children) as React.ReactElement;

    const enhanced = React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<{ id?: string }>, { id })
      : child;

    return (
      <div ref={ref} {...props}>
        {enhanced}
      </div>
    );
  },
);
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
));
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs font-medium text-destructive", !children && "hidden", className)}
    {...props}
  >
    {children}
  </p>
));
FormMessage.displayName = "FormMessage";

export { FormItem, FormLabel, FormControl, FormDescription, FormMessage };
