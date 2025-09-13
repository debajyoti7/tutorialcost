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

The AI analysis layer integrates with Google's Gemini API for intelligent content processing. The system analyzes transcripts to identify LLM experiments, extract tool mentions, estimate implementation costs, and categorize complexity levels. This creates structured data that feeds back to the frontend for presentation.

### Data Storage Solutions
The application uses Drizzle ORM with PostgreSQL as the primary database. The schema supports storing analysis results, content metadata, and a comprehensive tool database for pricing reference. Key tables include `analyses` for storing processed results and `toolDatabase` for maintaining tool pricing and feature information.

Data is structured to support caching of analysis results, preventing duplicate processing of the same content URLs. The tool database serves as a reference system for consistent pricing calculations across different experiments.

### Authentication and Authorization
Currently implements a basic session-based authentication system using PostgreSQL session storage with connect-pg-simple. The system includes user management capabilities but appears to be in early development stages, with the main focus on content analysis functionality.

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