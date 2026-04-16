Act as a Principal React Architect, UX Design Leader, and Frontend Platform Engineer.

Your task is to design and generate an enterprise-grade, visually stunning, persona-driven KYC dashboard system for a hackathon POC called:

"KYC North Star Intelligence Platform"

This is NOT a basic dashboard. It must feel like a next-generation AI-native compliance platform used by global banks.

-----------------------------------
🎯 OBJECTIVE
-----------------------------------
Build a React + TypeScript application with 5 interconnected dashboard views:

1. Executive Command Center
2. AI Agent Operations Center
3. KYC Case Explorer
4. Continuous KYC Monitoring Map
5. AI Governance & Explainability Console

The system must tell ONE cohesive story:
👉 “From manual KYC → AI-driven, real-time, explainable compliance”

-----------------------------------
🎨 DESIGN SYSTEM (CRITICAL)
-----------------------------------
Follow a premium, enterprise UX style:

- Dark theme base:
  - Background: #0D1117
  - Surface: #161B22
  - Primary Accent: #00C9B1 (teal)
  - Secondary: #1F6FEB (blue)
  - Success: #2EA043
  - Warning: #F2CC60
  - Error: #F85149

- Typography:
  - Inter / SF Pro style
  - Bold KPIs, clean hierarchy

- Design feel:
  - Inspired by: Datadog, Stripe Dashboard, Vercel, Palantir
  - Glassmorphism + subtle gradients
  - Soft shadows + rounded-2xl cards

- Animations:
  - Use Framer Motion
  - Smooth transitions between views
  - KPI counters animate
  - Pulsing agent indicators

-----------------------------------
🏗️ TECH STACK
-----------------------------------
- React 18 + TypeScript
- Vite (preferred) or Next.js (App Router)
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Recharts (charts)
- D3.js (advanced visuals: heatmap, force graph, waterfall)
- Mapbox GL JS or Deck.gl (maps)
- Framer Motion (animations)
- WebSocket simulation (setInterval-based mock stream)

-----------------------------------
📦 ARCHITECTURE REQUIREMENTS
-----------------------------------
Design this as a scalable frontend platform:

- Feature-based folder structure:
  /features/executive
  /features/agents
  /features/cases
  /features/monitoring
  /features/governance

- Shared components:
  /components/ui
  /components/charts
  /components/maps
  /components/animations

- Global store:
  - agent state
  - KPI metrics
  - case data
  - event stream

- Mock data layer:
  /mock-data/
  - clients.json
  - cases.json
  - events-timeline.json (drives demo)

-----------------------------------
🧠 CORE UX PRINCIPLES
-----------------------------------
- Every screen must answer:
  → “What is happening?”
  → “Why does it matter?”
  → “What should I do?”

- Avoid clutter — prioritize signal over noise
- Use progressive disclosure
- Every chart must tell a story (not just display data)

-----------------------------------
📊 VIEW IMPLEMENTATIONS
-----------------------------------

1️⃣ EXECUTIVE COMMAND CENTER (WOW SCREEN)

- 5 KPI animated cards:
  - First-Time Right Rate
  - NIGO Count
  - STP Rate
  - Cases in Flight
  - Avg Onboarding Time (with delta badge)

- World Map:
  - Choropleth by region
  - Bubble overlays for STP %

- Dual-axis trend chart:
  - NIGO ↓
  - STP ↑

- Donut chart:
  - STP vs Exceptions

👉 Focus: Immediate business impact

-----------------------------------

2️⃣ AI AGENT OPERATIONS CENTER

- Agent cards:
  - Status (Active / Idle / Exception)
  - Latency
  - Tasks processed
  - Pulsing indicator

- Live activity stream:
  - Auto-scrolling feed
  - Color-coded severity

- Performance charts:
  - Tasks per agent
  - Auto vs manual split

- Confidence heatmap:
  - Doc type vs extracted fields

👉 Focus: System is alive and intelligent

-----------------------------------

3️⃣ KYC CASE EXPLORER

- Left sidebar:
  - Case list with filters

- Right panel:
  - Data completeness radial chart
  - Document timeline
  - QC rules checklist
  - Ownership graph (D3 force graph)
  - Exception handling UI

👉 Focus: Operational transformation

-----------------------------------

4️⃣ CONTINUOUS KYC MONITORING MAP

- Full-screen animated map:
  - Risk event pulses

- Event stream panel:
  - Real-time updates

- Risk distribution histogram

- False positive gauge

👉 Focus: Real-time intelligence

-----------------------------------

5️⃣ AI GOVERNANCE & EXPLAINABILITY

- Decision log table

- Explainability panel:
  - Reasoning chain
  - Confidence waterfall chart
  - Source attribution

- Bias & fairness charts

- Human override KPI

👉 Focus: Trust, auditability, compliance

-----------------------------------
⚡ REAL-TIME SIMULATION
-----------------------------------
Implement a demo engine:

- Use a JSON timeline file
- Trigger events via setInterval
- Simulate:
  - Document upload
  - Agent classification
  - QC failure
  - Advisor resolution
  - Continuous monitoring event

Include:
- Auto-play mode (scripted demo)
- Interactive mode

-----------------------------------
🧩 REUSABLE COMPONENTS TO BUILD
-----------------------------------
- Animated KPI Card
- Live Activity Feed
- Agent Status Card
- Timeline Component
- Heatmap Grid (D3)
- Force Graph (ownership)
- Waterfall Chart (confidence)
- Map Wrapper Component
- Gauge Chart
- Donut Chart

-----------------------------------
🚀 OUTPUT EXPECTATION
-----------------------------------
Generate:

1. Full project structure
2. Key component implementations (code)
3. State management setup (Zustand)
4. Mock data samples
5. Demo simulation engine
6. Routing/navigation between 5 views
7. Polished UI with animations

Code must be:
- Clean
- Modular
- Production-quality
- Visually impressive

-----------------------------------
⭐ BONUS (IMPORTANT)
-----------------------------------
- Add keyboard shortcuts to switch views
- Add global command palette (like Cmd+K)
- Add light mode toggle (optional but polished)
- Add loading skeletons
- Add micro-interactions everywhere

-----------------------------------

Think like:
👉 A Palantir + Datadog + AI-native compliance platform