import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Information We Collect",
    content: `When you create a Stride account, we collect your email address, full name, and optionally a job title. We use this information solely to provide and personalize your Stride experience.

We also automatically collect certain technical data when you interact with the service, including your IP address, browser type, operating system, and usage patterns. This data helps us maintain security, diagnose issues, and improve product performance.

We do not collect, sell, or share personal information for advertising purposes. Stride is a productivity tool, not an ad platform.`,
  },
  {
    title: "2. How We Use Your Data",
    content: `Your data is used exclusively to operate, maintain, and improve the Stride service. Specifically, we use your information to:

• Authenticate your identity and manage your account
• Store and sync your projects, tasks, and notes across devices
• Send transactional emails (password resets, security alerts)
• Generate aggregate, anonymized analytics to improve the product
• Detect and prevent fraud, abuse, and security incidents

We will never use your project data, task content, or notes for training machine learning models or any purpose beyond providing the service.`,
  },
  {
    title: "3. Data Storage & Security",
    content: `Your data is stored in PostgreSQL databases hosted on SOC 2-compliant cloud infrastructure. All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.

Passwords are hashed using bcrypt with a cost factor of 12. We never store plaintext passwords, and our authentication system uses short-lived JWT access tokens (15 minutes) with secure HTTP-only refresh tokens (7 days).

We implement CSRF protection, rate limiting, input sanitization, and Content Security Policy headers to guard against common web vulnerabilities. Security is reviewed regularly and is a core engineering priority.`,
  },
  {
    title: "4. Data Retention",
    content: `We retain your account data for as long as your account is active. If you delete your account, we permanently delete all associated data — including projects, tasks, notes, and uploaded files — within 30 days.

Backup copies may persist in encrypted backups for up to 90 days after deletion for disaster recovery purposes, after which they are permanently purged.`,
  },
  {
    title: "5. Third-Party Services",
    content: `Stride uses a minimal set of third-party services to operate:

• Cloud hosting (database and file storage)
• Email delivery service (transactional emails only)
• Error monitoring and logging

We do not use third-party analytics, advertising networks, or social tracking pixels. We do not share your personal data with any third party for their own marketing purposes.`,
  },
  {
    title: "6. Cookies",
    content: `Stride uses a small number of strictly necessary cookies to manage authentication sessions and CSRF protection. We do not use tracking cookies, advertising cookies, or any third-party cookie services.

You can configure your browser to refuse cookies, but this may prevent you from using certain features of Stride that require authentication.`,
  },
  {
    title: "7. Your Rights",
    content: `You have the right to:

• Access the personal data we hold about you
• Correct inaccurate data in your profile
• Export your data in a standard format
• Delete your account and all associated data
• Withdraw consent at any time

To exercise any of these rights, contact us at privacy@stride.app. We will respond within 30 days.`,
  },
  {
    title: "8. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. When we make material changes, we will notify registered users by email and update the "Last Updated" date at the top of this page.

Continued use of Stride after changes are posted constitutes acceptance of the revised policy.`,
  },
  {
    title: "9. Contact",
    content: `If you have questions about this Privacy Policy or how we handle your data, please contact us at:

privacy@stride.app

Stride Technologies
Data Protection Inquiries`,
  },
];

export default function Privacy() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
          <span className="text-sm font-semibold">Privacy Policy</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Legal</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-500 mb-12">Last updated: February 1, 2026</p>

        <div className="prose-container space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold tracking-tight mb-3">{s.title}</h2>
              <div className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                {s.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
