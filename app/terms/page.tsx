'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function TermsAndConditions() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="border-slate-600 bg-slate-800 text-white hover:bg-slate-800"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Terms & Conditions</h1>
          <div></div>
        </div>

        {/* Terms & Conditions Content */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center">
              📜 Terms and Conditions – TFN Network
            </CardTitle>
            <p className="text-gray-400">Effective Date: September 16, 2025</p>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-300">
            <p>
              These Terms and Conditions ("Terms") govern your use of TFN Network, a gospel livestreaming app. By downloading, accessing, or using the App, you agree to these Terms.
            </p>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">1. Use of the App</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>The App is provided for livestreaming gospel content and related activities.</li>
                <li>You agree not to use the App for unlawful, harmful, or abusive purposes.</li>
                <li>You are responsible for any content you share (comments, live sessions, uploads).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">2. Accounts</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>You must provide accurate information when creating an account.</li>
                <li>You are responsible for maintaining the confidentiality of your login details.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">3. Content</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>You retain ownership of any content you upload or stream but grant TFN Network a license to display, distribute, and promote it within the App.</li>
                <li>You agree not to upload or stream content that is offensive, illegal, or infringes on others' rights.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">4. Intellectual Property</h2>
              <p>
                All content provided by TFN Network, including logos, design, and features, is owned by or licensed to us and may not be used without permission.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">5. Disclaimer of Warranties</h2>
              <p>
                The App is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service, error-free content, or that the App will meet your needs.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">6. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, TFN Network shall not be liable for damages arising from your use or inability to use the App.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">7. Termination</h2>
              <p>
                We may suspend or terminate your access if you violate these Terms or engage in conduct harmful to the community.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">8. Governing Law</h2>
              <p>
                These Terms are governed by the laws of Nigeria. Any disputes will be resolved in the courts of Lagos State, Nigeria.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">9. Contact Us</h2>
              <p>If you have questions, contact us at:</p>
              <div className="space-y-2 mt-2">
                <p>📧 Email: <a href="mailto:gregosimiri@gmail.com" className="text-blue-400 hover:text-blue-300">gregosimiri@gmail.com</a></p>
                <p>📞 Phone: <a href="tel:+2348061920919" className="text-blue-400 hover:text-blue-300">+234 806 192 0919</a></p>
              </div>
            </section>

            {/* Agreement Notice */}
            <section className="border-t border-slate-700 pt-6">
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Agreement Notice</h3>
                <p className="text-sm">
                  By using TFN Network, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}