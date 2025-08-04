# 🛠️ ScheduleBuddy Development Guide

## 🚀 Quick Start Development Workflow

### 1. **Local Development Setup**
```bash
# Start local development server
npm run dev         # Runs on http://localhost:3000
npm run lint        # Check for code issues
npm run type-check  # TypeScript validation
npm run test:build  # Test production build locally
```

### 2. **Feature Branch Workflow**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test locally
npm run dev
npm run lint

# Commit and push to create Vercel preview
git add .
git commit -m "✨ Add your feature description"
git push origin feature/your-feature-name
```

### 3. **Testing Strategy**

#### **Local Testing (Always First)**
- ✅ Test UI changes at http://localhost:3000
- ✅ Test form submissions work
- ✅ Test admin dashboard functionality
- ✅ Run `npm run build` to catch build errors early

#### **Preview Deployment Testing**
- 🌐 Vercel automatically creates preview URLs for feature branches
- 🧪 Test with real data and API calls
- 📱 Test on mobile devices
- 🔗 Share preview links with team for feedback

#### **Pre-Production Checklist**
- [ ] Local development server works
- [ ] Build completes without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript validation passes (`npm run type-check`)
- [ ] Preview deployment tested
- [ ] Mobile responsiveness verified

### 4. **Deployment Process**

```bash
# After feature is tested and approved
git checkout main
git merge feature/your-feature-name
git push origin main  # 🚀 Auto-deploys to production
```

## 🔧 Environment Management

### **Local Development**
- Uses `.env.local` for local API keys and configuration
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000`

### **Preview Deployments**
- Use production API keys but safe test data
- Automatically created for any non-main branch

### **Production**
- Environment variables managed in Vercel dashboard
- `NEXT_PUBLIC_BASE_URL=https://www.schedulebuddy.co`

## 🐛 Common Development Issues & Solutions

### **JSX Escaping (Recently Fixed)**
- ❌ `You're` → ✅ `You&apos;re`
- ❌ `"quoted"` → ✅ `&ldquo;quoted&rdquo;`

### **Build Failures**
```bash
# Check for TypeScript errors
npm run type-check

# Fix linting issues
npm run lint:fix

# Test production build locally
npm run build
```

### **Environment Variable Issues**
1. Check `.env.local` exists and has all required keys
2. Restart dev server after env changes
3. Verify Vercel dashboard has production env vars

## 📝 Git Commit Guidelines

### **Commit Message Format**
```bash
git commit -m "✨ Add new admin dashboard feature"
git commit -m "🐛 Fix participant form validation"
git commit -m "🎨 Improve mobile responsiveness"
git commit -m "🔧 Update build configuration"
git commit -m "📝 Update documentation"
```

### **Branch Naming**
- `feature/admin-improvements`
- `fix/form-validation-bug`
- `update/ui-styling`
- `hotfix/critical-api-issue`

## 🎯 Development Tools & Scripts

### **Available Scripts**
```bash
npm run dev          # Local development server
npm run build        # Production build
npm run start        # Start production server locally
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript validation
npm run test:build   # Build + start for testing
```

### **Recommended VS Code Extensions**
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Auto Rename Tag
- Prettier - Code formatter

## 🚀 When Working with AI Assistant (Cursor)

### **Before Making Changes**
1. Explain what you want to achieve
2. Ask for the development approach
3. Request local testing instructions

### **During Development**
1. Test changes locally first
2. Ask for lint/build checks
3. Request help with TypeScript errors

### **Before Deployment**
1. Review all changes together
2. Run complete testing checklist
3. Plan the deployment approach

---

*This guide ensures safe, reliable development and deployment of ScheduleBuddy features.* 