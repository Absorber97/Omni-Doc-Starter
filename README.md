# 🔮 OmniDoc: AI-Powered Doc (Starter MVP)

OmniDoc is a sophisticated desktop-focused PDF viewer and analysis tool that combines modern document viewing capabilities with AI-powered features for enhanced document understanding and learning. Perfect for students, faculty,researchers, and professionals who need to deeply understand complex documents.


## 🌟 Key Features

### 📚 Advanced PDF Viewing
- **Modern Viewer Interface**
  - Responsive and intuitive PDF viewing experience
  - Smooth zooming and panning controls
  - Multiple view modes (single page, continuous, etc.)
  - Dark mode focus

![Upload](https://github.com/Absorber97/Omni-Doc-Starter/blob/main/assets/Upload.png)

- **Smart Navigation**
  - Dynamic Table of Contents generation and navigation
  - Interactive page thumbnails for quick browsing

![Navigation](https://github.com/Absorber97/Omni-Doc-Starter/blob/main/assets/Navigation.png)

### 🤖 AI-Powered Analysis
- **Key Concepts Highlighting**
  - Automatic identification of important concepts
  - Categorization into "must-know", "good-to-know", and "optional"
  - Interactive concept exploration
  - Visual concept mapping

![Key Concepts](https://github.com/Absorber97/Omni-Doc-Starter/blob/main/assets/Key%20Concepts.png)

- **Smart Summaries**
  - Hierarchical document summarization
  - Section-by-section breakdown
  - Key points extraction
  - Custom summary generation based on focus areas

![Summaries](https://github.com/Absorber97/Omni-Doc-Starter/blob/main/assets/Summary.png)

- **Interactive Flashcards**
  - Auto-generated study materials
  - Spaced repetition system
  - Progress tracking
 
![Flashcards](https://github.com/Absorber97/Omni-Doc-Starter/blob/main/assets/Flashcards.png)

- **Context-Aware Chat**
  - Intelligent document-based Q&A
  - Context-aware smart suggestions
  - Citation support with page references
  - Natural language query processing
  - Multi-document context support

![Chat](https://github.com/Absorber97/Omni-Doc-Starter/blob/main/assets/Chat.png)

## 🚀 Getting Started

### Prerequisites

1. **Node.js Installation**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **OpenAI API Key**
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Generate API key in your dashboard

### Installation

1. **Clone the Repository**
   ```bash
   git clone [repo-url]
   cd omnidoc
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Configure your `.env` file:
   ```env
   OPENAI_API_KEY=your_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   PDF_STORAGE_PATH=./storage/pdfs
   # Add other necessary environment variables
   ```

4. **Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Default login credentials (if applicable)

## 🛠️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript 5.0+
- **Styling**: 
  - Tailwind CSS for utility-first styling
  - CSS Modules for component-specific styles
- **State Management**: 
  - Zustand for global state
  - React Query for server state
- **PDF Processing**: 
  - PDF.js for rendering
  - Custom PDF content extraction
- **Animations**: Framer Motion

### Key Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "zustand": "^4.0.0",
  "pdfjs-dist": "^3.0.0",
  "framer-motion": "^10.0.0"
}
```

## 📁 Project Structure

```
.
├── app/                      # Next.js 14 app directory
│   ├── editor/              # PDF editor pages
│   ├── upload/              # File upload pages
│   ├── fonts/               # Custom font files
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Home page component
│
├── components/              # React components
│   ├── ai/                 # AI-related components
│   ├── layout/             # Layout components
│   ├── pdf/                # PDF viewer components
│   └── ui/                 # Reusable UI components
│
├── lib/                    # Core library code
│   ├── api/               # API integration
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Service layer
│   ├── store/             # State management
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   ├── constants.ts       # Global constants
│   ├── embeddings-store.ts # Embeddings management
│   ├── pdf-processing.ts  # PDF processing logic
│   └── utils.ts           # General utilities
│
├── config/                 # Configuration files
├── hooks/                  # Global hooks
├── public/                 # Static assets
├── scripts/               # Build/deployment scripts
├── styles/                # Global styles
├── types/                 # Global TypeScript types
│
├── .env.example           # Environment variables template
├── .env.local            # Local environment variables
├── components.json       # UI components config
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies
├── postcss.config.mjs    # PostCSS configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

### Key Directories

- **`app/`**: Next.js 14 app router implementation with page components and layouts
- **`components/`**: Reusable React components organized by domain
- **`lib/`**: Core application logic, utilities, and services
- **`config/`**: Configuration files for various services and features
- **`hooks/`**: Shared React hooks for common functionality
- **`public/`**: Static assets like images and fonts
- **`styles/`**: Global styles and theme configurations
- **`types/`**: Global TypeScript type definitions

### Notable Files

- **`lib/pdf-processing.ts`**: Core PDF processing and analysis logic
- **`lib/embeddings-store.ts`**: Document embeddings management
- **`lib/constants.ts`**: Global application constants
- **`tailwind.config.ts`**: Tailwind CSS styling configuration
- **`next.config.js`**: Next.js framework configuration

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/NewFeature`
3. Make changes and test
4. Commit with conventional commits: `git commit -m 'feat: add new feature'`
5. Push changes: `git push origin feature/NewFeature`
6. Open Pull Request

### Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Follow TypeScript strict mode guidelines
- Write unit tests for new features

## 📈 Performance Optimization

- Lazy loading of PDF pages
- Caching of processed documents
- Optimized AI request batching
- Progressive web app capabilities
- Service worker implementation

## 🔒 Security

- API key encryption
- PDF content sanitization
- Rate limiting implementation
- CORS policy configuration
- Data encryption at rest

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering engine
- [OpenAI](https://openai.com/) - AI capabilities
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Next.js](https://nextjs.org/) - React framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Framer Motion](https://www.framer.com/motion/) - Animations

## 🚨 Current Limitations

This is an MVP (Minimum Viable Product) version focused on establishing a scalable foundation for future development. Due to time constraints, there are several known limitations:

### Storage Limitations
- All feature data is currently stored in local browser storage for persistence
- To test with a new PDF, you'll need to clear temporary stored data first
- No cloud storage integration in this version

### Performance Considerations
- Each feature requires initial PDF data extraction and embedding process
- Subsequent uses load from stored temporary data
- Data flow between features needs optimization for better UX
- Feature pipeline needs streamlining for better performance

### Device Support
- Currently optimized for desktop screens only (>1100px width)
- Shows "not supported" message on smaller screens

### Future Improvement Ideas
- Cloud-based storage integration
- Optimized data processing pipeline
- Responsive design for all screen sizes
- Streamlined feature data flow
- Enhanced error handling and recovery
- Cross-platform support

> **Note**: This project serves as a foundation for future enhancements. While fully functional for its core purpose, it's designed with scalability in mind rather than immediate feature completeness.
