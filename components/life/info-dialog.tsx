"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

export function InfoDialog({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  function open() {
    const dialog = ref.current
    if (!dialog) return
    dialog.showModal()
    // showModal focuses the first link or button, which scrolls a long dialog past its heading.
    dialog.focus()
    dialog.scrollTop = 0
  }

  return (
    <>
      <button type="button" className="about-btn" onClick={open}>
        {label}
      </button>
      <dialog
        ref={ref}
        tabIndex={-1}
        className={wide ? "wide" : undefined}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close()
        }}
      >
        <div className="about-body">{children}</div>
      </dialog>
    </>
  )
}

export function CloseDialogButton() {
  return (
    <button type="button" className="run-btn small" onClick={(e) => e.currentTarget.closest("dialog")?.close()}>
      Got it
    </button>
  )
}

export function CodeBlock({ children }: { children: string }) {
  const [label, setLabel] = useState("Copy")

  useEffect(() => {
    if (label === "Copy") return
    const timer = setTimeout(() => setLabel("Copy"), 1500)
    return () => clearTimeout(timer)
  }, [label])

  return (
    <pre>
      <code>{children}</code>
      <button
        type="button"
        className="copy-btn"
        onClick={() =>
          navigator.clipboard.writeText(children).then(
            () => setLabel("Copied"),
            () => setLabel("Copy failed"),
          )
        }
      >
        {label}
      </button>
    </pre>
  )
}
