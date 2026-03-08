import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using the Stride application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use the Service.

These Terms apply to all users, whether registered or browsing. We reserve the right to modify these Terms at any time. Material changes will be communicated via email to registered users at least 14 days before they take effect.`,
  },
  {
    title: "2. Account Registration",
    content: `To use Stride, you must create an account by providing a valid email address and a secure password. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.

You must provide accurate and complete information during registration. Using false or misleading information may result in account termination. You must be at least 16 years old to create an account.

You agree to notify us immediately if you suspect unauthorized access to your account.`,
  },
  {
    title: "3. Acceptable Use",
    content: `You agree to use Stride only for lawful purposes and in a manner consistent with these Terms. You may not:

• Upload, share, or store content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable
• Attempt to gain unauthorized access to any part of the Service, other accounts, or connected systems
• Use automated scripts, bots, or scrapers to access or interact with the Service without our express permission
• Reverse-engineer, decompile, or disassemble any part of the Service
• Interfere with or disrupt the Service infrastructure
• Resell, redistribute, or sublicense the Service without authorization

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: "4. Your Content",
    content: `You retain full ownership of all content you create, upload, or store within Stride — including projects, tasks, notes, and uploaded files ("Your Content"). We do not claim any intellectual property rights over Your Content.

By using the Service, you grant us a limited, non-exclusive license to store, process, and transmit Your Content solely for the purpose of providing and improving the Service. This license ends when you delete Your Content or your account.

We do not access, read, or analyze Your Content except as necessary to operate the Service (e.g., indexing for search) or when required by law.`,
  },
  {
    title: "5. Service Availability",
    content: `We strive to keep Stride available 24/7, but we do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.

We are not liable for any loss or damage arising from service interruptions or downtime. We will make reasonable efforts to notify users in advance of planned maintenance windows.`,
  },
  {
    title: "6. Pricing & Payments",
    content: `Stride currently offers a free tier. If we introduce paid plans in the future, we will clearly communicate pricing before any charges are applied. You will never be charged without your explicit consent.

For paid features, refund policies and billing terms will be specified at the point of purchase.`,
  },
  {
    title: "7. Termination",
    content: `You may delete your account at any time through your account settings. Upon deletion, all of Your Content will be permanently removed in accordance with our Privacy Policy.

We reserve the right to suspend or terminate your account if you violate these Terms, engage in abusive behavior, or if your account has been inactive for an extended period (12+ months). We will provide reasonable notice before termination wherever possible.`,
  },
  {
    title: "8. Limitation of Liability",
    content: `To the maximum extent permitted by law, Stride and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.

Our total liability for any claim arising from these Terms or the Service shall not exceed the amount you paid us in the 12 months preceding the claim (or $100 if no payments were made).

The Service is provided "as is" and "as available" without warranties of any kind, express or implied.`,
  },
  {
    title: "9. Governing Law",
    content: `These Terms are governed by and construed in accordance with applicable law. Any disputes arising from these Terms or the Service will be resolved through good-faith negotiation first, and if necessary, through binding arbitration.`,
  },
  {
    title: "10. Contact",
    content: `For questions about these Terms of Service, please contact us at:

legal@stride.app

Stride Technologies
Legal Department`,
  },
];

export default function Terms() {
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
          <span className="text-sm font-semibold">Terms of Service</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Legal</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-500 mb-12">Last updated: February 1, 2026</p>

        <div className="space-y-10">
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
