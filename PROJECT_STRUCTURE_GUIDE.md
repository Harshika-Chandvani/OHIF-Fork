# OHIF Project Architecture & Execution Flow Guide

## 📋 Project Overview

OHIF (Open Health Imaging Foundation) is a **monorepo** built with **Lerna** and **Yarn Workspaces**. It's a medical imaging viewer built on React that loads DICOM images and provides interactive tools for diagnosis and analysis.

**Tech Stack:**
- **Build Tools**: Webpack 5, Rsbuild, Lerna, NX (task runner)
- **Frontend**: React 18, React Router, TypeScript
- **Medical Imaging**: Cornerstone.js (DICOM rendering), DICOMweb-client
- **State Management**: Zustand (for UI state stores)
- **i18n**: react-i18next for internationalization

---

## 🏗️ Monorepo Structure

```
OHIF-Fork/
├── package.json                      # Root workspace config (Lerna + Yarn)
├── lerna.json                        # Lerna configuration
├── nx.json                           # NX task runner config
├── rsbuild.config.ts                 # Rsbuild (dev) configuration
├──
├── platform/                         # Core platform packages
│   ├── app/                          # Main web application (entry point)
│   │   ├── src/
│   │   │   ├── index.js              # Web app entry point
│   │   │   ├── App.tsx               # Root React component
│   │   │   ├── appInit.js            # Initializes managers & services
│   │   │   ├── routes/               # React Router configuration
│   │   │   ├── components/           # React components
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── state/                # Context providers
│   │   │   └── pluginImports.js      # (Generated) Dynamically loads extensions/modes
│   │   ├── public/
│   │   │   └── config/               # Configuration files
│   │   │       ├── default.js         # Default app config
│   │   │       ├── netlify.js
│   │   │       └── ...
│   │   └── package.json
│   │
│   ├── core/                         # Core business logic & managers
│   │   ├── src/
│   │   │   ├── classes/              # Manager classes
│   │   │   │   ├── CommandsManager.ts
│   │   │   │   ├── ExtensionManager.ts
│   │   │   │   ├── ServicesManager.ts
│   │   │   │   ├── HotkeysManager.ts
│   │   │   │   └── ...
│   │   │   ├── services/             # Service implementations
│   │   │   │   ├── UINotificationService.ts
│   │   │   │   ├── UIModalService.ts
│   │   │   │   ├── MeasurementService.ts
│   │   │   │   ├── ViewportGridService.ts
│   │   │   │   └── ...
│   │   │   ├── DataSources/          # DICOM data fetching
│   │   │   ├── extensions/           # Extension management logic
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui/                           # UI component library (legacy)
│   │
│   ├── ui-next/                      # UI component library (new)
│   │
│   ├── i18n/                         # Internationalization (i18n)
│   │
│   └── cli/                          # Command-line interface
│
├── extensions/                       # Plugin extensions (loaded dynamically)
│   ├── default/                      # Default extension (layouts, panels, toolbars)
│   │   ├── src/
│   │   │   ├── index.ts              # Extension export/definition
│   │   │   ├── getLayoutTemplateModule.js
│   │   │   ├── getPanelModule.tsx     # Registers panels (Study Browser, Measurements, etc.)
│   │   │   ├── getToolbarModule.tsx   # Toolbar buttons & tools
│   │   │   ├── getSopClassHandlerModule.js # Handles different DICOM types
│   │   │   ├── getCommandsModule.ts   # Registers commands
│   │   │   ├── Panels/               # UI panels
│   │   │   ├── Toolbar/              # Toolbar components
│   │   │   └── SOPClassHandlers/     # Handlers for different DICOM classes
│   │   └── package.json
│   │
│   ├── cornerstone/                  # Cornerstone image rendering extension
│   ├── cornerstone-dicom-seg/        # Segmentation support
│   ├── cornerstone-dicom-rt/         # Radiotherapy support
│   ├── cornerstone-dicom-sr/         # Structured Reports support
│   ├── dicom-pdf/                    # PDF DICOM support
│   ├── dicom-video/                  # Video DICOM support
│   └── ... (other extensions)
│
├── modes/                            # Application modes (visual layouts + features)
│   ├── basic/                        # Basic imaging mode
│   │   ├── src/
│   │   │   ├── index.tsx             # Mode export/definition
│   │   │   ├── id.js                 # Mode ID
│   │   │   ├── toolbarButtons.ts    # Buttons for this mode
│   │   │   ├── initToolGroups.ts    # Cornerstone tool groups
│   │   │   └── ...
│   │   └── package.json
│   │
│   ├── segmentation/                # Segmentation-specific mode
│   ├── tmtv/                        # Tumor imaging mode
│   ├── microscopy/                  # Microscopy mode
│   └── ... (other modes)
│
├── addOns/                          # Add-on packages
│   └── externals/                   # External integrations
│
└── tests/                           # E2E tests (Playwright)
    ├── 3DMain.spec.ts
    ├── MPR.spec.ts
    └── ... (test files)
```

---

## 🚀 Execution Flow: How the Project Runs

### 1️⃣ **Build Time: Plugin Discovery & Generation**

When you run `yarn build` or `yarn dev`, the build process:

```
Build Process:
├── Reads configuration (platform/app/public/config/default.js)
├── Scans extensions/ folder for extension packages
├── Scans modes/ folder for mode packages
├── Generates pluginImports.js dynamically
│   └── This file imports all extensions and modes for bundling
└── Webpack bundles everything into dist/
```

**Generated File: `pluginImports.js`**
```javascript
// Auto-generated at build time
export const extensions = [
  extensionDefaultModule,
  extensionCornerstoneModule,
  extensionDicomSegModule,
  // ... all registered extensions
];

export const modes = [
  basicMode,
  segmentationMode,
  tmtvMode,
  // ... all registered modes
];
```

---

### 2️⃣ **Runtime: Application Bootstrap**

#### **Entry Point Chain:**

```
Browser loads HTML
    ↓
    └─→ <div id="root"></div> + <script src="index.js">
        ↓
        └─→ platform/app/src/index.js
            ↓
            ├─→ loadDynamicConfig(window.config)
            │   └─→ Loads config from platform/app/public/config/default.js
            │       └─→ Merges with any dynamic config passed at runtime
            │
            ├─→ Imports pluginImports.js (generated at build time)
            │   ├─→ defaultExtensions (all extension modules)
            │   └─→ defaultModes (all mode modules)
            │
            └─→ Renders App component with:
                ├─→ config object
                ├─→ defaultExtensions
                └─→ defaultModes
```

---

### 3️⃣ **App Initialization: `App.tsx` Component**

```typescript
// platform/app/src/App.tsx
function App({ config, defaultExtensions, defaultModes }) {
  const [init, setInit] = useState(null);

  useEffect(() => {
    appInit(config, defaultExtensions, defaultModes)
      .then(setInit)
      .catch(console.error);
  }, []);

  if (!init) return null; // Loading...

  // Once initialized, render entire UI with providers
  return (
    <CombinedProviders>
      <BrowserRouter>
        {authRoutes}
        {appRoutes}
      </BrowserRouter>
    </CombinedProviders>
  );
}
```

---

### 4️⃣ **System Initialization: `appInit.js`**

This is where the **magic happens**. It initializes all managers and services:

```javascript
// platform/app/src/appInit.js
async function appInit(appConfigOrFunc, defaultExtensions, defaultModes) {

  // STEP 1: Create Core Managers
  const commandsManager = new CommandsManager({
    getAppState: () => {},
  });

  const servicesManager = new ServicesManager(commandsManager);
  const serviceProvidersManager = new ServiceProvidersManager();
  const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);

  // STEP 2: Load Configuration
  const appConfig = typeof appConfigOrFunc === 'function'
    ? await appConfigOrFunc({ servicesManager, peerImport })
    : appConfigOrFunc;

  // STEP 3: Create Extension Manager
  const extensionManager = new ExtensionManager({
    commandsManager,
    servicesManager,
    serviceProvidersManager,
    hotkeysManager,
    appConfig,
  });

  // STEP 4: Register Built-in Services
  servicesManager.registerServices([
    UINotificationService.REGISTRATION,
    UIModalService.REGISTRATION,
    UIDialogService.REGISTRATION,
    MeasurementService.REGISTRATION,
    DisplaySetService.REGISTRATION,
    ToolbarService.REGISTRATION,
    ViewportGridService.REGISTRATION,
    HangingProtocolService.REGISTRATION,
    CineService.REGISTRATION,
    UserAuthenticationService.REGISTRATION,
    // ... more services
  ]);

  // STEP 5: Load Extensions
  await extensionManager.addExtensions(defaultExtensions);

  // STEP 6: Load Modes
  await extensionManager.addModes(defaultModes);

  // STEP 7: Setup Data Sources
  await extensionManager.addDataSources(
    appConfig.dataSources || []
  );

  // Return initialized system
  return {
    commandsManager,
    extensionManager,
    servicesManager,
    serviceProvidersManager,
    hotkeysManager,
    appConfig,
  };
}
```

---

## 🎯 Core Managers Architecture

### **CommandsManager**
Registers and executes commands (actions) throughout the app:
```javascript
// Registration
commandsManager.registerCommand({
  commandName: 'setViewportActive',
  commandFn: ({ viewportIndex }) => {
    // Implementation
  },
});

// Execution
commandsManager.runCommand('setViewportActive', { viewportIndex: 0 });
```

### **ExtensionManager**
Loads extensions and modes, manages their lifecycle:
```javascript
// Extensions provide modules:
// - ViewportModule (rendering components)
// - PanelModule (side panels)
// - ToolbarModule (toolbar buttons)
// - SopClassHandlerModule (DICOM type handlers)
// - LayoutTemplateModule (layout configurations)
```

### **ServicesManager**
Manages all services (singleton instances):
```javascript
// Services available:
const {
  uiModalService,           // Show/hide modals
  uiNotificationService,    // Show notifications
  viewportGridService,      // Manage viewport grid
  measurementService,       // Track measurements
  displaySetService,        // Manage display sets
  commandsService,          // Execute commands
  // ... more services
} = servicesManager.services;
```

### **HotkeysManager**
Binds keyboard shortcuts:
```javascript
hotkeysManager.registerHotkeys({
  'Ctrl+S': 'saveAnnotations',
  'R': 'rotateRight',
});
```

---

## 📦 Extension Architecture

Each extension exports a **module definition** with:

```typescript
// extensions/default/src/index.ts
const defaultExtension: Types.Extensions.Extension = {
  id: 'extension-default',

  getDataSourcesModule() {
    // Returns data source implementations
  },

  getViewportModule() {
    // Returns viewport components for rendering
  },

  getPanelModule() {
    // Returns panel components (Study Browser, Measurements, etc.)
  },

  getToolbarModule() {
    // Returns toolbar button configurations
  },

  getSopClassHandlerModule() {
    // Returns handlers for different DICOM types (CT, MR, SEG, SR, etc.)
  },

  getLayoutTemplateModule() {
    // Returns layout configurations (1-up, 2x2, 3D, etc.)
  },

  getCommandsModule() {
    // Registers extension-specific commands
  },

  getHangingProtocolModule() {
    // Defines automatic viewport arrangement rules
  },
};
```

---

## 🎭 Mode Architecture

Modes define **how the viewer looks and behaves**. A mode:

```typescript
// modes/basic/src/index.tsx
const basicMode = {
  id: 'basic', // Unique mode identifier

  // Which extensions are required
  extensionDependencies: {
    '@ohif/extension-default': '^3.0.0',
    '@ohif/extension-cornerstone': '^3.0.0',
  },

  // Which SOP class handlers to use
  sopClassHandlers: [
    '@ohif/extension-cornerstone.sopClassHandlerModule.stack',
    '@ohif/extension-dicom-seg.sopClassHandlerModule.dicom-seg',
  ],

  // Viewport configuration (what to display)
  viewportConfiguration: {
    layout: '2x2', // or '1-up', '3D', etc.
    viewports: [/* viewport configs */],
  },

  // Hanging protocol (auto-arrange viewports based on study)
  hangingProtocol: 'default',

  // Toolbar buttons for this mode
  toolbarButtons: [
    {
      id: 'measure-length',
      label: 'Length',
      command: 'activateTool',
      commandOptions: { toolName: 'Length' },
    },
    // ... more buttons
  ],

  // Cornerstone tools available in this mode
  initToolGroups: (
    toolGroupService,
    commandsManager,
    extensionManager
  ) => {
    // Setup which measurement tools are active
  },
};
```

---

## 🔄 Request Flow: Loading a Study

```
User selects study from Study Browser
        ↓
        └─→ Route change (React Router)
            ↓
            └─→ StudyViewer component mounts
                ├─→ displaySetService.getDisplaySets(studyInstanceUid)
                │   ├─→ Fetches DICOM metadata via DICOMweb
                │   └─→ Creates "Display Sets" (logical groupings)
                │
                ├─→ hangingProtocolService.getRelevantHangingProtocol(displaySets)
                │   └─→ Automatically arranges viewports based on study type
                │
                ├─→ viewportGridService.setLayout({ rows: 2, columns: 2 })
                │   └─→ Creates 4 viewports
                │
                └─→ For each viewport:
                    ├─→ Load displaySet → get imageIds
                    ├─→ cornerstone.renderViewport(
                    │      element,
                    │      imageIds,
                    │      options
                    │   )
                    │   └─→ Fetches DICOM images from server
                    │       └─→ Cornerstone decodes and renders
                    │
                    └─→ User interacts:
                        ├─→ Click/drag → trigger tool command
                        ├─→ commandsManager.runCommand('measureLength', ...)
                        ├─→ measurementService.addMeasurement(...)
                        └─→ UI updates via React state
```

---

## 🔌 How Extensions Are Loaded

### **Config File Example**
```javascript
// platform/app/public/config/default.js
window.config = {
  name: 'config/default.js',
  routerBasename: '/',

  extensions: [
    // Extensions specify modules they provide
    // (loaded dynamically at build time)
  ],

  modes: [
    // Modes define viewer appearance
    // (loaded dynamically at build time)
  ],

  dataSources: [
    {
      friendlyName: 'DICOMweb Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'My Hospital PACS',
        wadoUriRoot: 'http://my-pacs:8080/dicom-web',
        qidoRoot: 'http://my-pacs:8080/dicom-web',
        wadoRoot: 'http://my-pacs:8080/dicom-web',
      },
    },
  ],
};
```

### **Plugin Discovery (Build Time)**

The build process finds all extensions and modes:
```bash
# Scans these directories
extensions/*/src/index.ts (or .js)
modes/*/src/index.tsx (or .ts)

# Generates pluginImports.js with all found modules
# Then bundles everything into one dist file
```

---

## 📊 Component Hierarchy

```
App (Root)
├─ Multiple Providers (Theme, i18n, etc.)
├─ BrowserRouter (React Router)
│  └─ Routes
│     ├─ StudyListRoute (if showStudyList=true)
│     │  └─ StudyBrowser
│     │     └─ StudyList (from extension-default panel)
│     │
│     └─ StudyViewer
│        ├─ Sidebar
│        │  ├─ StudyBrowserPanel
│        │  ├─ MeasurementsPanel (from cornerstone extension)
│        │  ├─ SegmentationPanel (if seg extension loaded)
│        │  └─ ... (other panels)
│        │
│        ├─ Toolbar
│        │  └─ ToolbarButtons (from current mode)
│        │
│        └─ ViewportGrid
│           ├─ Viewport (Cornerstone rendering)
│           │  └─ Canvas (WebGL rendered by Cornerstone)
│           ├─ Viewport
│           ├─ Viewport
│           └─ Viewport
```

---

## 🛠️ Common Workflows

### **How to Add a New Toolbar Button**

```typescript
// In your mode's toolbarButtons.ts:
export default [
  {
    id: 'myButton',
    label: 'My Tool',
    icon: 'icon-id',
    type: 'action' | 'toggle',
    command: 'executeMyCommand',
    commandOptions: { toolName: 'MyTool' },
    isActive: () => false,
  },
];
```

### **How to Register a Command**

```typescript
// In an extension's commandsModule.ts:
commandsManager.registerCommand({
  commandName: 'executeMyCommand',
  commandFn: ({ servicesManager, extensionManager }, commandOptions) => {
    const { viewportGridService } = servicesManager.services;
    // Implementation
  },
});
```

### **How to Access a Service**

```typescript
// In any React component:
const { servicesManager } = useContext(SystemContext);
const { measurementService, uiModalService } = servicesManager.services;

// Use it
measurementService.addMeasurement({
  type: 'length',
  coordinates: [[x1, y1], [x2, y2]],
});
```

---

## 🔑 Key Concepts

| Concept | Purpose |
|---------|---------|
| **Command** | Named action that can be executed anywhere in the app |
| **Service** | Singleton that provides functionality (measurements, notifications, etc.) |
| **Extension** | Plugin that adds modules (viewport, panels, tools, handlers) |
| **Mode** | Specific configuration of the viewer (which extensions, layout, tools) |
| **Display Set** | Logical grouping of images (e.g., all CT slices for one series) |
| **Viewport** | Canvas where images are rendered (powered by Cornerstone) |
| **Hanging Protocol** | Rules for auto-arranging viewports based on study data |
| **SOP Class Handler** | Adapter for different DICOM types (CT, MR, SEG, SR, etc.) |

---

## 📝 Development Workflow

### **Start Development Server**
```bash
yarn dev                 # Webpack dev server on http://localhost:3000
yarn dev:fast           # Rsbuild (faster) on http://localhost:3000
yarn dev:orthanc        # With Orthanc DICOM server
yarn dev:static         # With static DICOM files
```

### **Build for Production**
```bash
yarn build:viewer       # Production build
yarn build:viewer:ci    # CI production build with versioning
```

### **Testing**
```bash
yarn test:unit          # Unit tests
yarn test:e2e           # E2E tests with Playwright
yarn test:e2e:ui        # E2E with UI
```

---

## 🎯 Summary

**OHIF is essentially:**

1. **Dynamic Plugin System**: Extensions and modes are discovered and bundled at build time
2. **Manager Architecture**: CommandsManager, ExtensionManager, ServicesManager coordinate everything
3. **Service-Oriented**: All features are accessed via services in the ServicesManager
4. **React-Based UI**: React Router for navigation, Context providers for state, Zustand for UI stores
5. **Extensible at Every Level**: Add new tools, panels, layouts, data sources via extensions
6. **DICOM-Focused**: Built on Cornerstone for image rendering, DICOMweb for data loading

The monorepo structure allows each extension and mode to be developed, tested, and published independently while being bundled together for the final application.
