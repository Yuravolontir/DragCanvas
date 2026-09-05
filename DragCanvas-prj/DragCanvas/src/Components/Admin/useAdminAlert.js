import { useState } from 'react';

/**
 * The one alert dialog every admin action reports through.
 *
 * Every hook on this page - users, templates, schedules, newsletters - ends
 * its request the same way: say what happened, or say what went wrong. Rather
 * than each one owning its own copy of that dialog, they all call the single
 * `showAlertModal` this hook returns.
 */
export function useAdminAlert() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');

  const showAlertModal = (nextMessage, nextType = 'success') => {
    setMessage(nextMessage);
    setType(nextType);
    setShow(true);
  };

  const close = () => setShow(false);

  return {
    showAlertModal,
    alertDialog: { show, message, type, onClose: close },
  };
}
