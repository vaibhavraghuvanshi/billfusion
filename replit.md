# replit.md

## Overview

InvoiceFlow is a modern invoice and payment tracking SAAS application designed for freelancers and small businesses. The application features a glass-morphism UI design and provides comprehensive invoice management, client management, and payment processing capabilities. Built with React.js frontend and Express.js backend, it offers both web and PWA functionality with real-time features and offline support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing with protected routes for authenticated users
- **State Management**: TanStack React Query for server state management and caching
- **UI Framework**: Radix UI components with custom glass-morphism styling using Tailwind CSS
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for API development
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Storage**: In-memory storage implementation with interface for easy database migration
- **Session Management**: Express sessions for user authentication
- **API Design**: RESTful API with structured error handling and logging middleware

### Authentication System
- **Firebase Authentication**: Multi-provider authentication supporting Google and GitHub OAuth, plus email/password
- **Session-based**: Server-side session management with user context
- **Protected Routes**: Client-side route protection with loading states

### Database Schema Design
- **Users**: Profile information, business details, and subscription status
- **Clients**: Contact management with company information and notes
- **Invoices**: Comprehensive invoice data with line items, status tracking, and payment information
- **Payments**: Transaction records with gateway integration support

### UI/UX Design System
- **Glass-morphism Theme**: Semi-transparent cards with backdrop-blur effects
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Color Palette**: Blue-purple gradients with semantic color coding for status indicators
- **Component Library**: Custom components built on Radix UI primitives with consistent styling

### Progressive Web App Features
- **Service Worker**: Offline functionality with cache strategies for static assets and API responses
- **Web App Manifest**: Installable app experience with proper metadata
- **Background Sync**: Offline invoice creation with sync when online

## External Dependencies

### Core Development
- **React Ecosystem**: React 18, React Router (Wouter), React Hook Form, React Query
- **UI Components**: Radix UI component library, Lucide React icons
- **Styling**: Tailwind CSS, Class Variance Authority for component variants
- **Build Tools**: Vite, TypeScript, ESBuild for production builds

### Authentication & Database
- **Firebase**: Authentication service with multi-provider support
- **PostgreSQL**: Primary database with Neon serverless hosting
- **Drizzle ORM**: Type-safe database operations with migration support
- **Connect PG Simple**: PostgreSQL session store

### Payment Processing
- **Razorpay**: Payment processing with Razorpay integration for Indian market
- **Webhook Support**: Payment status updates and subscription management
- **Payment Verification**: Secure signature verification for payment confirmation

### Development & Deployment
- **Replit**: Development environment with custom plugins
- **Node.js**: Runtime environment with ES modules support
- **Environment Variables**: Configuration for database, Stripe, and Firebase credentials

### Additional Integrations
- **Date Handling**: date-fns for date manipulation and formatting
- **Form Validation**: Zod schema validation
- **Toast Notifications**: Custom toast system for user feedback
- **PWA Support**: Service workers and manifest for offline functionality