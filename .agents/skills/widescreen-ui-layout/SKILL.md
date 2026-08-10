---
name: widescreen-ui-layout
description: >-
  Use this skill when designing widescreen-optimized layouts for web games or applications,
  incorporating 3-column structures with floating side panels, responsive stacking,
  and theme-linked ambient background animations.
---

# Widescreen UI & Layout Skill

This skill defines the guidelines and CSS templates for establishing responsive 3-column layouts and custom background animations that scale gracefully from mobile devices to high-resolution desktop monitors.

## Layout Architecture

### 1. 3-Column Split Structure
Use the `.app-layout` flex container wrapping a central main window (`.main-content`) and two optional auxiliary side windows (`.side-panel`).

```html
<div class="app-layout">
    <!-- Left panel (e.g. Logs/History) -->
    <div id="side-left" class="side-panel hidden">
        ...
    </div>

    <!-- Main Content wrapper -->
    <div class="main-content">
        ...
    </div>

    <!-- Right panel (e.g. Rules/Quick Info) -->
    <div id="side-right" class="side-panel hidden">
        ...
    </div>
</div>
```

### 2. Standard Responsive Stylesheet
```css
.app-layout {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    max-width: 1600px;
    padding: 12px 20px;
    z-index: 10;
}

.main-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 1040px;
    min-height: 80vh;
}

.side-panel {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Responsive breakpoint for tablets/mobile */
@media (max-width: 1200px) {
    .app-layout {
        flex-direction: column;
        align-items: center;
        padding: 12px;
    }
    .side-panel {
        display: none !important; /* Hide side widgets on narrow screens */
    }
    .main-content {
        width: 100%;
        max-width: 640px;
    }
}
```

## Theme-Linked Background Animations
To eliminate empty space visual boredom ("背景が広い" issue), bind specific lightweight animated backgrounds to different themes.

### 1. Cyberpunk Neon Grid (Moving Gridlines)
```css
body.theme-cyberpunk {
    background-color: #07090f;
    background-image: linear-gradient(rgba(0, 210, 211, 0.07) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 210, 211, 0.07) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: cyberpunk-grid-move 25s linear infinite;
}
@keyframes cyberpunk-grid-move {
    0% { background-position: 0 0; }
    100% { background-position: 40px 40px; }
}
```

### 2. Retro 8-Bit Starfield (Scrolling Background)
```css
body.theme-8bit {
    background-color: #1a0f30;
    background-image: radial-gradient(#fff 1px, transparent 0);
    background-size: 24px 24px;
    animation: star-scroll 30s linear infinite;
}
@keyframes star-scroll {
    0% { background-position: 0 0; }
    100% { background-position: -48px 48px; }
}
```

### 3. Modern Light Theme (Floating Ambient Blobs)
Use blurred pseudo-elements behind the content container.
```css
body.theme-light {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    position: relative;
    overflow-x: hidden;
}
body.theme-light::before {
    content: "";
    position: fixed;
    top: -20%; left: -20%; width: 60vw; height: 60vh;
    background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%);
    filter: blur(80px);
    animation: blob-float 20s ease-in-out infinite alternate;
    z-index: 0;
    pointer-events: none;
}
@keyframes blob-float {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(60px, 60px) scale(1.15); }
}
```
