import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

/**
 * Language toggle — matches the style of ThemeToggle.
 * Switches between 'es' (Spanish) and 'en' (English).
 * The active language is shown as a small flag-emoji + code label.
 */
export function LanguageToggle() {
    const { i18n } = useTranslation();
    const isSpanish = i18n.language === 'es';

    const toggle = () => {
        i18n.changeLanguage(isSpanish ? 'en' : 'es');
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={isSpanish ? 'Switch to English' : 'Cambiar a Español'}
            title={isSpanish ? 'Switch to English' : 'Cambiar a Español'}
            className="w-9 h-9 text-xs font-semibold"
        >
            {isSpanish ? (
                <span className="flex items-center gap-0.5 leading-none">
                    <span aria-hidden>🇺🇸</span>
                </span>
            ) : (
                <span className="flex items-center gap-0.5 leading-none">
                    <span aria-hidden>🇵🇪</span>
                </span>
            )}
        </Button>
    );
}
