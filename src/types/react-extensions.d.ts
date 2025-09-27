// Extend React HTML attributes to include webkitdirectory
declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extends React's HTMLAttributes
    webkitdirectory?: string;
    directory?: string;
  }
}

export {};