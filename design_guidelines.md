# Content Analyzer Design Guidelines

## Design Approach
**Reference-Based Approach**: Following Perplexity AI and Claude's interface patterns for clean, structured information presentation with focus on input/output clarity and professional data visualization.

## Core Design Elements

### Color Palette
- **Primary**: 274 56% 51% (purple #7C3AED)
- **Secondary**: 160 84% 39% (emerald #10B981) 
- **Background**: 0 0% 98% (off-white #FAFAFA)
- **Cards**: 0 0% 100% (white #FFFFFF)
- **Text Primary**: 220 39% 11% (dark grey #1F2937)
- **Accent**: 38 92% 50% (amber #F59E0B) - used sparingly for highlights
- **Dark Mode**: Consistent implementation with muted versions of above colors

### Typography
- **Primary Font**: Inter via Google Fonts CDN
- **Fallback**: Roboto
- **Hierarchy**: Large headings (2xl-3xl), medium subheadings (lg-xl), body text (base), small labels (sm)
- **Weight Distribution**: Bold for headings, medium for emphasis, regular for body

### Layout System
**Tailwind Spacing Units**: Consistent use of 2, 4, 6, 8, 12, 16 units
- Small gaps: p-2, m-2
- Medium spacing: p-4, m-4, gap-6
- Large sections: p-8, m-8, gap-12
- Extra large: p-16, m-16

## Component Library

### Input Form
- **Centered Layout**: Single column, max-width container
- **Large Text Area**: Prominent URL input field with placeholder text
- **Validation States**: Visual feedback for valid/invalid URLs
- **Submit Button**: Primary purple background with hover states

### Results Display
- **Two-Column Responsive Layout**: Tools list on left, cost breakdown on right
- **Card-Based Design**: White cards with subtle shadows on off-white background
- **Information Hierarchy**: Tool names, descriptions, pricing tiers clearly separated
- **Progress Indicators**: Loading states during analysis

### Navigation & Structure
- **Minimal Header**: Clean brand name, minimal navigation
- **Content Sections**: Clear separation between input, processing, and results
- **Status Messages**: Success, error, and loading states with appropriate colors

### Data Visualization
- **Structured Cards**: Tool information presented in consistent card format
- **Pricing Tables**: Clear cost breakdowns with emerald accents for emphasis
- **Visual Icons**: Tool logos or category icons using Font Awesome CDN
- **Responsive Grid**: Adapts from two-column to single-column on mobile

## Visual Treatments
- **Subtle Gradients**: Light purple-to-white gradients for hero sections
- **Clean Shadows**: Soft drop shadows on cards for depth
- **Rounded Corners**: Consistent border-radius for modern appearance
- **Generous Whitespace**: Breathing room between sections and components

## Animations
**Minimal Implementation**: 
- Subtle fade-ins for results
- Loading spinners during processing
- Smooth transitions between states (0.2s ease)

This design creates a professional, trustworthy interface that prioritizes content clarity while maintaining visual appeal through strategic use of the purple-emerald color palette and clean typography.