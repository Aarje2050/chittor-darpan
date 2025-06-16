# **Supabase Database Schema \- Foundational Design Document**

## **🎯 Schema Philosophy & Architecture**

### **Core Design Principles**

* **Feature Isolation**: Each major feature gets its own schema  
* **Shared Foundation**: Common data in public schema for cross-feature access  
* **Security First**: RLS enabled on all tables from day one  
* **Scalable Structure**: Add new features without touching existing tables  
* **Simple Relationships**: Clear foreign keys between schemas

### **Schema Organization Strategy**

public              \# Core shared data (users, locations, categories)  
business\_directory  \# All business-related tables (MVP)  
jobs               \# Jobs portal tables (future)  
events             \# Events platform tables (future)  
news               \# Local news tables (future)  
analytics          \# Analytics and tracking tables (future)  
ai                 \# AI recommendations and ML data (future)

## **📋 Core Schema (public) \- Shared Foundation**

### **User Management**

\-- User profiles (extends Supabase auth.users)  
CREATE TABLE public.profiles (  
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  
  email text NOT NULL,  
  full\_name text,  
  phone text,  
  avatar\_url text,  
  user\_type text DEFAULT 'user' CHECK (user\_type IN ('user', 'business\_owner', 'admin')),  
  is\_verified boolean DEFAULT false,  
  created\_at timestamptz DEFAULT now(),  
  updated\_at timestamptz DEFAULT now()  
);

\-- User preferences for AI personalization  
CREATE TABLE public.user\_preferences (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  user\_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,  
  preferences jsonb DEFAULT '{}',  
  location\_preferences jsonb DEFAULT '{}',  
  created\_at timestamptz DEFAULT now(),  
  updated\_at timestamptz DEFAULT now()  
);

### **Location System**

\-- Cities (Chittorgarh, Udaipur, etc.)  
CREATE TABLE public.cities (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  name text NOT NULL,  
  slug text UNIQUE NOT NULL, \-- 'chittorgarh', 'udaipur'  
  state text NOT NULL DEFAULT 'Rajasthan',  
  pincode text\[\],  
  latitude decimal(10,8),  
  longitude decimal(11,8),  
  is\_active boolean DEFAULT true,  
  created\_at timestamptz DEFAULT now()  
);

\-- Areas within cities (Pratap Nagar, Gandhi Nagar)  
CREATE TABLE public.areas (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  city\_id uuid REFERENCES public.cities(id) ON DELETE CASCADE,  
  name text NOT NULL,  
  slug text NOT NULL, \-- 'pratap-nagar'  
  description text,  
  is\_active boolean DEFAULT true,  
  created\_at timestamptz DEFAULT now(),  
  UNIQUE(city\_id, slug)  
);

\-- Landmarks within areas (Near Bus Stand, Fowara Chowk)  
CREATE TABLE public.landmarks (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  area\_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,  
  name text NOT NULL,  
  slug text NOT NULL, \-- 'near-bus-stand'  
  description text,  
  latitude decimal(10,8),  
  longitude decimal(11,8),  
  is\_active boolean DEFAULT true,  
  created\_at timestamptz DEFAULT now(),  
  UNIQUE(area\_id, slug)  
);

### **Universal Category System**

\-- Categories used across all features  
CREATE TABLE public.categories (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  name text NOT NULL,  
  slug text UNIQUE NOT NULL,  
  description text,  
  feature\_type text NOT NULL CHECK (feature\_type IN ('business', 'job', 'event', 'news')),  
  parent\_id uuid REFERENCES public.categories(id),  
  icon\_name text, \-- Lucide icon name  
  is\_active boolean DEFAULT true,  
  sort\_order integer DEFAULT 0,  
  created\_at timestamptz DEFAULT now()  
);

\-- Flexible tagging system  
CREATE TABLE public.tags (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  name text UNIQUE NOT NULL,  
  slug text UNIQUE NOT NULL,  
  color text DEFAULT '\#000000',  
  created\_at timestamptz DEFAULT now()  
);

### **Media Management**

\-- Universal media storage  
CREATE TABLE public.media\_files (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  url text NOT NULL,  
  file\_name text NOT NULL,  
  file\_size integer,  
  mime\_type text,  
  alt\_text text,  
  entity\_type text NOT NULL, \-- 'business', 'event', 'job', 'news'  
  entity\_id uuid NOT NULL,  
  uploaded\_by uuid REFERENCES public.profiles(id),  
  is\_active boolean DEFAULT true,  
  created\_at timestamptz DEFAULT now()  
);

## **🏢 Business Directory Schema \- MVP Implementation**

### **Core Business Tables**

\-- Create business\_directory schema  
CREATE SCHEMA IF NOT EXISTS business\_directory;

\-- Business listings  
CREATE TABLE business\_directory.businesses (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  name text NOT NULL,  
  slug text UNIQUE NOT NULL,  
  description text,  
  owner\_id uuid REFERENCES public.profiles(id),  
    
  \-- Location  
  city\_id uuid REFERENCES public.cities(id),  
  area\_id uuid REFERENCES public.areas(id),  
  landmark\_id uuid REFERENCES public.landmarks(id),  
  address text NOT NULL,  
  latitude decimal(10,8),  
  longitude decimal(11,8),  
    
  \-- Contact Information  
  phone text\[\],  
  email text,  
  website text,  
  whatsapp text,  
    
  \-- Business Details  
  established\_year integer,  
  employee\_count text CHECK (employee\_count IN ('1-10', '11-50', '51-200', '200+')),  
    
  \-- Status & Visibility  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'suspended')),  
  is\_featured boolean DEFAULT false,  
  is\_verified boolean DEFAULT false,  
    
  \-- SEO  
  meta\_title text,  
  meta\_description text,  
    
  \-- Timestamps  
  created\_at timestamptz DEFAULT now(),  
  updated\_at timestamptz DEFAULT now(),  
  published\_at timestamptz  
);

\-- Business categories (many-to-many)  
CREATE TABLE business\_directory.business\_categories (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  business\_id uuid REFERENCES business\_directory.businesses(id) ON DELETE CASCADE,  
  category\_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,  
  is\_primary boolean DEFAULT false,  
  created\_at timestamptz DEFAULT now(),  
  UNIQUE(business\_id, category\_id)  
);

\-- Business tags (many-to-many)  
CREATE TABLE business\_directory.business\_tags (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  business\_id uuid REFERENCES business\_directory.businesses(id) ON DELETE CASCADE,  
  tag\_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,  
  created\_at timestamptz DEFAULT now(),  
  UNIQUE(business\_id, tag\_id)  
);

### **Business Operations**

\-- Business hours  
CREATE TABLE business\_directory.business\_hours (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  business\_id uuid REFERENCES business\_directory.businesses(id) ON DELETE CASCADE,  
  day\_of\_week integer NOT NULL CHECK (day\_of\_week BETWEEN 0 AND 6), \-- 0=Sunday  
  opens\_at time,  
  closes\_at time,  
  is\_closed boolean DEFAULT false,  
  created\_at timestamptz DEFAULT now(),  
  UNIQUE(business\_id, day\_of\_week)  
);

\-- Business images  
CREATE TABLE business\_directory.business\_images (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  business\_id uuid REFERENCES business\_directory.businesses(id) ON DELETE CASCADE,  
  media\_file\_id uuid REFERENCES public.media\_files(id) ON DELETE CASCADE,  
  image\_type text DEFAULT 'gallery' CHECK (image\_type IN ('logo', 'cover', 'gallery')),  
  sort\_order integer DEFAULT 0,  
  created\_at timestamptz DEFAULT now()  
);

### **Reviews & Ratings**

\-- Business reviews  
CREATE TABLE business\_directory.reviews (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  business\_id uuid REFERENCES business\_directory.businesses(id) ON DELETE CASCADE,  
  user\_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,  
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),  
  title text,  
  content text,  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),  
  is\_verified boolean DEFAULT false,  
  created\_at timestamptz DEFAULT now(),  
  updated\_at timestamptz DEFAULT now(),  
  UNIQUE(business\_id, user\_id) \-- One review per user per business  
);

\-- Review replies (business owner responses)  
CREATE TABLE business\_directory.review\_replies (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  review\_id uuid REFERENCES business\_directory.reviews(id) ON DELETE CASCADE,  
  business\_id uuid REFERENCES business\_directory.businesses(id) ON DELETE CASCADE,  
  content text NOT NULL,  
  replied\_by uuid REFERENCES public.profiles(id),  
  created\_at timestamptz DEFAULT now(),  
  updated\_at timestamptz DEFAULT now()  
);

## **🔒 Row Level Security (RLS) Policies**

### **Public Schema Policies**

\-- Profiles  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"  
  ON public.profiles FOR SELECT  
  USING (true);

CREATE POLICY "Users can update their own profile"  
  ON public.profiles FOR UPDATE  
  USING (auth.uid() \= id);

\-- Cities, Areas, Landmarks (public read)  
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;   
ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are publicly readable"  
  ON public.cities FOR SELECT  
  USING (is\_active \= true);

CREATE POLICY "Areas are publicly readable"  
  ON public.areas FOR SELECT  
  USING (is\_active \= true);

CREATE POLICY "Landmarks are publicly readable"  
  ON public.landmarks FOR SELECT  
  USING (is\_active \= true);

\-- Categories and Tags (public read)  
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"  
  ON public.categories FOR SELECT  
  USING (is\_active \= true);

CREATE POLICY "Tags are publicly readable"  
  ON public.tags FOR SELECT  
  USING (true);

### **Business Directory Policies**

\-- Businesses  
ALTER TABLE business\_directory.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published businesses are publicly viewable"  
  ON business\_directory.businesses FOR SELECT  
  USING (status \= 'published');

CREATE POLICY "Business owners can manage their businesses"  
  ON business\_directory.businesses FOR ALL  
  USING (auth.uid() \= owner\_id);

CREATE POLICY "Admins can manage all businesses"  
  ON business\_directory.businesses FOR ALL  
  USING (  
    EXISTS (  
      SELECT 1 FROM public.profiles   
      WHERE id \= auth.uid() AND user\_type \= 'admin'  
    )  
  );

\-- Reviews  
ALTER TABLE business\_directory.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published reviews are publicly viewable"  
  ON business\_directory.reviews FOR SELECT  
  USING (status \= 'published');

CREATE POLICY "Users can create reviews"  
  ON business\_directory.reviews FOR INSERT  
  WITH CHECK (auth.uid() \= user\_id);

CREATE POLICY "Users can update their own reviews"  
  ON business\_directory.reviews FOR UPDATE  
  USING (auth.uid() \= user\_id);

\-- Business Hours  
ALTER TABLE business\_directory.business\_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business hours are publicly viewable"  
  ON business\_directory.business\_hours FOR SELECT  
  USING (  
    EXISTS (  
      SELECT 1 FROM business\_directory.businesses b  
      WHERE b.id \= business\_id AND b.status \= 'published'  
    )  
  );

CREATE POLICY "Business owners can manage their hours"  
  ON business\_directory.business\_hours FOR ALL  
  USING (  
    EXISTS (  
      SELECT 1 FROM business\_directory.businesses b  
      WHERE b.id \= business\_id AND b.owner\_id \= auth.uid()  
    )  
  );

## **📊 Database Indexes for Performance**

### **Core Indexes**

\-- Profiles  
CREATE INDEX idx\_profiles\_user\_type ON public.profiles(user\_type);  
CREATE INDEX idx\_profiles\_email ON public.profiles(email);

\-- Location indexes  
CREATE INDEX idx\_areas\_city\_id ON public.areas(city\_id);  
CREATE INDEX idx\_landmarks\_area\_id ON public.landmarks(area\_id);  
CREATE INDEX idx\_cities\_slug ON public.cities(slug);  
CREATE INDEX idx\_areas\_slug ON public.areas(slug);

\-- Categories  
CREATE INDEX idx\_categories\_feature\_type ON public.categories(feature\_type);  
CREATE INDEX idx\_categories\_parent\_id ON public.categories(parent\_id);

### **Business Directory Indexes**

\-- Businesses  
CREATE INDEX idx\_businesses\_status ON business\_directory.businesses(status);  
CREATE INDEX idx\_businesses\_city\_id ON business\_directory.businesses(city\_id);  
CREATE INDEX idx\_businesses\_area\_id ON business\_directory.businesses(area\_id);  
CREATE INDEX idx\_businesses\_owner\_id ON business\_directory.businesses(owner\_id);  
CREATE INDEX idx\_businesses\_slug ON business\_directory.businesses(slug);  
CREATE INDEX idx\_businesses\_created\_at ON business\_directory.businesses(created\_at DESC);

\-- Text search index  
CREATE INDEX idx\_businesses\_search ON business\_directory.businesses   
  USING gin(to\_tsvector('english', name || ' ' || coalesce(description, '')));

\-- Reviews  
CREATE INDEX idx\_reviews\_business\_id ON business\_directory.reviews(business\_id);  
CREATE INDEX idx\_reviews\_user\_id ON business\_directory.reviews(user\_id);  
CREATE INDEX idx\_reviews\_status ON business\_directory.reviews(status);  
CREATE INDEX idx\_reviews\_rating ON business\_directory.reviews(rating);

## **🚀 Future Schema Expansion Plan**

### **Jobs Schema (Phase 2\)**

CREATE SCHEMA IF NOT EXISTS jobs;

\-- Will reference public.profiles, public.categories, public.areas  
CREATE TABLE jobs.listings (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  title text NOT NULL,  
  company\_name text NOT NULL,  
  category\_id uuid REFERENCES public.categories(id),  
  area\_id uuid REFERENCES public.areas(id),  
  posted\_by uuid REFERENCES public.profiles(id),  
  \-- ... job-specific fields  
);

### **Events Schema (Phase 3\)**

CREATE SCHEMA IF NOT EXISTS events;

CREATE TABLE events.events (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  title text NOT NULL,  
  category\_id uuid REFERENCES public.categories(id),  
  area\_id uuid REFERENCES public.areas(id),  
  organizer\_id uuid REFERENCES public.profiles(id),  
  \-- ... event-specific fields  
);

### **Analytics Schema (Phase 4\)**

CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE analytics.page\_views (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  user\_id uuid REFERENCES public.profiles(id),  
  entity\_type text NOT NULL,  
  entity\_id uuid NOT NULL,  
  \-- ... analytics fields  
);

## **📝 Implementation Order**

### **Phase 1: Core Setup (MVP)**

1. Create public schema tables (profiles, cities, areas, categories)  
2. Create business\_directory schema  
3. Implement basic RLS policies  
4. Add essential indexes

### **Phase 2: Business Features**

1. Add business hours and images tables  
2. Implement reviews system  
3. Add search indexes  
4. Refine RLS policies

### **Phase 3: Performance & Scale**

1. Add advanced indexes  
2. Implement analytics tracking  
3. Add caching policies  
4. Performance monitoring

### **Phase 4: Future Features**

1. Add new feature schemas as needed  
2. Cross-reference existing public schema  
3. Maintain isolation between features

## **🛠️ Migration Commands**

### **Initial Setup**

\-- Enable extensions  
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\-- Create custom schemas  
CREATE SCHEMA IF NOT EXISTS business\_directory;

\-- Run table creation scripts in order:  
\-- 1\. Public schema tables  
\-- 2\. Business directory tables  
\-- 3\. RLS policies  
\-- 4\. Indexes

### **Data Seeding**

\-- Insert default city (Chittorgarh)  
INSERT INTO public.cities (name, slug, state)   
VALUES ('Chittorgarh', 'chittorgarh', 'Rajasthan');

\-- Insert common business categories  
INSERT INTO public.categories (name, slug, feature\_type) VALUES  
('Restaurants', 'restaurants', 'business'),  
('Hotels', 'hotels', 'business'),  
('Shops', 'shops', 'business'),  
('Services', 'services', 'business');

---

**Key Benefits of This Schema Design:**

✅ **Feature Isolation**: Each feature has its own namespace  
 ✅ **Shared Foundation**: Common data accessible across features  
 ✅ **Security First**: RLS policies protect sensitive data  
 ✅ **Performance Optimized**: Strategic indexes for fast queries  
 ✅ **Scalable Architecture**: Add features without breaking existing structure  
 ✅ **SEO Friendly**: Proper slugs and text search capabilities

This schema provides a solid foundation for your business directory MVP while being ready to scale into a complete city platform.

