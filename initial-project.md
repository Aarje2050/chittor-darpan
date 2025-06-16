# **Chittor Darpan \- Project Setup & Development Guide**

## **🎯 Project Overview**

**Simple URL Structure (MVP):**

/business/business-name     \# Individual business pages  
/restaurants               \# Category archive pages    
/pratap-nagar             \# Location archive pages  
/search                   \# Search functionality

**Future Enhancement URLs:**

/restaurants/pratap-nagar  \# Category \+ Location combinations  
/hotels/gandhi-nagar      \# "Best Hotels in Gandhi Nagar"

## **📱 Mobile-First Design Philosophy**

**Why Mobile-First is Critical:**

* 70-80% of business directory users are on mobile  
* Local searches happen on-the-go  
* "Near me" searches are predominantly mobile  
* Future web-view app needs native-like experience  
* Better performance and user engagement

**Mobile Design Principles:**

* **Touch-first interactions** \- Large, easy-to-tap buttons  
* **Thumb-friendly navigation** \- Bottom navigation bar  
* **Swipe gestures** \- For image galleries and lists  
* **One-handed operation** \- Key actions within thumb reach  
* **Fast loading** \- Optimized for mobile networks  
* **Native app feel** \- Smooth animations and transitions

## **🚀 Phase 1: Project Setup**

### **Step 1: Create Next.js Project**

\# Create project with all recommended settings  
npx create-next-app@latest chittor-darpan \--typescript \--tailwind \--eslint \--app \--src-dir \--import-alias "@/\*"

\# Navigate to project  
cd chittor-darpan

\# Start development server  
npm run dev

**Project Configuration:**

* ✅ TypeScript  
* ✅ Tailwind CSS  
* ✅ ESLint  
* ✅ App Router  
* ✅ src directory  
* ✅ Import alias (@/\*)

### **Step 2: Install Additional Dependencies**

\# Authentication & Database  
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

\# UI & Forms  
npm install @radix-ui/react-slot @radix-ui/react-dropdown-menu  
npm install react-hook-form @hookform/resolvers  
npm install zod \# Form validation  
npm install lucide-react \# Icons

\# Mobile & Touch Interactions  
npm install framer-motion \# Smooth animations & gestures  
npm install embla-carousel-react \# Touch-friendly carousels  
npm install react-intersection-observer \# Scroll animations

\# Utilities  
npm install clsx tailwind-merge  
npm install next-themes \# Dark mode support (future)

\# Development tools  
npm install \-D @types/node

### **Step 3: Environment Variables Setup**

\# Create .env.local file  
touch .env.local

\# .env.local  
NEXT\_PUBLIC\_SUPABASE\_URL=your\_supabase\_url  
NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=your\_supabase\_anon\_key  
SUPABASE\_SERVICE\_ROLE\_KEY=your\_service\_role\_key

\# Google Auth (we'll add later)  
GOOGLE\_CLIENT\_ID=your\_google\_client\_id  
GOOGLE\_CLIENT\_SECRET=your\_google\_client\_secret

\# App Configuration  
NEXT\_PUBLIC\_APP\_URL=http://localhost:3000  
NEXT\_PUBLIC\_CITY\_NAME=Chittorgarh  
NEXT\_PUBLIC\_CITY\_SLUG=chittorgarh

## **📁 Project Structure Setup**

### **Step 4: Create Folder Structure**

\# Create main directories  
mkdir \-p src/components/ui  
mkdir \-p src/components/layout  
mkdir \-p src/components/mobile  
mkdir \-p src/components/business  
mkdir \-p src/components/forms  
mkdir \-p src/lib  
mkdir \-p src/hooks  
mkdir \-p src/types  
mkdir \-p src/utils  
mkdir \-p src/data

\# Create specific component folders  
mkdir \-p src/components/admin  
mkdir \-p src/components/auth  
mkdir \-p src/components/search  
mkdir \-p src/components/desktop

### **Final Project Structure**

chittor-darpan/  
├── src/  
│   ├── app/                     \# Next.js App Router  
│   │   ├── globals.css  
│   │   ├── layout.tsx           \# Mobile-first root layout  
│   │   ├── page.tsx  
│   │   ├── business/  
│   │   │   └── \[slug\]/page.tsx  
│   │   ├── admin/  
│   │   │   ├── layout.tsx  
│   │   │   ├── page.tsx  
│   │   │   ├── businesses/page.tsx  
│   │   │   └── reviews/page.tsx  
│   │   ├── auth/  
│   │   │   ├── login/page.tsx  
│   │   │   └── callback/page.tsx  
│   │   ├── dashboard/  
│   │   │   ├── layout.tsx  
│   │   │   ├── page.tsx  
│   │   │   └── businesses/page.tsx  
│   │   ├── search/page.tsx  
│   │   └── \[category\]/page.tsx  
│   ├── components/  
│   │   ├── ui/                  \# Reusable UI components  
│   │   │   ├── button.tsx       \# Touch-friendly buttons  
│   │   │   ├── input.tsx        \# Mobile-optimized inputs  
│   │   │   ├── card.tsx         \# Touch-friendly cards  
│   │   │   └── badge.tsx  
│   │   ├── layout/              \# Layout components  
│   │   │   ├── header.tsx       \# Desktop header  
│   │   │   ├── footer.tsx       \# Desktop footer  
│   │   │   ├── navbar.tsx       \# Desktop navigation  
│   │   │   └── sidebar.tsx      \# Desktop sidebar  
│   │   ├── mobile/              \# Mobile-specific components  
│   │   │   ├── bottom-navigation.tsx    \# Main mobile navigation  
│   │   │   ├── mobile-header.tsx        \# Mobile header  
│   │   │   ├── mobile-search.tsx        \# Mobile search UI  
│   │   │   ├── mobile-filters.tsx       \# Touch-friendly filters  
│   │   │   ├── mobile-business-card.tsx \# Mobile business cards  
│   │   │   ├── floating-action-button.tsx \# FAB for quick actions  
│   │   │   ├── pull-to-refresh.tsx      \# Mobile refresh  
│   │   │   └── swipe-carousel.tsx       \# Touch image carousel  
│   │   ├── desktop/             \# Desktop-enhanced components  
│   │   │   ├── desktop-search.tsx  
│   │   │   ├── desktop-filters.tsx  
│   │   │   └── desktop-business-grid.tsx  
│   │   ├── business/            \# Business-related components  
│   │   │   ├── business-card.tsx        \# Responsive business card  
│   │   │   ├── business-list.tsx        \# Responsive list  
│   │   │   ├── business-detail.tsx      \# Mobile-first detail view  
│   │   │   ├── review-card.tsx          \# Touch-friendly reviews  
│   │   │   ├── business-actions.tsx     \# Call, Directions, Share  
│   │   │   └── image-gallery.tsx        \# Swipeable gallery  
│   │   ├── forms/               \# Form components  
│   │   │   ├── business-form.tsx        \# Mobile-friendly forms  
│   │   │   ├── review-form.tsx  
│   │   │   └── search-form.tsx  
│   │   ├── admin/               \# Admin components  
│   │   │   ├── admin-sidebar.tsx  
│   │   │   ├── business-table.tsx  
│   │   │   └── stats-cards.tsx  
│   │   └── auth/                \# Auth components  
│   │       ├── login-form.tsx  
│   │       └── auth-button.tsx  
│   ├── lib/                     \# Core utilities  
│   │   ├── supabase.ts          \# Supabase client  
│   │   ├── auth.ts              \# Auth helpers  
│   │   ├── database.ts          \# Database queries  
│   │   ├── mobile-utils.ts      \# Mobile detection & utilities  
│   │   └── utils.ts             \# General utilities  
│   ├── hooks/                   \# Custom React hooks  
│   │   ├── use-auth.ts  
│   │   ├── use-businesses.ts  
│   │   ├── use-search.ts  
│   │   ├── use-mobile.ts        \# Mobile detection hook  
│   │   └── use-touch-gestures.ts \# Touch interaction hooks  
│   ├── types/                   \# TypeScript types  
│   │   ├── database.ts          \# Supabase types  
│   │   ├── business.ts  
│   │   └── auth.ts  
│   ├── utils/                   \# Helper functions  
│   │   ├── seo.ts               \# SEO helpers  
│   │   ├── validation.ts        \# Form validation  
│   │   ├── mobile-seo.ts        \# Mobile-specific SEO  
│   │   └── constants.ts         \# App constants  
│   └── data/                    \# Static data  
│       ├── categories.ts  
│       └── areas.ts  
├── public/                      \# Static assets  
│   ├── icons/                   \# PWA icons (future)  
│   └── images/  
├── .env.local                   \# Environment variables  
├── next.config.js               \# Next.js configuration  
├── tailwind.config.js           \# Mobile-first Tailwind config  
└── package.json

## **🔧 Phase 2: Basic Configuration**

### **Step 5: Update next.config.js**

/\*\* @type {import('next').NextConfig} \*/  
const nextConfig \= {  
  images: {  
    domains: \['localhost', 'your-supabase-storage-url'\],  
  },  
  async redirects() {  
    return \[  
      // WordPress migration redirects  
      {  
        source: '/listing/:slug',  
        destination: '/business/:slug',  
        permanent: true,  
      },  
      {  
        source: '/listing-category/:category',  
        destination: '/:category',  
        permanent: true,  
      },  
    \]  
  },  
}

module.exports \= nextConfig

### **Step 6: Setup Mobile-First Tailwind Configuration**

// tailwind.config.js  
/\*\* @type {import('tailwindcss').Config} \*/  
module.exports \= {  
  content: \[  
    './src/pages/\*\*/\*.{js,ts,jsx,tsx,mdx}',  
    './src/components/\*\*/\*.{js,ts,jsx,tsx,mdx}',  
    './src/app/\*\*/\*.{js,ts,jsx,tsx,mdx}',  
  \],  
  theme: {  
    extend: {  
      colors: {  
        // Monochrome theme colors  
        primary: '\#000000',  
        secondary: '\#6b7280',  
        accent: '\#1f2937',  
        background: '\#ffffff',  
        muted: '\#f9fafb',  
        // Mobile-specific colors  
        'touch-target': '\#f3f4f6', // Light gray for touch areas  
        'active-touch': '\#e5e7eb', // Darker gray for active states  
      },  
      fontFamily: {  
        sans: \['Inter', 'sans-serif'\],  
      },  
      spacing: {  
        // Mobile-friendly touch targets  
        'touch': '44px', // Minimum 44px for iOS/Android  
        'safe-top': 'env(safe-area-inset-top)',  
        'safe-bottom': 'env(safe-area-inset-bottom)',  
      },  
      height: {  
        // Mobile-specific heights  
        'mobile-header': '56px',  
        'bottom-nav': '64px',  
        'mobile-screen': 'calc(100vh \- 56px \- 64px)', // Screen minus header and nav  
      },  
      animation: {  
        // Mobile-friendly animations  
        'slide-up': 'slideUp 0.3s ease-out',  
        'slide-down': 'slideDown 0.3s ease-out',  
        'fade-in': 'fadeIn 0.2s ease-out',  
        'bounce-in': 'bounceIn 0.4s ease-out',  
      },  
      keyframes: {  
        slideUp: {  
          '0%': { transform: 'translateY(100%)', opacity: '0' },  
          '100%': { transform: 'translateY(0)', opacity: '1' },  
        },  
        slideDown: {  
          '0%': { transform: 'translateY(-100%)', opacity: '0' },  
          '100%': { transform: 'translateY(0)', opacity: '1' },  
        },  
        fadeIn: {  
          '0%': { opacity: '0' },  
          '100%': { opacity: '1' },  
        },  
        bounceIn: {  
          '0%': { transform: 'scale(0.3)', opacity: '0' },  
          '50%': { transform: 'scale(1.05)', opacity: '1' },  
          '100%': { transform: 'scale(1)', opacity: '1' },  
        },  
      },  
    },  
  },  
  plugins: \[  
    // Add custom mobile utilities  
    function({ addUtilities }) {  
      addUtilities({  
        '.touch-manipulation': {  
          'touch-action': 'manipulation',  
        },  
        '.no-scroll': {  
          'overflow': 'hidden',  
          'height': '100vh',  
        },  
        '.safe-area-padding': {  
          'padding-top': 'env(safe-area-inset-top)',  
          'padding-bottom': 'env(safe-area-inset-bottom)',  
          'padding-left': 'env(safe-area-inset-left)',  
          'padding-right': 'env(safe-area-inset-right)',  
        },  
      })  
    }  
  \],  
}

### **Step 7: Create Mobile-First UI Components**

\# Create essential mobile-first UI components  
touch src/components/ui/button.tsx         \# Touch-friendly buttons  
touch src/components/ui/input.tsx          \# Mobile-optimized inputs  
touch src/components/ui/card.tsx           \# Touch-friendly cards  
touch src/components/ui/badge.tsx

\# Create mobile-specific components  
touch src/components/mobile/bottom-navigation.tsx  
touch src/components/mobile/mobile-header.tsx  
touch src/components/mobile/floating-action-button.tsx  
touch src/components/mobile/swipe-carousel.tsx

### **Step 8: Setup Supabase Client**

\# Create Supabase configuration  
touch src/lib/supabase.ts  
touch src/lib/database.ts

## **🏗️ Phase 3: Development Phases**

### **Phase 3.1: Foundation Setup (Week 1\)**

**Goal: Get basic Next.js running with mobile-first layout**

**Tasks:**

1. ✅ Create project structure with mobile components  
2. ✅ Setup mobile-first UI components (touch-friendly buttons, cards)  
3. ✅ Create responsive layout components (Mobile Header, Bottom Navigation)  
4. ✅ Setup Supabase connection  
5. ✅ Implement mobile detection and responsive utilities  
6. ✅ Test `npm run dev` \- ensure mobile-first design works  
7. ✅ Test on multiple mobile devices/screen sizes

**Mobile-Specific Components to Build:**

* Bottom Navigation Bar (Home, Search, Categories, Profile)  
* Mobile Header with hamburger menu  
* Touch-friendly buttons (44px minimum)  
* Swipeable image carousel  
* Mobile search interface

**Deliverable:** Mobile-first homepage with bottom navigation

### **Phase 3.2: Authentication Phase (Week 2\)**

**Goal: Mobile-friendly Google authentication**

**Tasks:**

1. Setup Google Auth with Supabase (mobile-optimized flow)  
2. Create mobile-friendly login/logout UI  
3. Implement touch-friendly profile management  
4. Protect admin routes with mobile considerations  
5. Auth state management with mobile UX  
6. Test authentication flow on mobile devices

**Mobile Considerations:**

* Touch-friendly login buttons  
* Mobile-optimized Google sign-in popup  
* Responsive profile forms  
* Bottom navigation state management

**Deliverable:** Users can sign in with Google on mobile seamlessly

### **Phase 3.3: Database & Admin Phase (Week 3\)**

**Goal: Mobile-accessible admin panel**

**Tasks:**

1. Create Supabase tables (from schema document)  
2. Setup RLS policies  
3. Create responsive admin dashboard (works on tablets)  
4. Mobile-friendly business add/edit forms  
5. Touch-optimized category and area management  
6. Admin interface that works on mobile (for field management)

**Mobile Features:**

* Responsive admin tables  
* Touch-friendly form inputs  
* Mobile image upload interface  
* Swipe actions for admin tasks

**Deliverable:** Admin panel that works on mobile/tablet

### **Phase 3.4: Public Pages Phase (Week 4\)**

**Goal: Mobile-first public directory**

**Tasks:**

1. Mobile-optimized business pages (`/business/[slug]`)  
2. Touch-friendly category browsing (`/[category]`)  
3. Location-based pages (`/[location]`)  
4. Mobile search with filters  
5. Mobile-first SEO optimization  
6. Touch gestures and swipe interactions

**Mobile Features:**

* Swipeable business image galleries  
* One-tap actions (Call, Directions, Share)  
* Touch-friendly category grids  
* Mobile search with location detection  
* Bottom sheet filters  
* Pull-to-refresh functionality

**Deliverable:** Fully responsive public directory with native app feel

### **Phase 3.5: User Features Phase (Week 5\)**

**Goal: Mobile-first business owner and user experience**

**Tasks:**

1. Mobile-optimized business owner dashboard  
2. Touch-friendly claim business flow  
3. Mobile review system with touch interactions  
4. Mobile image upload with camera integration  
5. Touch-friendly business hours management  
6. Mobile sharing and social features

**Mobile Features:**

* Camera integration for business photos  
* Touch-friendly rating system (star ratings)  
* Mobile-optimized review forms  
* Share business via native mobile sharing  
* One-handed operation support

**Deliverable:** Complete mobile-first MVP ready for users

### **Phase 3.6: Mobile Optimization & Deployment (Week 6\)**

**Goal: Mobile-optimized live website**

**Tasks:**

1. Deploy to Vercel with mobile optimizations  
2. Setup custom domain with mobile redirects  
3. Mobile performance optimization (Core Web Vitals)  
4. Test on real mobile devices  
5. Mobile SEO audit and optimization  
6. PWA preparation (future web-view app)

**Mobile Optimizations:**

* Image optimization for mobile networks  
* Touch gesture performance  
* Mobile Core Web Vitals optimization  
* iOS Safari and Android Chrome testing  
* Mobile-specific meta tags

**Deliverable:** Lightning-fast mobile-first website ready for users

## **📱 Mobile-First Development Guidelines**

### **Mobile Design Patterns to Implement**

#### **Bottom Navigation (Core Mobile Pattern)**

┌─────────────────────────────────┐  
│           Content               │  
│                                 │  
│                                 │  
│                                 │  
├─────────────────────────────────┤  
│ \[🏠\] \[🔍\] \[📋\] \[📍\] \[👤\]     │ ← Bottom Navigation  
└─────────────────────────────────┘

#### **Touch Target Guidelines**

* **Minimum touch target**: 44px x 44px (iOS/Android standard)  
* **Recommended spacing**: 8px between touch targets  
* **Button heights**: 48px minimum for primary actions  
* **Input fields**: 56px height for comfortable typing

#### **Mobile-Specific Features to Include**

1. **Swipe Gestures**

   * Swipe between business images  
   * Swipe to reveal actions (call, directions)  
   * Pull-to-refresh on lists  
2. **One-Tap Actions**

   * Click-to-call phone numbers  
   * One-tap directions to business  
   * Quick share business functionality  
3. **Touch-Friendly Forms**

   * Large input fields with proper spacing  
   * Mobile-optimized keyboards (tel, email, search)  
   * Touch-friendly dropdowns and selectors  
4. **Mobile Navigation Patterns**

   * Bottom tab navigation for main sections  
   * Floating Action Button (FAB) for primary actions  
   * Hamburger menu for secondary options  
   * Back button behavior (browser back vs app back)

### **Mobile Performance Optimization**

#### **Image Optimization**

// next.config.js \- Mobile image optimization  
images: {  
  formats: \['image/webp', 'image/avif'\],  
  deviceSizes: \[320, 420, 768, 1024, 1200\],  
  imageSizes: \[16, 32, 48, 64, 96, 128, 256, 384\],  
}

#### **Loading Strategy**

* **Critical resources first**: Above-the-fold content  
* **Lazy loading**: Images and non-critical components  
* **Progressive enhancement**: Basic functionality first, enhanced features on capable devices

### **Mobile SEO Considerations**

#### **Mobile-First Indexing**

* Ensure mobile version has all important content  
* Same structured data on mobile and desktop  
* Mobile-friendly meta viewport tag  
* Touch-friendly interactive elements

#### **Local SEO for Mobile**

* Click-to-call phone numbers  
* Address markup for maps integration  
* Business hours in structured data  
* Location-based meta descriptions

### **Daily Workflow**

\# 1\. Start development  
npm run dev

\# 2\. Work on feature branch  
git checkout \-b feature/auth-setup

\# 3\. Make changes, test locally  
\# 4\. Commit and push  
git add .  
git commit \-m "Add Google authentication"  
git push origin feature/auth-setup

\# 5\. Merge to main when working  
git checkout main  
git merge feature/auth-setup

### **Testing Checklist (After Each Phase)**

* \[ \] `npm run dev` works without errors  
* \[ \] TypeScript compiles without errors  
* \[ \] All new pages load correctly on mobile and desktop  
* \[ \] Database connections work  
* \[ \] Authentication flows work on mobile devices  
* \[ \] **Mobile-specific testing:**  
  * \[ \] Touch targets are at least 44px  
  * \[ \] Bottom navigation works correctly  
  * \[ \] Swipe gestures function properly  
  * \[ \] Forms work with mobile keyboards  
  * \[ \] Click-to-call links work  
  * \[ \] Page loads fast on 3G networks  
  * \[ \] Works in iOS Safari and Android Chrome  
  * \[ \] Responsive design at all breakpoints (320px to 1200px+)  
  * \[ \] No horizontal scrolling on mobile  
* \[ \] Basic SEO elements present (mobile-optimized)  
* \[ \] Performance meets mobile Core Web Vitals

## **📋 First Steps Checklist**

### **Immediate Tasks (Day 1\)**

* \[ \] Run `npx create-next-app` command with mobile-first approach  
* \[ \] Install additional dependencies (including mobile libraries)  
* \[ \] Create folder structure with mobile/desktop component separation  
* \[ \] Setup environment variables  
* \[ \] Configure mobile-first Tailwind CSS  
* \[ \] Test `npm run dev` and view on mobile device/emulator  
* \[ \] Create basic mobile layout components (Bottom Navigation, Mobile Header)  
* \[ \] Test touch interactions and mobile responsiveness  
* \[ \] Push initial commit to GitHub

### **Week 1 Goals**

* \[ \] Mobile-first homepage with bottom navigation  
* \[ \] Touch-friendly, professional design  
* \[ \] Responsive layout that works perfectly on mobile  
* \[ \] Supabase connection established  
* \[ \] Mobile development workflow established  
* \[ \] Ready for mobile-first authentication phase

### **Mobile Testing Tools to Use**

* **Chrome DevTools**: Mobile device simulation  
* **Real devices**: iOS iPhone, Android phones  
* **Browser Testing**: iOS Safari, Android Chrome  
* **Performance**: Lighthouse mobile scores  
* **Network**: Test on slow 3G connections

---

**Remember:**

* **Mobile-first approach** \- Design for mobile, enhance for desktop  
* **Test on real devices** \- Simulators don't show real touch behavior  
* **Touch-friendly from day one** \- 44px minimum touch targets  
* **Performance matters** \- Mobile users expect fast loading  
* **One-handed operation** \- Keep important actions within thumb reach  
* **Native app feel** \- Smooth animations and responsive interactions

**Ready to build the perfect mobile-first business directory? Let's create Chittor Darpan\!**

