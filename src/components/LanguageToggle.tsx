import { memo } from "react";
import { motion } from "framer-motion";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Toggles between English and Arabic (LTR ↔ RTL).
 * Displays the *other* language name so users know what they'll switch to.
 */
const LanguageToggle = memo(function LanguageToggle() {
    const { t, i18n } = useTranslation();

    const toggle = () => {
        const next = i18n.language === "ar" ? "en" : "ar";
        i18n.changeLanguage(next);
    };

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggle}
            className="h-9 px-2.5 rounded-2xl glass flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-premium"
            aria-label={`Switch language to ${i18n.language === "ar" ? "English" : "Arabic"}`}
        >
            <Languages className="w-4 h-4" />
            <span className="text-[11px] font-semibold hidden sm:inline">
                {t("common.language")}
            </span>
        </motion.button>
    );
});

export default LanguageToggle;
