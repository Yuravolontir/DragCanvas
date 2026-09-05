import { useEffect, useState } from 'react';

import { apiFetch } from '../../api.js';

/** Owns project form integrations and the Telegram connection test. */
export function useProjectIntegrations({ projectId, currentUser, publishDialogOpen, showError }) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [googleSheetsWebhookUrl, setGoogleSheetsWebhookUrl] = useState('');
  const [telegramBot, setTelegramBot] = useState(null);
  const [saved, setSaved] = useState(false);
  const [telegramTest, setTelegramTest] = useState(null);
  const [testingTelegram, setTestingTelegram] = useState(false);

  useEffect(() => {
    if (!projectId || !currentUser) return;

    apiFetch(`/api/forms/project/${projectId}/integrations`)
      .then((settings) => {
        setWebhookUrl(settings?.WebhookUrl || '');
        setTelegramChatId(settings?.TelegramChatId || '');
        setGoogleSheetsWebhookUrl(settings?.GoogleSheetsWebhookUrl || '');
      })
      .catch(() => {});
  }, [projectId, currentUser]);

  // Bot details are needed only while the publishing dialog is open.
  useEffect(() => {
    if (!publishDialogOpen || !currentUser || telegramBot) return;

    apiFetch('/api/forms/telegram/bot')
      .then((bot) => setTelegramBot(bot || { username: null }))
      .catch(() => setTelegramBot({ username: null }));
  }, [publishDialogOpen, currentUser, telegramBot]);

  const saveIntegrations = async () => {
    if (!projectId) return false;

    try {
      await apiFetch(`/api/forms/project/${projectId}/integrations`, {
        method: 'PUT',
        body: { webhookUrl, telegramChatId, googleSheetsWebhookUrl },
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      return true;
    } catch (error) {
      showError(error.message);
      return false;
    }
  };

  const testTelegram = async () => {
    if (!projectId) {
      setTelegramTest({
        ok: false,
        message: 'Save the project first, then test the connection.',
      });
      return;
    }

    setTestingTelegram(true);
    setTelegramTest(null);
    try {
      const result = await apiFetch(
        `/api/forms/project/${projectId}/integrations/telegram/test`,
        {
          method: 'POST',
          body: { telegramChatId: telegramChatId.trim() },
        },
      );
      setTelegramTest({ ok: true, message: result.message });
      await saveIntegrations();
    } catch (error) {
      setTelegramTest({ ok: false, message: error.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  return {
    webhookUrl,
    setWebhookUrl,
    telegramChatId,
    setTelegramChatId,
    googleSheetsWebhookUrl,
    setGoogleSheetsWebhookUrl,
    telegramBot,
    saved,
    telegramTest,
    clearTelegramTest: () => setTelegramTest(null),
    testingTelegram,
    saveIntegrations,
    testTelegram,
  };
}
