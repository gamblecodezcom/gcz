import { useEffect, useRef } from 'react';
import { API_BASE_URL, SOCIAL_LINKS } from '../utils/constants';

interface TelegramLinkWidgetProps {
  cwalletId?: string | null;
}

const getBotUsername = () => {
  const url = SOCIAL_LINKS.telegram.bot;
  try {
    return url.split('/').filter(Boolean).pop() ?? 'GambleCodezCasinoDrops_bot';
  } catch {
    return 'GambleCodezCasinoDrops_bot';
  }
};

export const TelegramLinkWidget = ({ cwalletId }: TelegramLinkWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    if (!cwalletId) return undefined;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?25';
    script.async = true;
    script.setAttribute('data-telegram-login', getBotUsername());
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute(
      'data-auth-url',
      `${API_BASE_URL.replace(/\/$/, '')}/api/profile/telegram/link?cwallet=${encodeURIComponent(
        cwalletId,
      )}`,
    );

    containerRef.current.appendChild(script);

    return () => {
      script.remove();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [cwalletId]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        Link Telegram to your active Cwallet profile. This button securely verifies you with Telegram
        and attaches the bot to your Degen identity.
      </p>
      <div ref={containerRef} />
    </div>
  );
};
