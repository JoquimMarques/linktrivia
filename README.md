# ⚡ Venos - Link-in-Bio SaaS Platform

A modern, professional link-in-bio platform built with React, Firebase, and Stripe. Create beautiful, customizable pages that house all your important links.

![Venos](https://img.shields.io/badge/Venos-SaaS-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)

## ✨ Features

- 🔗 **Link Management** - Add, edit, reorder, and delete links
- 🔐 **Authentication** - Email/password and Google sign-in
- 💳 **Payments** - Stripe integration for subscriptions
- 📊 **Analytics** - Track views and clicks (coming soon)
- 🎨 **Custom Themes** - Personalize your page (Pro feature)
- 📱 **Mobile Responsive** - Perfect on any device
- ⚡ **Fast & Lightweight** - Built with Vite for optimal performance

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Firebase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   cd venos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   VITE_STRIPE_PRO_PRICE_ID=price_xxxxx
   VITE_STRIPE_BUSINESS_PRICE_ID=price_xxxxx
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
venos/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable UI components
│   │   ├── LinkButton.jsx
│   │   ├── Navbar.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── ProfileHeader.jsx
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Pricing.jsx
│   │   └── Profile.jsx
│   ├── services/          # API and Firebase services
│   │   ├── firebase.js
│   │   ├── auth.js
│   │   └── payments.js
│   ├── context/           # React Context providers
│   │   └── AuthContext.jsx
│   ├── hooks/             # Custom React hooks
│   │   └── useAuth.js
│   ├── styles/            # Global styles
│   │   └── global.css
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── functions/             # Cloud Functions (payments)
│   ├── index.js
│   └── stripe.js
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
└── storage.rules          # Storage security rules
```

## 🔧 Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Enable the following services:
   - Authentication (Email/Password and Google)
   - Firestore Database
   - Storage
   - Hosting
   - Functions

3. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. Deploy Storage rules:
   ```bash
   firebase deploy --only storage:rules
   ```

## 💳 Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)

2. Create products and prices in the Stripe Dashboard

3. Set up Cloud Functions environment:
   ```bash
   firebase functions:config:set stripe.secret_key="sk_test_xxxxx"
   firebase functions:config:set stripe.webhook_secret="whsec_xxxxx"
   ```

4. Deploy functions:
   ```bash
   cd functions && npm install && cd ..
   firebase deploy --only functions
   ```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Build and deploy to Firebase |

## 🎨 Customization

### Themes

Edit `src/styles/global.css` to customize:
- Colors and gradients
- Typography
- Spacing
- Border radius
- Animations

### Adding New Features

1. Create a new component in `src/components/`
2. Add a new page in `src/pages/`
3. Update routes in `src/App.jsx`
4. Add any new services in `src/services/`

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ by Venos Team
