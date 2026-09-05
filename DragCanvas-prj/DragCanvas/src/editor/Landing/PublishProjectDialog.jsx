import { createPortal } from 'react-dom';

import {
  PublishOverlay,
  PublishCard,
  PublishHead,
  PublishClose,
  PublishBody,
  PublishFoot,
  SectionLabel,
  TargetCard,
  PublishSection,
  Explainer,
  Note,
  Field,
  CheckField,
  Hint,
  TestResult,
  Steps,
  PublishPrimary,
  PublishGhost,
} from './Header.styles.js';

/**
 * Detailed publishing dialog, kept separate from the editor command bar.
 *
 * It owns its own visibility through `show`, the same as SaveProjectModal and
 * PublishInfoModal beside it. Without that it drew its portal the moment it was
 * mounted, so the editor opened with the publish sheet already covering it -
 * and nothing in the caller looked wrong, because the missing piece was a
 * wrapper that was no longer there.
 */
export default function PublishProjectDialog({
  show,
  publishTarget,
  setPublishTarget,
  customDomain,
  setCustomDomain,
  siteLanguage,
  setSiteLanguage,
  socialImage,
  setSocialImage,
  favicon,
  setFavicon,
  sitePassword,
  setSitePassword,
  comingSoon,
  setComingSoon,
  webhookUrl,
  setWebhookUrl,
  telegramChatId,
  setTelegramChatId,
  clearTelegramTest,
  telegramBot,
  handleTelegramTest,
  telegramTesting,
  telegramTest,
  googleSheetsWebhookUrl,
  setGoogleSheetsWebhookUrl,
  saveIntegrations,
  projectId,
  integrationsSaved,
  handlePreview,
  publishing,
  handlePublish,
  onClose,
}) {
  if (!show) return null;

  return createPortal(
    <PublishOverlay role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <PublishCard role="dialog" aria-modal="true" aria-label="Publish your site" onMouseDown={(e) => e.stopPropagation()}>
        <PublishHead>
          <span className="dc-publish-badge">
            <span className="material-symbols-outlined" aria-hidden="true">rocket_launch</span>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>Publish your site</h3>
            <p>
              Publishing turns your pages into a real website that anybody can open with a link. We check the pages for common mistakes, put them online and hand you the address. You can publish again as often as you like, and the address stays the same.
            </p>
          </div>
          <PublishClose type="button" onClick={() => onClose()} aria-label="Close">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </PublishClose>
        </PublishHead>

        <PublishBody>
          <SectionLabel>Where should your site live?</SectionLabel>

          <TargetCard $active={publishTarget === 'netlify'}>
            <input
              type="radio"
              name="publishTarget"
              checked={publishTarget === 'netlify'}
              onChange={() => setPublishTarget('netlify')}
            />
            <span>
              <span className="dc-target-name">Free address, ready in seconds</span>
              <Hint>
                We create the address for you, something like my-site.netlify.app. There is nothing to buy and nothing to set up. You also get a QR code, so the site opens on a phone by pointing the camera at it.
              </Hint>
            </span>
          </TargetCard>

          <TargetCard $active={publishTarget === 'custom'}>
            <input
              type="radio"
              name="publishTarget"
              checked={publishTarget === 'custom'}
              onChange={() => setPublishTarget('custom')}
            />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="dc-target-name">My own domain, such as mysite.com</span>
              <Hint>
                A domain is the name people type to reach you. You buy it yourself, for a yearly fee, at <a href="https://www.namecheap.com/" target="_blank" rel="noreferrer">Namecheap</a> or <a href="https://www.godaddy.com/en" target="_blank" rel="noreferrer">GoDaddy</a>, and then type it here.
              </Hint>
              {publishTarget === 'custom' && (
                <>
                  <Field as="div" style={{ marginTop: '10px' }}>
                    <input
                      placeholder="mysite.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                    />
                  </Field>
                  <Note>
                    <span className="material-symbols-outlined" aria-hidden="true">info</span>
                    <span>
                      One step stays with you. In the control panel of the company you bought the name from, the name has to be pointed at this site. Until that is done, the address will not open. Right after publishing we show you exactly what to point it at, and the padlock that means a secure connection is switched on for you once the name starts working, usually within a few hours.
                    </span>
                  </Note>
                </>
              )}
            </span>
          </TargetCard>

          <SectionLabel $spaced>
            Optional settings
            <span>You can publish without touching any of these. Open a section to see what it does.</span>
          </SectionLabel>

          <PublishSection>
            <summary>
              SEO and sharing — how your site looks to other people
              <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
            </summary>
            <div className="dc-section-inner">
              <Explainer>
                When somebody sends your link in WhatsApp, Telegram or Facebook, a small preview card usually appears instead of a bare link: a picture, a title and a line of text. This is where that card is set up. The same information helps Google understand and show your site.
              </Explainer>
              <Field>
                Page language
                <select value={siteLanguage} onChange={(e) => setSiteLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="he">עברית</option>
                  <option value="uk">Українська</option>
                </select>
                <Hint>The language your text is written in. It stops the browser from offering to translate a page that the visitor can already read, and it helps search engines.</Hint>
              </Field>
              <Field>
                Social preview image URL (optional)
                <input value={socialImage} onChange={(e) => setSocialImage(e.target.value)} placeholder="https://…/preview.jpg" />
                <Hint>The picture shown in that preview card. Leave it empty and we use the first image on your page.</Hint>
              </Field>
              <Field>
                Favicon URL (optional)
                <input value={favicon} onChange={(e) => setFavicon(e.target.value)} placeholder="https://…/favicon.png" />
                <Hint>The tiny icon on the browser tab, next to the name of the page. It is how people spot your tab among twenty open ones.</Hint>
              </Field>
              <Explainer style={{ marginTop: '16px' }}>
                The title and the line of text in the card are taken from the name and the description you gave this project when you saved it. The list of pages that search engines read is written for you automatically, so there is nothing else to do here.
              </Explainer>
            </div>
          </PublishSection>

          <PublishSection>
            <summary>
              Access protection — who is allowed to see the site
              <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
            </summary>
            <div className="dc-section-inner">
              <Explainer>
                By default anybody who has the link can open the site. These two options keep it closed while you are still working on it.
              </Explainer>
              <Field>
                Site password (optional)
                <input type="password" value={sitePassword} onChange={(e) => setSitePassword(e.target.value)} />
                <Hint>Visitors are asked for this password before they see anything. Useful when the site should be visible to one client only. Leave it empty for a site that is open to everyone.</Hint>
              </Field>
              <Note>
                <span className="material-symbols-outlined" aria-hidden="true">info</span>
                <span>
                  The password is not remembered between sessions. If you publish again with this field empty, the protection is removed and the site becomes public, so type the password in each time you publish.
                </span>
              </Note>
              <CheckField>
                <input type="checkbox" checked={comingSoon} onChange={(e) => setComingSoon(e.target.checked)} />
                <span>
                  Publish a “coming soon” page
                  <Hint>Puts one short holding page online, saying the site is being prepared, instead of your real pages. Nothing is lost: clear the tick, publish again, and the whole site appears.</Hint>
                </span>
              </CheckField>
            </div>
          </PublishSection>

          <PublishSection>
            <summary>
              Lead notifications — where to tell you about new enquiries
              <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
            </summary>
            <div className="dc-section-inner">
              <Explainer>
                A lead is a visitor who fills in a form on your site and leaves a name, a phone number or a question. Every lead is saved in your project and sent to you by e-mail in any case. The three fields below are extra ways to hear about it straight away, and all of them are optional.
              </Explainer>
              <Field>
                HTTPS webhook URL
                <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://…" />
                <Hint>For automation services such as Zapier or Make. Each new lead is sent to this address and your service decides what happens next. The address has to start with https. Leave it empty if you do not use anything like that.</Hint>
              </Field>
              <Field>
                Telegram chat ID
                <input
                  value={telegramChatId}
                  onChange={(event) => {
                    setTelegramChatId(event.target.value);
                    clearTelegramTest();
                  }}
                  placeholder="123456789"
                />
                <Hint>Receive each lead as a Telegram message. Three steps, about a minute:</Hint>
                <Steps>
                  <li>
                    <span>
                      <strong>Let our bot write to you.</strong>{' '}
                      {telegramBot?.username ? (
                        <>
                          Open <a href={`https://t.me/${telegramBot.username}`} target="_blank" rel="noreferrer">@{telegramBot.username}</a>{' '}
                          and press Start. For a team chat, add that bot to the group instead.
                        </>
                      ) : (
                        <>Open our bot in Telegram and press Start, or add it to your group.</>
                      )}
                      {' '}Telegram blocks a bot from writing to anybody who has not done this.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Copy your chat ID.</strong> For your own Telegram, message{' '}
                      <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer">@userinfobot</a> and it replies with the
                      number. For a group, add <a href="https://t.me/getmyid_bot" target="_blank" rel="noreferrer">@getmyid_bot</a>{' '}
                      to it, copy what it posts, then remove it. A group ID starts with a minus.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Paste it above and press the button below.</strong> A test message arriving means you are done —
                      it saves the settings for you, with no need to publish.
                    </span>
                  </li>
                </Steps>
              </Field>
              {telegramBot && !telegramBot.username && (
                <Note>
                  <span className="material-symbols-outlined" aria-hidden="true">info</span>
                  <span>{telegramBot.reason || 'Telegram notifications are not available on this site yet. E-mail still works.'}</span>
                </Note>
              )}
              <div style={{ marginTop: '10px' }}>
                <PublishGhost
                  type="button"
                  onClick={handleTelegramTest}
                  disabled={telegramTesting || !telegramChatId.trim()}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">send</span>
                  {telegramTesting ? 'Sending…' : 'Send a test message'}
                </PublishGhost>
                {telegramTest && (
                  <TestResult $ok={telegramTest.ok} role="status">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {telegramTest.ok ? 'check_circle' : 'error'}
                    </span>
                    <span>{telegramTest.message}</span>
                  </TestResult>
                )}
              </div>
              <Field>
                Google Sheets Apps Script webhook
                <input value={googleSheetsWebhookUrl} onChange={(e) => setGoogleSheetsWebhookUrl(e.target.value)} placeholder="https://script.google.com/…" />
                <Hint>Writes every lead as a new row in your Google spreadsheet, instead of you keeping a list by hand. It is set up once inside the sheet: Extensions, then Apps Script, then deploy it as a web app, and paste the link it gives you here.</Hint>
              </Field>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                <PublishGhost type="button" $quiet onClick={saveIntegrations} disabled={!projectId}>
                  <span className="material-symbols-outlined" aria-hidden="true">save</span>
                  Save these settings
                </PublishGhost>
                {integrationsSaved && (
                  <Hint style={{ margin: 0, color: 'var(--primary)' }}>Saved.</Hint>
                )}
              </div>
              <Hint>Publishing saves them too. This button is for when you want to keep them without publishing yet.</Hint>
            </div>
          </PublishSection>

          <Hint style={{ marginTop: '16px' }}>
            Preview builds a private copy of the site that only people with your link can open. It is hidden from search engines and disappears after seven days, so it is a safe way to check everything before going live.
          </Hint>
        </PublishBody>

        <PublishFoot>
          <PublishGhost type="button" onClick={handlePreview} disabled={publishing}>
            <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            Preview
          </PublishGhost>
          <PublishPrimary type="button" onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publishing…' : 'Publish'}
          </PublishPrimary>
          <PublishGhost type="button" $quiet onClick={() => onClose()}>
            Cancel
          </PublishGhost>
        </PublishFoot>
      </PublishCard>
    </PublishOverlay>,
    document.body,
  );
}
