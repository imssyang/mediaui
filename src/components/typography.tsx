import * as React from "react";

interface TypographyProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "h1" | "h2" | "h3" | "h4" | "p" | "small";
}

const baseStyles = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
  p: "leading-7 [&:not(:first-child)]:mt-6",
  small: "text-sm font-medium leading-none",
};

const Typography: React.FC<TypographyProps> = ({
  variant = "p",
  className,
  children,
  ...props
}) => {
  const Component = variant === "p" ? "p" : variant;
  return (
    <Component className={`${baseStyles[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export const TypographyH1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <Typography variant="h1" className={className} {...props}>
    {children}
  </Typography>
);

export const TypographyH2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <Typography variant="h2" className={className} {...props}>
    {children}
  </Typography>
);

export const TypographyH3: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
    className,
    children,
    ...props
}) => (
  <Typography variant="h3" className={className} {...props}>
    {children}
  </Typography>
);

export const TypographyH4: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
    className,
    children,
    ...props
}) => (
  <Typography variant="h4" className={className} {...props}>
    {children}
  </Typography>
);

export const TypographyP: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <Typography variant="p" className={className} {...props}>
    {children}
  </Typography>
);