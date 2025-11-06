# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Inspire Hub is a comprehensive tenant management platform for co-working spaces and office rentals. The system manages three types of services: Dedicated Desks, Private Offices, and Virtual Offices, with features including billing automation, contract generation, and seat/office management.

## Development Commands

### Core Development
```bash
# Start development server with Turbopack (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Package Management
```bash
# Install dependencies
npm install

# Alternative package managers also available
yarn install
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.3.1 with App Router
- **Frontend**: React 19, Material-UI (MUI), Emotion (styling)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Styling**: TailwindCSS 4, Emotion for component styling
- **Document Processing**: DocxTemplater, PDF-lib, jsPDF
- **Email Services**: EmailJS for notifications
- **Charts/Analytics**: Recharts, D3.js libraries
- **Build Tools**: ESLint, Turbopack for dev server

### Project Structure
```
src/app/
├── (admin)/           # Admin dashboard routes (protected)
│   ├── billing/       # Billing management system
│   ├── tenants/       # Tenant management
│   ├── contract-templates/ # Contract template management
│   ├── components/    # Admin-specific components
│   └── utils/         # Admin utilities (billingService, etc.)
├── (dashboard)/       # User dashboard routes
├── (landing)/         # Landing page routes
└── api/              # API routes
```

### Key Systems

#### 1. Multi-Tenant Management
The system manages three distinct tenant types:
- **Dedicated Desk**: Individual desk rentals with seat mapping
- **Private Office**: Private office spaces
- **Virtual Office**: Virtual office services

#### 2. Automated Billing System
- Monthly billing generation for all tenant types
- Payment status tracking (pending, paid, overdue)
- Email notifications via EmailJS
- VAT calculations (12%)
- Multiple payment methods support

#### 3. Contract Generation
- Dynamic contract templates with variable replacement
- Multiple output formats (Text, PDF, Word)
- Template variables for tenant, billing, and contract details
- Real-time preview functionality

#### 4. Seat/Office Management
- Interactive floor plan mapping
- Seat positioning tools
- Meeting room management
- Visual seat/office selection

## Firebase Configuration

### Services Used
- **Firestore**: Primary database for tenants, billing, contracts
- **Authentication**: User authentication and role management
- **Storage**: File storage for documents and images

### Key Collections
- `seatMap` - Dedicated desk tenants
- `privateOffice` - Private office tenants
- `virtualOffice` - Virtual office tenants
- `billing` - Monthly billing records
- `contractTemplates` - Contract templates

## Environment Variables

Required environment variables (add to `.env.local`):
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
NEXT_PUBLIC_EMAILJS_TEMPLATE_MONTHLY_BILLING_ID=template_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_OVERDUE_BILLING_ID=template_id

# Debug Mode (optional)
NEXT_PUBLIC_BILLING_DEBUG=true
```

## Development Guidelines

### Path Aliases
- `@/*` maps to `./src/*` (configured in jsconfig.json)

### Route Groups
The app uses Next.js route groups for organization:
- `(admin)` - Admin-only routes with authentication
- `(dashboard)` - User dashboard routes
- `(landing)` - Public landing pages

### Component Organization
- Shared components in `src/app/(admin)/components/`
- Route-specific components within their respective directories
- Utility functions in `src/app/(admin)/utils/`

### Styling Approach
- TailwindCSS for utility-first styling
- Material-UI components for consistent design system
- Emotion for styled components where needed

## Key Business Logic

### Billing Calculations
```javascript
// Standard calculation formula
baseAmount = rate × quantity
subtotal = baseAmount + cusaFee + parkingFee
vat = subtotal × 0.12
total = subtotal + vat
```

### Contract Template Variables
Use `{{variable.name}}` syntax for dynamic content:
- `{{tenant.name}}`, `{{tenant.company}}`, `{{tenant.email}}`
- `{{contract.startDate}}`, `{{contract.endDate}}`
- `{{billing.monthlyRate}}`, `{{billing.totalAmount}}`
- `{{system.companyName}}`, `{{date.today}}`

## Testing and Debugging

### Common Debug Areas
1. **Billing System**: Check `billingService.js` for billing logic
2. **Contract Generation**: Verify template variables in contract components
3. **Firebase Connection**: Test Firestore rules and authentication
4. **Email Notifications**: Validate EmailJS configuration

### Debug Mode
Enable detailed logging by setting `NEXT_PUBLIC_BILLING_DEBUG=true`

## Deployment Notes

### Production Considerations
- Verify Firebase security rules for production
- Set up automated billing generation (cron jobs or cloud functions)
- Configure proper email service limits
- Implement proper backup strategies for billing data

### Build Optimization
- Uses Turbopack in development for faster builds
- TailwindCSS 4 for optimized styling
- Next.js 15 with App Router for performance

## Security Considerations

### Data Protection
- Billing records contain sensitive financial information
- Implement proper role-based access control
- Never store payment card details in the application
- Use Firebase security rules for data access control

### Admin Access
- Admin routes are protected with authentication
- Billing management restricted to admin users only
- Audit trails for sensitive operations
