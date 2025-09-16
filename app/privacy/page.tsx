'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <div></div>
        </div>

        {/* Privacy Policy Content */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center">
              📜 Privacy Policy – TFN Network
            </CardTitle>
            <p className="text-gray-400">Effective Date: September 16, 2025</p>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-300">
            <p>
              TFN Network ("we," "our," "us") values your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our gospel livestreaming application (the "App").
            </p>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
              <div className="space-y-2">
                <p><strong className="text-white">Personal Information:</strong> Name, email address, phone number, or other details you provide when creating an account or contacting us.</p>
                <p><strong className="text-white">Usage Data:</strong> IP address, device type, app usage statistics, and log data to help us improve the service.</p>
                <p><strong className="text-white">Content Data:</strong> Live chat messages, comments, or other content you share while using the App.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Information</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>To provide and improve the livestreaming service.</li>
                <li>To personalize your experience (e.g., suggested streams, notifications).</li>
                <li>To ensure community safety and prevent misuse of the App.</li>
                <li>To comply with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">3. Sharing of Information</h2>
              <p>We do not sell or rent your personal data. We may share information:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>With service providers who help us operate the App.</li>
                <li>If required by law or government authorities.</li>
                <li>In case of merger, acquisition, or sale of assets.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">4. Data Security</h2>
              <p>
                We implement reasonable technical and organizational measures to protect your information. However, no system is 100% secure, and we cannot guarantee absolute protection.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">5. Children's Privacy</h2>
              <p>
                The App is intended for users 13 years and older. If you are under 13, you may only use the App with parental consent.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">6. Your Rights</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Access, update, or delete your personal information.</li>
                <li>Opt out of marketing communications.</li>
                <li>Contact us at gregosimiri@gmail.com for requests.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">7. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Continued use of the App after changes means you accept the revised policy.
              </p>
            </section>

            {/* Contact Section */}
            <section className="border-t border-slate-700 pt-6">
              <h2 className="text-lg font-semibold text-white mb-3">Contact Us</h2>
              <div className="space-y-2">
                <p>📧 Email: <a href="mailto:gregosimiri@gmail.com" className="text-blue-400 hover:text-blue-300">gregosimiri@gmail.com</a></p>
                <p>📞 Phone: <a href="tel:+2348061920919" className="text-blue-400 hover:text-blue-300">+234 806 192 0919</a></p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}