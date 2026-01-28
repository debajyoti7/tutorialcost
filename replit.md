# Content Analyzer

## Overview

Content Analyzer is a web application that extracts and analyzes LLM experiments from podcast and YouTube video content. Users input a URL, and the system transcribes the content, uses AI to identify experiments, tools, and automation workflows mentioned, then provides detailed cost breakdowns for replicating those experiments. The application follows a clean, reference-based design approach similar to Perplexity AI and Claude's interfaces.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React 18 and TypeScript, utilizing Vite for development and bundling. The component architecture follows a modular approach with shadcn/ui components providing a consistent design system. State management is handled through React Query (@tanstack/react-query) for server state and local React state for UI interactions. The routing system uses Wouter for lightweight client-side navigation.

The UI design system is built on Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes. Components are organized into reusable UI primitives (buttons, cards, forms) and feature-specific components (InputForm, AnalysisResults, LoadingState). The design emphasizes clean information hierarchy with card-based layouts and structured data presentation.

### Backend Architecture
The server runs on Express.js with TypeScript, following a REST API pattern. The main analysis endpoint (`/api/analyze`) handles the complete workflow from URL input to final results. Content extraction is handled by specialized modules that support YouTube transcripts and podcast content parsing.

The AI analysis layer integrates with Google's Gemini API for intelligent content processing. The system analyzes transcripts to identify LLM experiments, extract tool mentions, estimate implementation costs, and categorize complexity levels. Enhanced in October 2025 with context-aware pricing tier selection that respects AI-suggested tiers based on experiment complexity (learning vs production use). The system now tracks multiple pricing types (free, fixed, usage-based, per-token) and provides transparent tier recommendations with full pricing breakdowns.

Intelligent pricing tier selection uses a flag-based matching system that prevents fallback logic from overriding valid AI recommendations. When Gemini suggests a specific tier (including free/self-hosted options), the system honors that recommendation rather than defaulting to paid tiers based on complexity alone.

### Data Storage Solutions
The application uses Drizzle ORM with PostgreSQL as the primary database. The schema supports storing analysis results, content metadata, and a comprehensive tool database for pricing reference. Key tables include `analyses` for storing processed results and `toolDatabase` for maintaining tool pricing and feature information.

Data is structured to support caching of analysis results, preventing duplicate processing of the same content URLs. The tool database serves as a reference system with multi-tier pricing structures for each tool. Each tool can have multiple pricing tiers (e.g., Free, Starter, Pro, Enterprise) with different pricing types (free, fixed monthly, usage-based ranges, per-token costs), enabling accurate cost estimates across different use cases and scales.

### Authentication and Authorization
The application uses Replit Auth with OpenID Connect for user authentication, supporting Google Sign-In (plus GitHub, Apple, and email/password). Session management uses PostgreSQL storage with connect-pg-simple.

**Access Control for Analysis:**
- Users with their own Gemini API key (stored in browser/extension) can analyze without signing in
- Signed-in users can use the server's fallback Gemini API key
- Anonymous users without an API key are prompted to sign in or add their own key

**Bring Your Own Key (BYOK):**
- Users can configure their own Gemini API key in the Settings dialog (web) or settings panel (Chrome extension)
- API keys are stored locally (localStorage for web, chrome.storage.sync for extension)
- Keys are sent to the server only during API calls and are never persisted server-side

This tiered access model allows free public usage while protecting the server's API quota for verified users.

### Content Processing Pipeline
The content extraction system supports multiple platforms through specialized handlers. YouTube content uses the youtube-transcript library for automated transcript extraction, while podcast support is designed for various audio platforms. The processing pipeline validates URLs, extracts content, performs AI analysis, and structures results for frontend consumption.

Error handling includes validation for unsupported URLs, transcript availability checks, and graceful degradation when content cannot be processed. The system provides detailed feedback about processing steps through loading states and progress indicators.

## External Dependencies

- **Google Gemini AI**: Primary AI service for content analysis and experiment identification using the @google/genai SDK
- **YouTube Transcript API**: Content extraction from YouTube videos via youtube-transcript library
- **Neon Database**: PostgreSQL hosting service accessed through @neondatabase/serverless
- **Radix UI**: Comprehensive component library providing accessible UI primitives (@radix-ui/react-*)
- **Tailwind CSS**: Utility-first CSS framework for styling and responsive design
- **React Query**: Server state management and caching for API interactions
- **Drizzle ORM**: Type-safe database operations and schema management
- **Vite**: Development server and build tool for frontend assets
- **Express.js**: Backend API server framework
- **shadcn/ui**: Pre-built component system built on Radix UI and Tailwind CSS

The application relies on these external services for core functionality: Gemini for AI analysis, YouTube's transcript service for content extraction, and Neon for data persistence. The frontend dependencies focus on providing a robust, accessible user interface with consistent design patterns.