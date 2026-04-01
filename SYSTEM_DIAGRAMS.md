# College Portal Diagrams

## Fig 1.1 Overall System Architecture Diagram

```mermaid
flowchart LR
  U[Student / Teacher / Admin]
  FE[React Frontend<br/>Vercel]
  API[Node.js + Express API<br/>Render]
  DB[(MongoDB Atlas)]
  CLD[(Cloudinary Raw Storage)]
  MAIL[Resend Email API]
  U --> FE
  FE --> API
  API --> DB
  API --> CLD
  API --> MAIL
  MAIL --> A[Admin Inbox]
```

## Fig 1.2 Working Flow of the System

```mermaid
flowchart TD
  S[User opens portal] --> C{Has account?}
  C -- No --> R[Register]
  C -- Yes --> L[Login]
  R --> RO{Role}
  RO -- Student --> SA[Create active student account]
  RO -- Teacher --> TP[Create pending teacher account]
  TP --> EM[Send approval email to admin]
  EM --> AP{Admin action}
  AP -- Approve --> TA[Teacher account approved]
  AP -- Reject --> TR[Teacher account removed]
  SA --> L
  TA --> L
  L --> D{Role dashboard}
  D -- Student --> SD[Student dashboard]
  D -- Teacher --> TD[Teacher dashboard]
```

## Fig 2.1 Existing System Model (Manual Resource Sharing)

```mermaid
flowchart LR
  T[Teacher] -->|WhatsApp / Drive / Pen Drive| S1[Student Group A]
  T -->|Email Attachments| S2[Student Group B]
  T -->|Printed Notes| S3[Students in class]
  S1 --> P1[Duplicate files]
  S2 --> P2[Version mismatch]
  S3 --> P3[Limited availability]
  P1 --> I[Inefficient resource management]
  P2 --> I
  P3 --> I
```

## Fig 3.1 Proposed System Architecture

```mermaid
flowchart TB
  subgraph Client Layer
    ST[Student UI]
    TE[Teacher UI]
    AU[Auth UI]
  end

  subgraph Service Layer
    AUTH[Auth Controller]
    RES[Resource Controller]
    STUD[Student Controller]
    BOOK[Bookmark Controller]
    NOTI[Notification Controller]
  end

  subgraph Data Layer
    USER[(User Collection)]
    RESOURCE[(Resource Collection)]
    BOOKMARK[(Bookmark Collection)]
    NOTICE[(Notification Collection)]
  end

  subgraph External Services
    CLOUD[(Cloudinary)]
    RESEND[(Resend)]
  end

  ST --> AUTH
  ST --> RES
  ST --> BOOK
  ST --> NOTI
  TE --> AUTH
  TE --> RES
  AU --> AUTH

  AUTH --> USER
  RES --> RESOURCE
  STUD --> USER
  BOOK --> BOOKMARK
  NOTI --> NOTICE
  RES --> CLOUD
  AUTH --> RESEND
```

## Fig 4.1 Data Flow Diagram (Level 0)

```mermaid
flowchart LR
  U[Users]
  P((College Portal System))
  D1[(User DB)]
  D2[(Resource DB)]
  D3[(Bookmark/Notification DB)]
  X1[(Cloudinary)]
  X2[(Resend)]
  U -->|Credentials, profile, upload requests| P
  P -->|Auth result, resources, notifications| U
  P <--> D1
  P <--> D2
  P <--> D3
  P <--> X1
  P <--> X2
```

## Fig 4.2 Data Flow Diagram (Level 1)

```mermaid
flowchart TB
  U[User]
  A1((1.0 Register/Login))
  A2((2.0 Profile Management))
  A3((3.0 Resource Upload & Browse))
  A4((4.0 Bookmark & Notifications))
  D1[(Users)]
  D2[(Resources)]
  D3[(Bookmarks)]
  D4[(Notifications)]
  C[(Cloudinary)]
  M[(Resend)]

  U --> A1
  A1 --> D1
  A1 --> M
  A1 --> U

  U --> A2
  A2 --> D1
  A2 --> U

  U --> A3
  A3 --> D2
  A3 --> C
  A3 --> U

  U --> A4
  A4 --> D3
  A4 --> D4
  A4 --> U
```

## Fig 5.1 User Login Interface

```mermaid
flowchart TD
  L[Login Screen]
  E[Email Input]
  P[Password Input]
  B[Sign In Button]
  V{Valid credentials?}
  R1[Open Student Dashboard]
  R2[Open Teacher Dashboard]
  ERR[Show error alert]
  L --> E --> P --> B --> V
  V -- No --> ERR
  V -- Yes + student --> R1
  V -- Yes + teacher --> R2
```

## Fig 5.2 User Registration Interface

```mermaid
flowchart TD
  R[Register Screen]
  N[Name]
  EM[Email]
  PW[Password]
  RL[Role Select: Student / Teacher]
  SB[Create Account]
  C{Role selected}
  SOK[Student account active]
  TOK[Teacher account pending approval]
  R --> N --> EM --> PW --> RL --> SB --> C
  C -- Student --> SOK
  C -- Teacher --> TOK
```

## Fig 6.1 Teacher Dashboard Overview

```mermaid
flowchart LR
  T[Teacher Dashboard]
  TAB1[Browse Tab]
  TAB2[My Uploads Tab]
  TAB3[New Upload Tab]
  FIL[Department/Year/Sem/Type Filters]
  GRID[Resource Cards]
  T --> TAB1 --> FIL --> GRID
  T --> TAB2 --> GRID
  T --> TAB3
```

## Fig 6.2 Resource Upload Form

```mermaid
flowchart TD
  F[Upload Form]
  T1[Title]
  S1[Subject]
  D1[Department]
  Y1[Year]
  SM1[Semester by Year Rules]
  TY1[Type]
  PDF[PDF File]
  UPL[Upload API]
  CL[(Cloudinary)]
  DB[(Resources Collection)]
  F --> T1 --> S1 --> D1 --> Y1 --> SM1 --> TY1 --> PDF --> UPL
  UPL --> CL
  UPL --> DB
```

## Fig 6.3 Uploaded Resources View

```mermaid
flowchart LR
  M[My Uploads]
  C1[Card: View]
  C2[Card: Download]
  C3[Card: Delete]
  M --> C1
  M --> C2
  M --> C3
  C3 --> DEL[DELETE /resources/:id]
```

## Fig 7.1 Student Dashboard Overview

```mermaid
flowchart TD
  SD[Student Dashboard]
  HERO[Hero + Search]
  PROFILE[Profile Button/Panel]
  TREND[Trending Section]
  CATS[Category Rows]
  BM[Bookmarks Section]
  NT[Notifications via Navbar]
  SD --> HERO
  SD --> PROFILE
  SD --> TREND
  SD --> CATS
  SD --> BM
  SD --> NT
```

## Fig 7.2 Resource Categories (Card Layout)

```mermaid
flowchart LR
  R1[Syllabus]
  R2[Lab Manual]
  R3[Textbook]
  R4[Assignment]
  R5[PYQ]
  R6[Microproject]
  ROW[Horizontal Card Rows]
  ROW --> R1
  ROW --> R2
  ROW --> R3
  ROW --> R4
  ROW --> R5
  ROW --> R6
```

## Fig 7.3 Resource Viewing Interface

```mermaid
sequenceDiagram
  participant User
  participant FE as Frontend
  participant API as Backend
  participant DB as MongoDB
  participant CDN as Cloudinary
  User->>FE: Click View
  FE->>API: GET /resources/:id/view (auth)
  API->>DB: Validate access + increment views
  API->>CDN: Fetch PDF
  CDN-->>API: PDF stream
  API-->>FE: PDF blob response
  FE-->>User: Open PDF in new tab
```

## Fig 8.1 Notification System Interface

```mermaid
flowchart LR
  EVT[Resource/Event Trigger]
  API[Notification Controller]
  DB[(Notification Collection)]
  UI[Navbar Notification Bell]
  READ[Mark as Read]
  EVT --> API --> DB --> UI --> READ --> API
```

## Fig 8.2 Bookmark System Interface

```mermaid
flowchart TD
  U[Student]
  CARD[Resource Card Bookmark Icon]
  API1[POST /bookmarks]
  API2[DELETE /bookmarks/:id]
  DB[(Bookmark Collection)]
  LIST[Your Bookmarks Section]
  U --> CARD
  CARD --> API1
  CARD --> API2
  API1 --> DB
  API2 --> DB
  DB --> LIST
```

## Fig 9.1 Deployment Architecture (Vercel + Render + MongoDB + Cloudinary)

```mermaid
flowchart LR
  Browser[User Browser]
  Vercel[Vercel<br/>React Frontend]
  Render[Render<br/>Node/Express API]
  Mongo[(MongoDB Atlas)]
  Cloud[(Cloudinary)]
  Resend[(Resend)]
  Browser --> Vercel
  Vercel --> Render
  Render --> Mongo
  Render --> Cloud
  Render --> Resend
```

## Fig 10.1 API Request and Response Flow

```mermaid
sequenceDiagram
  participant C as Client (React)
  participant M as Middleware (Auth/Role)
  participant R as Route Controller
  participant D as Database/Service
  C->>M: HTTP Request + JWT
  M->>M: Validate token + role
  M->>R: Forward authorized request
  R->>D: Query / update / external call
  D-->>R: Data / status
  R-->>C: JSON Response
```

