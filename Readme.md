# Opportunity Finders

A modern geospatial dashboard application built with Next.js, React, and MapLibre GL for visualizing and analyzing geographical data.

## 🚀 Features

- Interactive map visualization using MapLibre GL and deck.gl
- Real-time data processing and visualization
- Responsive design with modern UI components
- Data import/export capabilities
- Customizable map layers and controls
- Redux state management for complex data handling

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 14
- **UI Library**: React 18
- **State Management**: Redux Toolkit
- **Mapping**: MapLibre GL, deck.gl
- **UI Components**: Ant Design
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript
- **Code Quality**: ESLint, Husky
- **Package Management**: npm

## 📋 Prerequisites

- Node.js 20.18.0
- npm 10.8.2

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone [https://github.com/barikoi/SPL-GeoDashboard.git]
   cd SPL-GeoDashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Checkout branch**
   ```bash
   git checkout -b mcdonalds 
   ```

4. **Set up environment variables: Create a .env.local file in the root directory with the following variables:**
   ```bash
   NEXT_PUBLIC_BASE_URL=your_base_url
   NEXT_PUBLIC_BARIKOI_API_KEY=your_api_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
SPL-GeoDashboard/
├── app/                    # Next.js app directory
│   ├── fonts/              # Font assets
│   ├── images/             # Image assets
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Main page component
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Common/           # Shared components
│   ├── LeftPanel/        # Left panel components
│   └── MapComponent/     # Map-related components
├── store/                # Redux store configuration
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── public/              # Static assets
└── scripts/             # Build and utility scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run update-version` - Update project version

## 📦 Dependencies

### Main Dependencies
- @ant-design/icons - Icon library
- @deck.gl/geo-layers - Geospatial visualization
- @deck.gl/layers - Map layers
- @reduxjs/toolkit - State management
- @turf/turf - Geospatial analysis
- antd - UI components
- deck.gl - WebGL-powered visualization
- maplibre-gl - Map rendering
- next - React framework
- react-map-gl - React components for MapLibre GL

### Development Dependencies
- TypeScript
- ESLint
- Husky
- Tailwind CSS
- Various ESLint plugins and configurations

_*See the [System Workflow](system-workflow.md) for more details on the development process.*_

## 📚 API Documentation
See the [Api-Collection](api-collection.md) for full documentation on the API endpoints.

## Deployment Process
See the [Deployment Guide](deployment-process.md) for instructions on deploying the application.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔄 Version Control

The project uses conventional commits and includes commitlint for enforcing commit message standards.

## 🛡️ Security

- API keys and sensitive data should be stored in environment variables
- Follow security best practices when handling geospatial data
- Regular dependency updates for security patches

## 📈 Performance Optimization

- Code splitting with Next.js
- Optimized map rendering with deck.gl
- Efficient state management with Redux Toolkit
- Responsive design for various screen sizes

