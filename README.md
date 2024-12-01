# OmniDoc - AI-Powered PDF Analysis Tool

OmniDoc is a sophisticated desktop-focused PDF viewer and analysis tool that combines modern document viewing capabilities with AI-powered features for enhanced document understanding.

## 🌟 Features

- **Advanced PDF Viewing**
  - Modern, responsive PDF viewer with intuitive controls
  - Dynamic Table of Contents generation
  - Page thumbnails for quick navigation
  - Collapsible sidebar for better workspace management

- **AI-Powered Analysis**
  - **Key Concepts Highlighting**: Automatically identifies and categorizes important concepts
  - **Smart Summaries**: Generates concise, structured summaries of document sections
  - **Interactive Flashcards**: Auto-generated study aids from document content
  - **Context-Aware Chat**: Intelligent document-based Q&A with citations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Modern web browser (Chrome, Firefox, Safari)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/omnidoc.git
   cd omnidoc
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, ShadcnUI
- **State Management**: Zustand
- **PDF Processing**: PDF.js
- **AI Integration**: OpenAI API
- **Animations**: Framer Motion

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                 # Utility functions
├── stores/             # Zustand stores
└── types/              # TypeScript types
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [OpenAI](https://openai.com/) for AI capabilities
- [ShadcnUI](https://ui.shadcn.com/) for UI components
