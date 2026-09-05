import React, { useCallback, useRef, useState } from 'react';
import { Dialog } from './Dialog.jsx';

/**
 * One dialog per component, driven by promises.
 *
 * Only one can be open at a time, which matches what the native calls did and
 * keeps the queue out of this file: a flow that needs to say two things says
 * the second after awaiting the first.
 */
export function useDialogs() {
  const [dialogState, setDialogState] = useState(null);

  // Refs remember values without causing a render. One stores the Promise's
  // resolve function; the other gives each opened dialog a fresh React key.
  const resolveDialogRef = useRef(null);
  const nextDialogIdRef = useRef(0);

  const closeDialog = useCallback((result) => {
    const resolve = resolveDialogRef.current;
    resolveDialogRef.current = null;
    setDialogState(null);
    resolve?.(result);
  }, []);

  const openDialog = useCallback((options) => {
    // A second call while one is open resolves the first rather than losing it.
    resolveDialogRef.current?.(options.input ? null : false);

    return new Promise((resolve) => {
      resolveDialogRef.current = resolve;
      // The id keys the dialog below, so each request gets its own component
      // and a prompt never opens holding the previous answer.
      nextDialogIdRef.current += 1;
      setDialogState({ ...options, id: nextDialogIdRef.current });
    });
  }, []);

  const alert = useCallback(
    (options) =>
      openDialog({
        tone: 'info',
        confirmText: 'OK',
        ...(typeof options === 'string' ? { message: options } : options),
      }),
    [openDialog]
  );

  const confirm = useCallback(
    (options) =>
      openDialog({
        tone: 'question',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        ...(typeof options === 'string' ? { message: options } : options),
      }),
    [openDialog]
  );

  const prompt = useCallback(
    (options) =>
      openDialog({
        tone: 'question',
        confirmText: 'Save',
        cancelText: 'Cancel',
        ...(typeof options === 'string' ? { title: options } : options),
        input: {
          value: '',
          ...(typeof options === 'string' ? {} : options.input || {}),
        },
      }),
    [openDialog]
  );

  const dialogs = (
    <Dialog
      key={dialogState?.id || 'idle'}
      open={Boolean(dialogState)}
      {...(dialogState || {})}
      onConfirm={(result) => closeDialog(result)}
      onCancel={() => closeDialog(dialogState?.input ? null : false)}
    />
  );

  return { dialogs, alert, confirm, prompt };
}
