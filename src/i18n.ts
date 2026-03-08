import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/* ─── Translation Resources ────────────────────────── */
const resources = {
    en: {
        translation: {
            app_name: "STRIDE",
            nav: {
                home: "Home",
                projects: "Projects",
                calendar: "Calendar",
                notes: "Notes",
                team: "Team",
                analytics: "Analytics",
                profile: "Profile",
                logout: "Logout",
            },
            header: {
                workspace: "{{name}}'s Workspace",
                workspace_default: "STRIDE",
                active_projects: "{{count}} active project",
                active_projects_plural: "{{count}} active projects",
                search: "Search…",
                accent: "Accent",
                stealth: "Stealth",
            },
            common: {
                language: "العربية",
                settings: "Settings",
                focus_timer: "Focus Timer",
                stealth_mode: "Stealth Mode",
                sign_in: "Sign In",
                sign_up: "Sign Up",
            },
        },
    },
    ar: {
        translation: {
            app_name: "سترايد",
            nav: {
                home: "الرئيسية",
                projects: "المشاريع",
                calendar: "التقويم",
                notes: "الملاحظات",
                team: "الفريق",
                analytics: "الإحصائيات",
                profile: "الملف الشخصي",
                logout: "تسجيل الخروج",
            },
            header: {
                workspace: "مساحة عمل {{name}}",
                workspace_default: "سترايد",
                active_projects: "{{count}} مشروع نشط",
                active_projects_plural: "{{count}} مشاريع نشطة",
                search: "بحث…",
                accent: "اللون",
                stealth: "الوضع الخفي",
            },
            common: {
                language: "English",
                settings: "الإعدادات",
                focus_timer: "مؤقت التركيز",
                stealth_mode: "الوضع الخفي",
                sign_in: "تسجيل الدخول",
                sign_up: "إنشاء حساب",
            },
        },
    },
};

/* ─── Init ─────────────────────────────────────────── */
i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
});

/* ─── RTL / LTR direction on language change ───────── */
const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);

function applyDirection(lng: string) {
    const isRtl = RTL_LANGS.has(lng);
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lng;
}

// Apply on init
applyDirection(i18n.language);

// Apply on every language change
i18n.on("languageChanged", applyDirection);

export default i18n;
