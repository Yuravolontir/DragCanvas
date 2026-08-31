import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

/**
 * The editor's one dialog.
 *
 * `alert()`, `confirm()` and `prompt()` block the whole tab, cannot be styled,
 * say "localhost:5173 says" above the message and — on the drawer layouts — are
 * drawn by the phone rather than by the page. Every editor flow that used to
 * reach for one uses this instead, so a confirmation, an error and a piece of
 * information all look like the same product.
 *
 * Promise-based on purpose: a call site reads almost exactly as the native call
 * it replaces, which is what makes migrating a flow a one-line change.
 *
 *     const { dialogs, confirm } = useDialogs();
 *     if (!(await confirm({ title: 'Delete this page?' }))) return;
 *     return <>…{dialogs}</>;
 */

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(15 23 42 / 0.45);
  backdrop-filter: blur(3px);
  animation: dc-dialog-fade 120ms ease-out;
  @keyframes dc-dialog-fade {
    from {
      opacity: 0;
    }
  }
`;

const Card = styled.div`
  width: min(440px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 24px;
  border-radius: 18px;
  background: #fff;
  color: #1b2333;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  box-shadow: 0 24px 60px -12px rgb(15 23 42 / 0.4);
  animation: dc-dialog-rise 160ms cubic-bezier(0.2, 0.9, 0.3, 1);
  @keyframes dc-dialog-rise {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }
  }
`;

const Chip = styled.span`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 14px;
  border-radius: 12px;
  background: ${(p) => p.$tint};
  color: ${(p) => p.$ink};
  .material-symbols-outlined {
    font-size: 22px;
  }
`;

const Title = styled.h2`
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
`;

const Message = styled.div`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: #4a5568;
  /* Messages are assembled with \n — a list of publish blockers, for one. */
  white-space: pre-wrap;
  word-break: break-word;
`;

const Field = styled.input`
  width: 100%;
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px solid #cbd3e1;
  border-radius: 10px;
  font: inherit;
  font-size: 14px;
  &:focus-visible {
    outline: none;
    border-color: #0060ac;
    box-shadow: 0 0 0 3px rgb(0 96 172 / 0.15);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
`;

const Action = styled.button`
  padding: 9px 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease, background 0.15s ease;
  ${(p) =>
    p.$variant === 'ghost'
      ? `background: #fff; border-color: #cbd3e1; color: #3f4a5f;
         &:hover { background: #f2f5fa; }`
      : `background: ${p.$accent}; color: #fff;
         &:hover { filter: brightness(1.07); }`}
  &:focus-visible {
    outline: 2px solid #0060ac;
    outline-offset: 2px;
  }
`;

/** How each kind of message is drawn. One place, so they cannot drift apart. */
const TONES = {
  info: { icon: 'info', tint: '#e6f0fb', ink: '#0060ac', accent: '#0060ac' },
  success: { icon: 'check_circle', tint: '#e6f6ec', ink: '#1e7a44', accent: '#1e7a44' },
  error: { icon: 'error', tint: '#fdeaea', ink: '#b42318', accent: '#b42318' },
  warning: { icon: 'warning', tint: '#fdf3e2', ink: '#a15c07', accent: '#a15c07' },
  danger: { icon: 'delete', tint: '#fdeaea', ink: '#b42318', accent: '#b42318' },
  question: { icon: 'help', tint: '#e6f0fb', ink: '#0060ac', accent: '#0060ac' },
};

export const Dialog = ({
  open,
  tone = 'info',
  title,
  message,
  input,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
}) => {
  // Seeded once: useDialogs gives every request its own key, so a second
  // prompt arrives as a fresh component rather than one holding the first
  // answer.
  const [value, setValue] = useState(input?.value ?? '');
  const fieldRef = useRef(null);
  const confirmRef = useRef(null);

  // Focus goes into the dialog so Enter and Escape mean something without a
  // click first, the way the native dialogs behaved.
  useEffect(() => {
    if (!open) return;
    const target = input ? fieldRef.current : confirmRef.current;
    target?.focus();
    if (input) target?.select();
  }, [open, input]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  const look = TONES[tone] || TONES.info;
  const submit = () => onConfirm?.(input ? value : true);

  return createPortal(
    <Backdrop
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <Card
        role="alertdialog"
        aria-modal="true"
        aria-label={title || 'Message'}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Chip $tint={look.tint} $ink={look.ink} aria-hidden="true">
          <span className="material-symbols-outlined">{look.icon}</span>
        </Chip>
        {title ? <Title>{title}</Title> : null}
        {message ? <Message>{message}</Message> : null}
        {input ? (
          <Field
            ref={fieldRef}
            value={value}
            placeholder={input.placeholder || ''}
            aria-label={input.label || title || 'Value'}
            maxLength={input.maxLength || 200}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        ) : null}
        <Actions>
          {cancelText ? (
            <Action type="button" $variant="ghost" onClick={() => onCancel?.()}>
              {cancelText}
            </Action>
          ) : null}
          <Action ref={confirmRef} type="button" $accent={look.accent} onClick={submit}>
            {confirmText}
          </Action>
        </Actions>
      </Card>
    </Backdrop>,
    document.body
  );
};

export default Dialog;
