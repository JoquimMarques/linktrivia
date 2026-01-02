import './Legal.css'

const Terms = () => {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <h1>Terms of Service</h1>
                <p className="legal-updated">Last updated: January 2, 2026</p>

                <section className="legal-section">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Orbilink ("Service"), you agree to be bound by these
                        Terms of Service ("Terms"). If you do not agree to these Terms, please do
                        not use our Service.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. Description of Service</h2>
                    <p>
                        Orbilink is a link-in-bio platform that allows users to create a personalized
                        landing page containing multiple links to their social media profiles, websites,
                        and other online content.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>3. User Accounts</h2>
                    <p>To use our Service, you must:</p>
                    <ul>
                        <li>Be at least 13 years of age</li>
                        <li>Provide accurate and complete registration information</li>
                        <li>Maintain the security of your account credentials</li>
                        <li>Notify us immediately of any unauthorized use</li>
                    </ul>
                    <p>
                        You are responsible for all activities that occur under your account.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>4. Acceptable Use</h2>
                    <p>You agree NOT to use the Service to:</p>
                    <ul>
                        <li>Violate any laws or regulations</li>
                        <li>Infringe on intellectual property rights</li>
                        <li>Share harmful, fraudulent, or misleading content</li>
                        <li>Distribute malware or phishing links</li>
                        <li>Harass, abuse, or harm others</li>
                        <li>Share adult, violent, or illegal content</li>
                        <li>Impersonate others or misrepresent your identity</li>
                        <li>Interfere with the Service's operation</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>5. Content Ownership</h2>
                    <p>
                        You retain ownership of any content you create and share through Orbilink.
                        By using our Service, you grant us a non-exclusive, worldwide license to
                        display your content as part of providing the Service.
                    </p>
                    <p>
                        We reserve the right to remove any content that violates these Terms or is
                        otherwise objectionable.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>6. Subscription Plans</h2>
                    <p>
                        Orbilink offers free and paid subscription plans. Paid plans provide additional
                        features as described on our pricing page.
                    </p>
                    <ul>
                        <li>Payments are processed securely through Stripe</li>
                        <li>Subscriptions renew automatically unless cancelled</li>
                        <li>Refunds are handled on a case-by-case basis</li>
                        <li>We reserve the right to modify pricing with notice</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>7. Intellectual Property</h2>
                    <p>
                        The Orbilink name, logo, and all related graphics, software, and intellectual
                        property are owned by Orbilink or its licensors. You may not use, copy, or
                        distribute these without permission.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>8. Termination</h2>
                    <p>
                        We may suspend or terminate your account if you violate these Terms. Upon
                        termination, your right to use the Service will cease immediately. You may
                        also delete your account at any time through your account settings.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>9. Disclaimer of Warranties</h2>
                    <p>
                        The Service is provided "as is" without warranties of any kind, either express
                        or implied. We do not guarantee that the Service will be uninterrupted, secure,
                        or error-free.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>10. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, Orbilink shall not be liable for any
                        indirect, incidental, special, consequential, or punitive damages arising from
                        your use of the Service.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>11. Indemnification</h2>
                    <p>
                        You agree to indemnify and hold Orbilink harmless from any claims, damages,
                        or expenses arising from your use of the Service or violation of these Terms.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>12. Changes to Terms</h2>
                    <p>
                        We reserve the right to modify these Terms at any time. We will notify users
                        of significant changes. Continued use of the Service after changes constitutes
                        acceptance of the new Terms.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>13. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with applicable
                        laws, without regard to conflict of law principles.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>14. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at:
                    </p>
                    <p className="legal-contact">
                        <strong>Email:</strong> support@orbil.ink
                    </p>
                </section>
            </div>
        </div>
    )
}

export default Terms
