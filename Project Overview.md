## **Project Overview: OmniDoc - AI-Powered PDF Editor**

**OmniDoc** is a high-end, dark-mode PDF editor designed for desktop screens, focusing on seamless integration of AI capabilities to enhance document interaction. The platform combines a modular UI with smart AI-powered features, enabling users to efficiently navigate and understand PDFs. The application prioritizes a modern user experience with sleek animations and intuitive interfaces, powered by cutting-edge technologies.

---

## **MVP Features**

### **1. PDF Upload and Parsing**
- **Description**: Users can upload PDF files, which are parsed to extract text, metadata, and structural elements.
- **Capabilities**:
  - Process and display PDF content in an interactive editor.
  - Identify and handle image-based text using OCR (Tesseract).

### **2. Basic Navigation Tools**
- **Description**: Essential navigation features to help users browse and explore the PDF.
- **Components**:
  - **Table of Contents (TOC)**: Generated dynamically based on the document structure.
  - **Page Thumbnails**: Scrollable mini-previews of pages for quick access.
  - **Page Controls**: Controls to navigate to the next, previous, or specific page.

### **3. Smart AI-Based Context Navigation**
- **Description**: AI-driven tools to help users locate and understand relevant content within the document.
- **Components**:
  - Context-aware recommendations and links for efficient navigation.

### **4. Features Accessible via Tabs in a Dialog**
A floating button at the bottom-right corner opens a dialog box containing tabs for the following features:
1. **Key Concept Highlighting**:
   - Identifies and categorizes essential concepts into "Must-Know," "Good-to-Know," and "Optional."
   - Displays them as interactive highlights overlaid on the PDF.

2. **Simplified Summaries**:
   - Generates concise summaries of sections or pages using AI.
   - Summaries are presented alongside their respective content.

3. **Flashcards**:
   - Automatically generates flashcards from the document content.
   - Includes key points and related questions for learning or revision.

4. **AI Chat + Smart Suggestions**:
   - A chatbot interface for natural language queries.
   - Provides contextual suggestions and answers based on document content using Retrieval-Augmented Generation (RAG).

---

## **Tech Stack**

### **Core Technologies**
- **Vercel's AI SDK**: For seamless AI integration using OpenAI APIs.
- **SWR (Stale-While-Revalidate)**: Efficient data fetching and caching in Next.js.
- **Supabase**:
  - Database: Store user data, PDF metadata, and parsed content.
  - Auth: Manage user authentication for secure access.
  - Vectorbase: Power RAG capabilities with efficient vector storage and retrieval.
- **OCR (Tesseract)**: Extract text from image-based PDFs.

### **UI and Animations**
- **ShadcnUI**: Modern, modular, and accessible UI components for building the PDF editor.
- **LucideIcons**: Clean and consistent icons for navigation and actions.
- **Framer Motion**: Adds smooth animations and transitions for a polished user experience.

---

## **Instructions for Features and UI**

### **1. Overall UI Design**
- **Theme**: Dark mode with a minimalist, professional look.
- **Layout**:
  - **Editor Canvas**: The main area displaying the PDF content.
  - **Sidebar**: A collapsible sidebar for navigation tools (TOC, thumbnails).
  - **Floating Button**: A bottom-right FAB (Floating Action Button) to access advanced AI features.
- **Desktop-Only Support**:
  - If the screen width is smaller than 768px, show a "Not Supported Yet" message on a blank page.

---

### **2. PDF Editor Page**

#### **Upload and Parsing**
- **UI Components**:
  - Drag-and-drop area for file upload.
  - Manual "Browse Files" button.
- **User Feedback**:
  - Show a loading spinner during upload and parsing.
  - Display error messages for unsupported files.

#### **Document Viewer**
- **Main Editor**:
  - Display parsed PDF content with interactive zoom, scroll, and pan features.
  - Implement a scalable layout for future modular tools.
- **Sidebar**:
  - **TOC**: Dynamically generated from document headings.
  - **Thumbnails**: Scrollable list of page previews for navigation.

#### **Basic Navigation**
- **Components**:
  - Page controls (next, previous, jump-to-page).
  - Smooth transitions (e.g., zooming, panning) using Framer Motion.

---

### **3. Floating AI Tools Dialog**

#### **UI Design**
- **Trigger**: A FAB at the bottom-right corner, styled with LucideIcons for accessibility.
- **Dialog**:
  - Opens with a smooth animation (Framer Motion).
  - Contains tabs for "Key Concepts," "Summaries," "Flashcards," and "Chat."
- **Tabs**:
  - Each tab represents a feature, with content dynamically fetched using SWR.

#### **Feature-Specific UI**
1. **Key Concepts**:
   - Overlays concepts as highlights on the PDF.
   - Allows users to toggle visibility of different categories.

2. **Summaries**:
   - Show summaries in a collapsible section.
   - Provide an option to generate summaries for specific pages or sections.

3. **Flashcards**:
   - Interactive flip-card design with Framer Motion for animations.
   - Include "Save" and "Export" options.

4. **AI Chat + Smart Suggestions**:
   - Chat window with:
     - A text input field for queries.
     - Chat bubbles for AI-generated responses.
   - Suggestions panel dynamically updated based on user interaction.

---

### **4. Animations and Interactions**
- **Framer Motion**:
  - Dialog opening/closing animations.
  - Smooth transitions for navigation (e.g., page transitions, zoom).
  - Flip animations for flashcards.
- **Interactive Feedback**:
  - Hover effects for buttons and tabs.
  - Loading spinners during AI processing.

---

## **Next Steps**

1. **Modular Implementation**:
   - Design reusable components for the dialog, sidebar, and editor canvas.
   - Ensure each feature can be independently developed and integrated.

2. **Feature Prioritization**:
   - Start with PDF upload, parsing, and navigation.
   - Add AI features (Key Concepts, Summaries, Flashcards, Chat) iteratively.

3. **Testing**:
   - Test the UI and features with various PDF files for robustness.
   - Ensure smooth interactions and animations for all components.