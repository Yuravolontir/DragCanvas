import React, { useCallback, useRef, useState } from 'react';
import { Dialog } from './Dialog.jsx';

/**
 * One dialog per component, driven by promises.
 *
 * Only one can be open at a time, which matches what the native calls did and
 * keeps the queue out of this file: a flow that needs to say two things says
 * the second after awaiting the first.
 */
export const useDialogs = () => {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);
  const requestRef = useRef(0);

  const settle = useCallback((result) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setState(null);
    resolve?.(result);
  }, []);

  const open = useCallback((next) => {
    // A second call while one is open resolves the first rather than losing it.
    resolveRef.current?.(next.input ? null : false);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      // The id keys the dialog below, so each request gets its own component
      // and a prompt never opens holding the previous answer.
      requestRef.current += 1;
      setState({ ...next, id: requestRef.current });
    });
  }, []);

  const alert = useCallback(
    (options) =>
      open({
        tone: 'info',
        confirmText: 'OK',
        ...(typeof options === 'string' ? { message: options } : options),
      }),
    [open]
  );

  const confirm = useCallback(
    (options) =>
      open({
        tone: 'question',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        ...(typeof options === 'string' ? { message: options } : options),
      }),
    [open]
  );

  const prompt = useCallback(
    (options) =>
      open({
        tone: 'question',
        confirmText: 'Save',
        cancelText: 'Cancel',
        ...(typeof options === 'string' ? { title: options } : options),
        input: {
          value: '',
          ...(typeof options === 'string' ? {} : options.input || {}),
        },
      }),
    [open]
  );

  const dialogs = (
    <Dialog
      key={state?.id || 'idle'}
      open={!!state}
      {...(state || {})}
      onConfirm={(result) => settle(result)}
      onCancel={() => settle(state?.input ? null : false)}
    />
  );

  return { dialogs, alert, confirm, prompt };
};
