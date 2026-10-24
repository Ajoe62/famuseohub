"use client";

// Placeholder submit handling until submissions are wired to a backend
// (e.g. Server Actions); the fields themselves are server-rendered children.
export default function AlertForm({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert(message);
      }}
      className="space-y-3"
    >
      {children}
    </form>
  );
}

export function AlertButton({
  message,
  className,
  children,
}: {
  message: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button onClick={() => alert(message)} className={className}>
      {children}
    </button>
  );
}
