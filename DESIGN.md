---
# Design Tokens
colors:
  # Surface & Background
  surface:
    base: "#0b0416"
    bright: "#150a24"
    card: "#130926"
    overlay: "rgba(11, 4, 22, 0.95)"
  
  # Accent Colors
  accent:
    purple: "#8B5CF6"
    magenta: "#ff00d4"
    blue: "#3B82F6"
    cyan: "#06b6d4"
    orange: "#f59e0b"
    red: "#ef4444"
    green: "#10b981"
    emerald: "#22c55e"
  
  # Text Colors
  text:
    primary: "#ffffff"
    secondary: "#a78bfa"
    dim: "#8b7ca8"
    muted: "#6b7280"
  
  # Stat Colors (RPG System)
  stats:
    strength: "#ef4444"
    agility: "#f59e0b"
    intelligence: "#8B5CF6"
    vitality: "#10b981"
    sense: "#3B82F6"
  
  # Semantic Colors
  semantic:
    success: "#22c55e"
    warning: "#f59e0b"
    error: "#ef4444"
    info: "#3B82F6"
  
  # Opacity Variants
  opacity:
    white-5: "rgba(255, 255, 255, 0.05)"
    white-10: "rgba(255, 255, 255, 0.10)"
    white-20: "rgba(255, 255, 255, 0.20)"
    black-70: "rgba(0, 0, 0, 0.70)"
    black-40: "rgba(0, 0, 0, 0.40)"

typography:
  # Font Families
  families:
    sans: "'Outfit', ui-sans-serif, system-ui, sans-serif"
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
    display: "'Orbitron', sans-serif"
    alt: "'Syne', sans-serif"
  
  # Font Weights
  weights:
    regular: 400
    semibold: 600
    bold: 700
    extrabold: 800
    black: 900
  
  # Font Sizes
  sizes:
    xs: "0.625rem"      # 10px
    sm: "0.75rem"       # 12px
    base: "0.875rem"    # 14px
    md: "1rem"          # 16px
    lg: "1.125rem"      # 18px
    xl: "1.25rem"       # 20px
    "2xl": "1.5rem"     # 24px
    "3xl": "1.875rem"   # 30px
    "4xl": "2.25rem"    # 36px
    "5xl": "3rem"       # 48px
  
  # Line Heights
  lineHeights:
    tight: 1.1
    normal: 1.5
    relaxed: 1.75
  
  # Letter Spacing
  letterSpacing:
    tight: "-0.025em"
    normal: "0"
    wide: "0.025em"
    wider: "0.05em"
    widest: "0.2em"
    ultra: "0.3em"

spacing:
  # Base Scale (rem)
  "0": "0"
  "0.5": "0.125rem"   # 2px
  "1": "0.25rem"      # 4px
  "1.5": "0.375rem"   # 6px
  "2": "0.5rem"       # 8px
  "2.5": "0.625rem"   # 10px
  "3": "0.75rem"      # 12px
  "3.5": "0.875rem"   # 14px
  "4": "1rem"         # 16px
  "5": "1.25rem"      # 20px
  "6": "1.5rem"       # 24px
  "8": "2rem"         # 32px
  "10": "2.5rem"      # 40px
  "12": "3rem"        # 48px
  "16": "4rem"        # 64px
  "20": "5rem"        # 80px
  "24": "6rem"        # 96px
  "28": "7rem"        # 112px
  "32": "8rem"        # 128px
  
  # Safe Area
  safe:
    bottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))"

radii:
  # Border Radius Scale
  sm: "0.5rem"        # 8px
  md: "0.75rem"       # 12px
  lg: "1rem"          # 16px
  xl: "1.25rem"       # 20px
  "2xl": "1.5rem"     # 24px
  "3xl": "1.875rem"   # 30px
  full: "9999px"
  
  # Component-Specific
  card: "2rem"        # 32px - bento cards
  button: "1rem"      # 16px
  input: "0.75rem"    # 12px
  avatar: "50%"

shadows:
  # Elevation Shadows
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  base: "0 4px 24px -1px rgba(0, 0, 0, 0.4)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
  
  # Glow Effects
  glow:
    purple: "0 0 20px rgba(139, 92, 246, 0.4)"
    purpleStrong: "0 0 25px rgba(124, 58, 237, 0.5)"
    blue: "0 0 20px rgba(59, 130, 246, 0.4)"
    cyan: "0 0 20px rgba(6, 182, 212, 0.4)"
    magenta: "0 0 20px rgba(255, 0, 212, 0.3)"
    orange: "0 0 10px rgba(245, 158, 11, 0.5)"
  
  # Component Shadows
  card: "0 4px 24px -1px rgba(0, 0, 0, 0.4)"
  cardHover: "0 0 20px rgba(139, 92, 246, 0.1)"
  button: "0 0 18px rgba(139, 92, 246, 0.35)"

elevation:
  # Z-Index Scale
  base: 0
  dropdown: 10
  sticky: 20
  fixed: 30
  modalBackdrop: 50
  modal: 50
  popover: 60
  tooltip: 70
  notification: 80
  loading: 9999

motion:
  # Duration
  duration:
    instant: "0ms"
    fast: "150ms"
    base: "300ms"
    slow: "500ms"
    slower: "700ms"
    slowest: "1000ms"
  
  # Easing
  easing:
    linear: "linear"
    ease: "ease"
    easeIn: "ease-in"
    easeOut: "ease-out"
    easeInOut: "ease-in-out"
    spring: "cubic-bezier(0.4, 0, 0.2, 1)"
  
  # Transitions
  transitions:
    all: "all 300ms ease"
    colors: "color 300ms ease, background-color 300ms ease, border-color 300ms ease"
    transform: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)"
    opacity: "opacity 300ms ease"

borders:
  # Border Widths
  widths:
    thin: "1px"
    base: "1.5px"
    thick: "2px"
    thicker: "2.5px"
    heavy: "4px"
  
  # Border Colors
  colors:
    default: "rgba(255, 255, 255, 0.05)"
    hover: "rgba(255, 255, 255, 0.10)"
    focus: "rgba(139, 92, 246, 0.30)"
    accent: "rgba(139, 92, 246, 0.20)"

gradients:
  # Background Gradients
  background:
    primary: "radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at -10% 40%, rgba(236, 72, 153, 0.05) 0%, transparent 40%)"
    purple: "linear-gradient(135deg, rgba(124, 90, 240, 0.12), rgba(109, 40, 217, 0.06))"
    blue: "linear-gradient(135deg, #1e3a8a, #020617)"
    dark: "linear-gradient(180deg, #050510 0%, #0a0a1a 50%, #050510 100%)"
  
  # Accent Gradients
  accent:
    purple: "linear-gradient(90deg, #7c5af0, #a78bfa)"
    purpleBr: "linear-gradient(to bottom right, #7c3aed, #a855f7)"
    purpleCyan: "linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)"
    rainbow: "linear-gradient(90deg, #7c5af0 0%, #06b6d4 100%)"
  
  # Component Gradients
  button:
    primary: "linear-gradient(to bottom right, #7c3aed, #a855f7)"
  
  # Conic Gradients
  conic:
    level: "conic-gradient(from 180deg, #8B5CF6, #ff00d4, #3B82F6, #8B5CF6)"

effects:
  # Text Shadows (Glow)
  textGlow:
    purple: "0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)"
    magenta: "0 0 10px rgba(255, 0, 212, 0.5), 0 0 20px rgba(255, 0, 212, 0.3)"
    orange: "0 0 10px rgba(245, 158, 11, 0.5)"
  
  # Backdrop Filters
  backdrop:
    blur: "blur(12px)"
    blurMd: "blur(24px)"
  
  # Filters
  filters:
    glow: "drop-shadow(0 0 30px rgba(124, 90, 240, 0.4))"
    glowCyan: "drop-shadow(0 0 50px rgba(6, 182, 212, 0.4))"

components:
  # Card Styles
  card:
    background: "#150a24"
    backgroundAlt: "rgba(21, 10, 36, 0.5)"
    border: "rgba(255, 255, 255, 0.05)"
    borderRadius: "2rem"
    padding: "1.5rem"
    hoverBackground: "#1c0f2f"
    hoverBorder: "rgba(139, 92, 246, 0.3)"
  
  # Button Styles
  button:
    primary:
      background: "linear-gradient(to bottom right, #7c3aed, #a855f7)"
      color: "#ffffff"
      borderRadius: "1rem"
      padding: "1rem"
      shadow: "0 0 25px rgba(124, 58, 237, 0.5)"
    secondary:
      background: "rgba(255, 255, 255, 0.10)"
      color: "#ffffff"
      border: "1px solid rgba(255, 255, 255, 0.20)"
      borderRadius: "1rem"
    ghost:
      background: "transparent"
      color: "#8b7ca8"
      hover: "rgba(255, 255, 255, 0.05)"
  
  # Input Styles
  input:
    background: "rgba(255, 255, 255, 0.05)"
    border: "1px solid rgba(255, 255, 255, 0.10)"
    borderRadius: "0.75rem"
    padding: "0.75rem 1rem"
    focusBorder: "rgba(139, 92, 246, 0.5)"
  
  # Navigation
  navigation:
    background: "#0a0a0f"
    borderTop: "1px solid rgba(255, 255, 255, 0.05)"
    height: "5rem"
    activeColor: "#ffffff"
    inactiveColor: "#6b7280"
  
  # Avatar
  avatar:
    sizes:
      sm: "40px"
      md: "68px"
      lg: "80px"
    border: "2.5px solid #7c5af0"
    shadow: "0 0 20px rgba(124, 90, 240, 0.3)"
  
  # Progress Bar
  progressBar:
    background: "rgba(255, 255, 255, 0.05)"
    fill: "linear-gradient(90deg, #7c5af0, #a78bfa)"
    height: "7px"
    borderRadius: "9999px"
    shadow: "0 0 12px rgba(124, 90, 240, 0.3)"
  
  # Badge
  badge:
    background: "rgba(139, 92, 246, 0.2)"
    color: "#a78bfa"
    borderRadius: "9999px"
    padding: "0.25rem 0.75rem"
    fontSize: "0.625rem"
  
  # Scrollbar
  scrollbar:
    width: "4px"
    track: "transparent"
    thumb: "rgba(255, 255, 255, 0.10)"
    thumbHover: "rgba(139, 92, 246, 0.5)"

layout:
  # Container
  container:
    maxWidth: "420px"
    padding: "1rem"
  
  # Spacing
  section:
    gap: "1rem"
    gapLarge: "1.25rem"
  
  # Safe Areas
  safeArea:
    bottom: "7rem"
    bottomNav: "calc(0.5rem + env(safe-area-inset-bottom, 0px))"
---

# LifLU Design System

## Overview

LifLU is a gamified life management application with a **cyberpunk-inspired, dark futuristic aesthetic**. The design combines deep space blacks with vibrant neon accents, creating an immersive RPG-like experience for productivity and habit tracking.

## Visual Identity

### Core Aesthetic

**Dark Futuristic Gaming Interface**

The design language draws inspiration from:
- Cyberpunk UI aesthetics with neon glows
- RPG game interfaces with stats and progression
- Modern glassmorphism with subtle transparency
- Space-themed gradients and atmospheric effects

### Color Philosophy

**Deep Space Foundation**

The color system is built on ultra-dark surfaces (`#0b0416` and `#150a24`) that create a sense of depth and focus. These aren't just black—they're rich, slightly purple-tinted darks that feel premium and immersive.

**Neon Accent System**

Vibrant accent colors provide energy and hierarchy:
- **Purple (`#8B5CF6`)**: Primary brand color, used for interactive elements and progression
- **Magenta (`#ff00d4`)**: High-energy accent for special features and gaming elements
- **Blue (`#3B82F6`)**: Information and events
- **Cyan (`#06b6d4`)**: Secondary accent for variety
- **Orange (`#f59e0b`)**: Warnings and time-sensitive items
- **Green (`#10b981`)**: Success states and habits
- **Red (`#ef4444`)**: Errors and strength stat

**RPG Stat Colors**

Each character stat has a dedicated color:
- Strength: Red (`#ef4444`) - Physical power
- Agility: Orange (`#f59e0b`) - Speed and flexibility
- Intelligence: Purple (`#8B5CF6`) - Mental acuity
- Vitality: Green (`#10b981`) - Health and endurance
- Sense: Blue (`#3B82F6`) - Awareness and perception

### Typography

**Three-Font System**

1. **Outfit** (Primary Sans-Serif)
   - Used for body text, descriptions, and general UI
   - Clean, modern, highly legible
   - Weights: 400 (regular), 600 (semibold), 800 (extrabold), 900 (black)

2. **Orbitron** (Display Font)
   - Used for headings, labels, and gaming elements
   - Futuristic, geometric character
   - Creates the cyberpunk aesthetic
   - Weights: 400, 700, 900

3. **JetBrains Mono** (Monospace)
   - Used for technical elements, XP values, and data
   - Provides contrast and technical feel
   - Weights: 400, 700

**Typography Patterns**

- **Headings**: Orbitron, black weight (900), uppercase, wide letter-spacing (0.2em-0.3em)
- **Body Text**: Outfit, regular (400) or semibold (600)
- **Labels**: Orbitron, black weight, uppercase, ultra-wide tracking
- **Data/Stats**: JetBrains Mono or Orbitron, bold

### Spacing & Layout

**Generous Breathing Room**

The interface uses ample spacing to prevent cognitive overload:
- Cards have 1.5rem (24px) internal padding
- Sections are separated by 1rem (16px) gaps
- Bottom navigation has safe-area-aware padding for mobile devices

**Bento Grid Philosophy**

Content is organized in rounded rectangular cards (2rem/32px radius) that feel like modular panels. Each card is a self-contained unit with clear hierarchy.

### Border Radius

**Soft, Rounded Aesthetic**

- **Cards**: 2rem (32px) - Large, friendly curves
- **Buttons**: 1rem (16px) - Comfortable touch targets
- **Small Elements**: 0.75rem (12px) - Consistent softness
- **Avatars & Badges**: Full circles (9999px)
- **Calendar Days**: 1rem (16px) - Pill-shaped when selected

### Shadows & Depth

**Layered Elevation**

1. **Base Cards**: Subtle shadow (`0 4px 24px -1px rgba(0, 0, 0, 0.4)`)
2. **Hover States**: Purple glow added (`0 0 20px rgba(139, 92, 246, 0.1)`)
3. **Active Elements**: Stronger glow (`0 0 25px rgba(124, 58, 237, 0.5)`)

**Glow Effects**

Neon glow is achieved through:
- Text shadows for glowing text
- Box shadows for glowing containers
- Drop shadows for floating elements
- Multiple layered shadows for intensity

### Gradients

**Atmospheric Backgrounds**

The main background uses dual radial gradients:
```
radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)
radial-gradient(circle at -10% 40%, rgba(236, 72, 153, 0.05) 0%, transparent 40%)
```

This creates a subtle purple-pink atmospheric glow that feels spacious and premium.

**Accent Gradients**

- **Purple-to-Lavender**: Used for progress bars and primary buttons
- **Purple-to-Cyan**: Used for loading screens and special effects
- **Conic Rainbow**: Used for level circles (purple → magenta → blue → purple)

### Borders

**Subtle Separation**

Borders are extremely subtle (`rgba(255, 255, 255, 0.05)`) to maintain the dark aesthetic while providing necessary separation. On hover, borders brighten to 0.10 opacity or gain purple tint.

### Motion & Animation

**Smooth, Spring-Based**

- **Duration**: 300ms for most transitions
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` for natural spring feel
- **Hover**: Scale transforms (0.95-1.05) for tactile feedback
- **Entry**: Fade + slide animations for new content
- **Progress**: Smooth width/height transitions with 700ms duration

**Micro-interactions**

- Buttons scale down slightly on press (0.95-0.98)
- Cards lift on hover with glow
- Checkboxes have satisfying check animations
- Loading states use spinning gradients

### Component Patterns

**Cards (Bento Style)**

```
Background: #150a24 or rgba(21, 10, 36, 0.5)
Border: 1px solid rgba(255, 255, 255, 0.05)
Border Radius: 2rem (32px)
Padding: 1.5rem (24px)
Shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.4)

Hover:
  Background: #1c0f2f
  Border: rgba(139, 92, 246, 0.3)
  Shadow: + 0 0 20px rgba(139, 92, 246, 0.1)
```

**Primary Button**

```
Background: linear-gradient(to bottom right, #7c3aed, #a855f7)
Color: #ffffff
Border Radius: 1rem (16px)
Padding: 1rem (16px)
Shadow: 0 0 25px rgba(124, 58, 237, 0.5)
Font: Orbitron, black (900), uppercase, 0.2em tracking

Active: scale(0.95)
```

**Progress Bar**

```
Container:
  Background: rgba(255, 255, 255, 0.05)
  Height: 7px
  Border Radius: 9999px

Fill:
  Background: linear-gradient(90deg, #7c5af0, #a78bfa)
  Shadow: 0 0 12px rgba(124, 90, 240, 0.3)
  Transition: width 1s cubic-bezier(0.4, 0, 0.2, 1)

Indicator Dot:
  Size: 15px
  Background: #fff
  Border: 3px solid #7c5af0
  Shadow: 0 0 8px #7c5af0
```

**Avatar System**

Procedurally generated avatars with:
- Deterministic seed-based generation
- Multiple head shapes, hairstyles, eyes, mouths, outfits
- Skin tone variety
- Background gradients (purple, blue, dark)
- Neon accent ring with glow filter
- Size: 40px (small), 68px (medium), 80px (large)

**Calendar Days**

```
Default:
  Size: calc((100vw - 48px) / 7)
  Background: transparent
  Color: #8b7ca8
  Border Radius: 1rem

Today (not selected):
  Background: rgba(139, 92, 246, 0.2)
  Color: #8B5CF6
  Border: 1px solid rgba(139, 92, 246, 0.3)

Selected:
  Background: #8B5CF6
  Color: #ffffff
  Shadow: 0 0 20px rgba(139, 92, 246, 0.4)
  Text Shadow: glow-purple
```

**Task/Habit Items**

```
Container:
  Background: rgba(21, 10, 36, 0.5)
  Border: 1px solid rgba(255, 255, 255, 0.05)
  Border Radius: 1rem (16px)
  Padding: 0.875rem (14px)

Checkbox:
  Size: 28px
  Border Radius: 0.5rem (8px)
  Border: 2px solid rgba(255, 255, 255, 0.2)
  
  Completed:
    Background: #8B5CF6 (tasks) or #10b981 (habits)
    Border: same as background
    Icon: CheckCircle2, white, 14px

Stat Badge:
  Dot: 6px circle, stat color
  Text: 9px, Orbitron black, uppercase, 0.2em tracking, stat color

XP Value:
  Font: Orbitron black, 12px
  Color: #8b7ca8 (default), stat color (completed)
```

**Bottom Navigation**

```
Background: #0a0a0f
Border Top: 1px solid rgba(255, 255, 255, 0.05)
Padding: 0.5rem + safe-area-inset-bottom

Items:
  Inactive: #6b7280
  Active: #ffffff, stroke-width 2.5

Center Button:
  Size: 52px
  Background: linear-gradient(to bottom right, #7c3aed, #a855f7)
  Shadow: 0 0 25px rgba(124, 58, 237, 0.5)
  Margin Top: -1.25rem (floating effect)
```

### Accessibility Considerations

**Contrast**

- All text meets WCAG AA standards against dark backgrounds
- Accent colors are vibrant enough for clear visibility
- Disabled states use 50% opacity for clear distinction

**Touch Targets**

- Minimum 44px touch targets for mobile
- Generous padding around interactive elements
- Clear hover/active states for feedback

**Motion**

- Animations are subtle and purposeful
- No flashing or rapid movements
- Respects user motion preferences (should be implemented)

### Responsive Behavior

**Mobile-First**

- Designed primarily for mobile (320px-428px)
- Fixed positioning prevents scroll issues
- Safe area insets for notched devices
- Bottom navigation for thumb-friendly access

**Scrolling**

- Custom thin scrollbars (4px) with purple hover
- Horizontal scroll for calendar with snap points
- Vertical scroll for main content with momentum

### Special Effects

**Loading Screen**

- Rotating dashed circle with gradient stroke
- Animated particles orbiting the logo
- Pulsing glow effect on logo
- Gradient progress bar with percentage
- Smooth fade-out transition

**Level Circle**

- Conic gradient border (purple → magenta → blue)
- Inner circle with surface background
- Centered level number
- Glow shadow effect

**Activity Grid**

- GitHub-style contribution grid
- 5 intensity levels with green gradient
- 7 rows × 31 columns
- 3.5px gap between cells
- Rounded corners (2px)

### Design Principles

1. **Clarity Through Contrast**: Dark backgrounds make colorful content pop
2. **Hierarchy Through Size & Weight**: Bold typography creates clear information hierarchy
3. **Delight Through Motion**: Subtle animations make interactions feel alive
4. **Focus Through Simplicity**: Each card has one clear purpose
5. **Energy Through Color**: Vibrant accents energize the dark interface
6. **Depth Through Layering**: Shadows and glows create dimensional space
7. **Consistency Through Tokens**: Reusable values ensure coherent experience

### Implementation Notes

**CSS Custom Properties**

The design uses Tailwind CSS v4's `@theme` directive to define custom properties:

```css
@theme {
  --font-sans: "Outfit", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --font-display: "Orbitron", sans-serif;
  
  --color-surface: #0b0416;
  --color-surface-bright: #150a24;
  --color-accent-purple: #8B5CF6;
  --color-accent-magenta: #ff00d4;
  --color-accent-blue: #3B82F6;
  --color-accent-orange: #f59e0b;
  --color-accent-red: #ef4444;
  --color-text-dim: #8b7ca8;
}
```

**Utility Classes**

Custom component classes for reusable patterns:

- `.bento-card`: Standard card styling with hover effects
- `.glow-purple`, `.glow-magenta`, `.glow-orange`: Text glow effects
- `.gaming-border`: Left border accent for gaming elements
- `.status-bar-bg`, `.status-bar-fill`: Progress bar components
- `.level-circle`, `.level-circle-inner`: Level indicator components
- `.custom-scrollbar`: Styled scrollbar
- `.scrollbar-hide`: Hidden scrollbar for clean horizontal scroll

**Framer Motion**

Animations use Framer Motion for React:
- `initial`, `animate`, `exit` for enter/exit animations
- `AnimatePresence` for list transitions
- Spring physics for natural movement

### Brand Voice

The design communicates:
- **Power**: Bold typography and strong contrasts
- **Progress**: Visible XP, levels, and stats
- **Focus**: Clean layouts and clear hierarchy
- **Energy**: Vibrant colors and smooth animations
- **Futurism**: Cyberpunk aesthetic and gaming elements

### Future Considerations

**Theming**

The system is designed to support future themes:
- Light mode variant
- Alternative color schemes (blue, green, red)
- Custom user themes at higher levels

**Scalability**

Token-based design allows for:
- Easy color adjustments
- Consistent spacing changes
- Typography refinements
- Component variations

**Accessibility Enhancements**

Potential improvements:
- Reduced motion mode
- High contrast mode
- Larger text options
- Keyboard navigation indicators

---

This design system creates a cohesive, immersive experience that makes productivity feel like an engaging game. Every element reinforces the core concept: **your life is an RPG, and you're leveling up.**
