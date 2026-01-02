import './Legal.css'

const Privacy = () => {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <h1>Privacy Policy</h1>
                <p className="legal-updated">Last updated: January 2, 2026</p>

                <section className="legal-section">
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Orbilink ("we," "our," or "us"). We are committed to protecting your
                        personal information and your right to privacy. This Privacy Policy explains how
                        we collect, use, disclose, and safeguard your information when you use our service.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. Information We Collect</h2>
                    <h3>Personal Information</h3>
                    <p>We may collect the following personal information:</p>
                    <ul>
                        <li>Name and email address (when you register or sign in with Google)</li>
                        <li>Profile picture (if provided through Google sign-in)</li>
                        <li>Username you choose for your Orbilink page</li>
                        <li>Links and content you add to your profile</li>
                    </ul>

                    <h3>Usage Data</h3>
                    <p>We automatically collect certain information when you visit our platform:</p>
                    <ul>
                        <li>IP address and browser type</li>
                        <li>Pages visited and time spent</li>
                        <li>Click data on your Orbilink page</li>
                        <li>Device information</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>3. How We Use Your Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul>
                        <li>Create and manage your account</li>
                        <li>Provide and maintain our service</li>
                        <li>Display your public profile page</li>
                        <li>Provide analytics about your page performance</li>
                        <li>Send important notifications about your account</li>
                        <li>Improve our services and user experience</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>4. Information Sharing</h2>
                    <p>
                        We do not sell, trade, or rent your personal information to third parties.
                        We may share your information only in the following situations:
                    </p>
                    <ul>
                        <li>With your consent</li>
                        <li>To comply with legal obligations</li>
                        <li>To protect our rights and prevent fraud</li>
                        <li>With service providers who assist in operating our platform</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>5. Data Security</h2>
                    <p>
                        We implement appropriate technical and organizational security measures to
                        protect your personal information. However, no method of transmission over
                        the Internet is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your account and data</li>
                        <li>Export your data</li>
                        <li>Opt-out of marketing communications</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>7. Cookies</h2>
                    <p>
                        We use cookies and similar technologies to enhance your experience,
                        analyze usage, and provide personalized content. You can control cookies
                        through your browser settings.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>8. Third-Party Services</h2>
                    <p>
                        Our service integrates with third-party services like Google (for authentication)
                        and Stripe (for payments). These services have their own privacy policies,
                        and we encourage you to review them.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>9. Children's Privacy</h2>
                    <p>
                        Our service is not intended for children under 13 years of age. We do not
                        knowingly collect personal information from children under 13.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>10. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of
                        any changes by posting the new Privacy Policy on this page and updating the
                        "Last updated" date.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>11. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at:
                    </p>
                    <p className="legal-contact">
                        <strong>Email:</strong> support@orbil.ink
                    </p>
                </section>
            </div>
        </div>
    )
}

export default Privacy
