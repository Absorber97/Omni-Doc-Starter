### **Project Overview**

**Project Name:** OmniDoc  
**Objective:** Develop a **high-end PDF editor page** with built-in **AI capabilities**, delivering smart features for content interaction and understanding. The app will focus on modular design, responsive desktop-first development, and seamless AI-enhanced functionality.

OmniDoc will offer advanced tools for navigating, summarizing, and interacting with PDFs through a sleek dark-themed interface powered by **ShadcnUI**, with dynamic animations using **Framer Motion**. Key features will be accessible via tabs in a modal triggered by a floating button in the bottom-right corner of the PDF editor.

---

### **MVP Features**

#### **Core Features** (Embedded in the PDF Editor):
1. **PDF Upload and Parsing**:
   - Upload a PDF and parse its text and structure for further interaction.
   - Extract headings, page content, and metadata.
2. **Basic Navigation Tools**:
   - Table of Contents (TOC): Auto-generated TOC based on document structure.
   - Thumbnails: Small, scrollable previews of each page for quick navigation.
   - Page Controls: Pagination, zoom in/out, and jump-to-page functionalities.
3. **Smart AI Context Navigation**:
   - Navigate directly to relevant sections based on AI-powered suggestions.

#### **Advanced Features** (Accessible via Modal Tabs):
1. **Key Concept Highlighting**:
   - Extract and display categorized key concepts ("Must-Know," "Good-to-Know," "Optional").
   - Highlight these concepts directly in the PDF viewer for contextual reference.
2. **Simplified Summaries**:
   - Generate beginner-friendly summaries for complex sections of the document.
   - Provide "Expand/Collapse" options for concise vs. detailed views.
3. **Flashcards**:
   - Create study notes or flashcards from PDF content.
   - Support interactive "Flip Card" animations using **Framer Motion**.
4. **AI Chat (+ Smart Suggestions)**:
   - Enable users to ask natural language questions about the PDF.
   - Provide smart suggestions to guide users toward relevant content or queries.

---

### **UI/UX Design Instructions**

#### **General Design Guidelines**
- **Theme**: Dark mode.
- **Icons**: Use **Lucide Icons** for all interactive elements.
- **Animations**: Leverage **Framer Motion** for smooth transitions, modal animations, and interactivity.
- **Responsiveness**: Focus on desktop screens; display a **"Not Supported Yet"** message for screens <768px.
- **Accessibility**: Ensure contrast ratios, ARIA roles, and semantic HTML for usability.

---

#### **1. PDF Editor Layout**
- **Header**:
  - OmniDoc logo and name on the left.
  - Action buttons (e.g., "Upload New PDF") on the right.
- **Main Content Area**:
  - **Left Sidebar**:
    - Table of Contents (collapsible tree view).
    - Thumbnails (scrollable preview of pages).
  - **Right Pane**:
    - Full-page PDF viewer with:
      - **Page Controls**:
        - Pagination buttons (Prev/Next).
        - Zoom in/out.
        - Jump-to-page input field.

---

#### **2. Floating Action Button (FAB)**
- **Placement**: Bottom-right corner of the PDF viewer.
- **Design**:
  - Use a circular button with an **Lucide Icons** "command" or "menu" icon.
  - On hover, display a tooltip: "Open AI Tools."
- **Behavior**:
  - Clicking the FAB opens a **modal dialog** with tabbed navigation for advanced features.

---

#### **3. Modal Dialog (Advanced Features)**
- **Tabs**:
  - **Key Concepts**:
    - Display extracted key concepts as categorized lists.
    - Allow users to click on a concept to navigate to its location in the PDF.
  - **Simplified Summaries**:
    - Present summaries in an expandable/collapsible list.
    - Include a "Copy Summary" button for each section.
  - **Flashcards**:
    - Show a stack of flashcards with interactive flipping animations.
    - Include "Next" and "Previous" controls to browse flashcards.
  - **AI Chat**:
    - Chat interface with a user input box and response history.
    - Include a "Suggested Questions" section for guided interaction.

- **Transitions**:
  - Use **Framer Motion** for modal open/close animations.
  - Smooth transitions between tabs.

---

### **Tech Stack**

#### **Primary Technologies**
1. **Vercel AI SDK (OpenAI)**: 
   - For implementing smart AI features like summaries, key concepts, and chat.
2. **Vercel SWR**:
   - For efficient data fetching, caching, and revalidation.
3. **ShadcnUI**:
   - For a modern, accessible, and responsive UI design.
4. **Lucide Icons**:
   - To ensure consistent, lightweight icons throughout the application.
5. **Framer Motion**:
   - For creating dynamic, fluid animations in modal dialogs and interactions.

#### **Supporting Technologies**
1. **Supabase**:
   - Database for storing user files (if needed in future).
   - Vector-based storage for RAG (Retrieval-Augmented Generation).
   - Authentication (optional in future iterations).
2. **Tesseract OCR**:
   - For handling PDFs with image-based text.
3. **OpenAI + Supabase for RAG**:
   - Implement AI-enhanced retrieval and context-aware navigation.

---

### **MVP UI Interaction Flow**

#### **Desktop-First Flow**
1. **Landing Page**:
   - A clean page with an "Upload PDF" button.
   - On successful upload, transition to the PDF Editor.
2. **PDF Editor**:
   - Display the PDF document with navigation tools and action controls.
   - Include the FAB in the bottom-right corner.
3. **AI Tools Modal**:
   - Triggered by the FAB.
   - Default to the "Key Concepts" tab but allow switching between tabs via a header.

#### **Fallback for Small Screens (<768px)**
- Display a centered message:
  - "OmniDoc is currently optimized for desktop screens. Please use a larger device."

---

### **Scalability & Modularity**
- **Component-Based Design**:
  - Modularize features like FAB, modal, and individual tabs for reusability.
- **Animation Consistency**:
  - Use **Framer Motion** globally to ensure consistent animation behavior.
- **Future-Ready**:
  - Prepare for future integrations (e.g., mobile support, multi-user collaboration).
