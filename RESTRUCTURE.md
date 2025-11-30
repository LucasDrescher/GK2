# Projekt Omstrukturering - GK2 App

## 📋 Oversigt

Dette projekt er blevet omstruktureret baseret på feedback om:
1. Mere farverigt visuelt udtryk
2. Opdelt styling i mindre, organiserede filer
3. Genbrugelige komponenter
4. Bedre mappestruktur

---

## 🎨 Ny Farvepalette

Projektet bruger nu en moderne, farverig palette:

- **Primary**: Indigo (#4F46E5) med gradients
- **Secondary**: Cyan (#06B6D4)
- **Accent**: Amber (#F59E0B)
- **Success**: Grøn (#10B981)
- **Error**: Rød (#EF4444)
- **Info**: Blå (#3B82F6)

### Gradients
Komponenter bruger nu farverige gradients for et mere levende udtryk:
- StatCards med forskellige gradient kombinationer
- Color-coded badges (success, warning, error, info)

---

## 📁 Ny Mappestruktur

### Screens
```
screens/
├── Admin/              # Admin-relaterede screens
│   ├── AdminScreen.js
│   ├── AdminDashboardScreen.js
│   ├── AdminCreateEventScreen.js
│   ├── AdminEventListScreen.js
│   ├── AdminEventPlanScreen.js
│   ├── AdminRegisterScreen.js
│   ├── AdminProfileScreen.js
│   ├── AdminShiftList.js
│   ├── ApproveHoursScreen.js
│   ├── EmployeeManagementScreen.js
│   ├── EmployeeOverviewScreen.js
│   └── index.js        # Eksporterer alle admin screens
│
├── Employee/           # Medarbejder screens
│   ├── EmployeeHoursScreen.js
│   ├── EmployeeMoreScreen.js
│   ├── EmployeeProfileScreen.js
│   ├── ShiftListScreen.js
│   └── index.js
│
├── Auth/               # Autentificering
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   └── index.js
│
├── Shared/             # Delte screens
│   ├── Camera.js
│   ├── ChatRoomScreen.js
│   ├── ContractScreen.js
│   ├── EventDetailScreen.js
│   ├── InboxScreen.js
│   ├── MoreMenuScreen.js
│   ├── Pictureview.js
│   └── index.js
│
└── index.js            # Central export af alle screens
```

### Components
```
components/
├── Input.js            # Genbrugelig input komponent
├── Button.js           # Genbrugelig button komponent
├── Card.js             # Genbrugelig card komponent
├── Loading.js          # Loading indikator
├── Header.js           # ✨ NY - Genbrugelig header
├── Badge.js            # ✨ NY - Farverige status badges
├── EmployeeCard.js     # ✨ NY - Medarbejder kort
├── EventCard.js        # ✨ NY - Event kort
├── StatCard.js         # ✨ NY - Statistik kort med gradients
├── EmptyState.js       # ✨ NY - Ingen data visning
├── SignatureCanvas.js  # Signatur komponent
└── index.js            # Eksporterer alle komponenter
```

### Styles
```
styles/
├── colors.js           # Farvepalette
├── layoutStyles.js     # Layout og container styles
├── buttonStyles.js     # Button styles
├── inputStyles.js      # Input styles
├── cardStyles.js       # Card styles
├── textStyles.js       # Text styles
├── dashboardStyles.js  # Dashboard-specifikke styles
├── modalStyles.js      # Modal styles
├── headerStyles.js     # Header styles
├── menuStyles.js       # Menu styles
├── eventStyles.js      # Event-specifikke styles
├── cameraStyles.js     # Camera-specifikke styles
└── index.js            # Kombinerer og eksporterer alle styles
```

---

## 🧩 Nye Genbrugelige Komponenter

### 1. **Header**
Standardiseret header med tilbage-knap og valgfri højre element:
```jsx
import { Header } from '../components';

<Header 
  title="Dashboard"
  onBackPress={() => navigation.goBack()}
  rightElement={<Icon />}
  backgroundColor={colors.primary}
/>
```

### 2. **Badge**
Farverige status badges:
```jsx
import { Badge } from '../components';

<Badge text="Godkendt" variant="success" />
<Badge text="Afventer" variant="warning" />
<Badge text="Afvist" variant="error" />
<Badge text="Info" variant="info" />
```

### 3. **StatCard**
Statistik kort med gradient baggrund:
```jsx
import { StatCard } from '../components';

<StatCard 
  value="45"
  label="Medarbejdere"
  icon={<Ionicons name="people" size={28} color={colors.white} />}
  gradientColors={[colors.primary, colors.primaryDark]}
/>
```

### 4. **EmployeeCard**
Standardiseret medarbejder kort:
```jsx
import { EmployeeCard } from '../components';

<EmployeeCard 
  employee={employee}
  onPress={() => navigate('EmployeeProfile')}
  showBadge={true}
  badgeText="Aktiv"
  badgeVariant="success"
/>
```

### 5. **EventCard**
Standardiseret event kort:
```jsx
import { EventCard } from '../components';

<EventCard 
  event={event}
  onPress={() => navigate('EventDetail')}
  showEmployeeCount={true}
  accentColor={colors.secondary}
/>
```

### 6. **EmptyState**
Visning når der ikke er data:
```jsx
import { EmptyState } from '../components';

<EmptyState 
  icon="folder-open-outline"
  title="Ingen events"
  message="Opret dit første event for at komme i gang"
  action={<Button title="Opret Event" onPress={createEvent} />}
/>
```

---

## 📝 Sådan Importerer Du

### Gamle metode (før omstrukturering):
```jsx
import LoginScreen from './screens/LoginScreen';
import AdminScreen from './screens/AdminScreen';
```

### Nye metode (efter omstrukturering):
```jsx
// Import fra kategoriserede mapper
import { LoginScreen, RegisterScreen } from './screens/Auth';
import { AdminScreen, AdminDashboardScreen } from './screens/Admin';
import { EmployeeHoursScreen } from './screens/Employee';
import { ChatRoomScreen, InboxScreen } from './screens/Shared';

// Eller import alt fra screens index
import { 
  LoginScreen, 
  AdminScreen, 
  EmployeeHoursScreen 
} from './screens';

// Import komponenter
import { Button, Input, StatCard, Badge } from './components';

// Import styles
import { globalStyles, colors } from './styles';
// Eller specifikt:
import { buttonStyles, layoutStyles } from './styles';
```

---

## 🎯 Fordele ved Ny Struktur

### 1. **Bedre Organisation**
- Screens er grupperet efter funktionalitet
- Styles er opdelt tematisk
- Komponenter er genbrugelige

### 2. **Nemmere Vedligeholdelse**
- Mindre filer der er lettere at navigere
- Klare ansvarsområder
- Ingen duplikeret kode

### 3. **Mere Farverigt UI**
- Gradient backgrounds på stat cards
- Farverige badges for status
- Konsistent farvepalette

### 4. **Skalerbarhed**
- Let at tilføje nye screens i rigtig mappe
- Let at tilføje nye komponenter
- Let at udvide styles

### 5. **Konsistens**
- Samme look & feel på tværs af app
- Genbrugelige komponenter sikrer ensartethed
- Centraliseret farvepalette

---

## ✅ Hvad Er Implementeret

- ✅ Screens organiseret i Admin/, Employee/, Auth/, Shared/
- ✅ Styles opdelt i tematiske filer
- ✅ 6 nye genbrugelige komponenter (Header, Badge, StatCard, EmployeeCard, EventCard, EmptyState)
- ✅ Gradient backgrounds på StatCard
- ✅ Farverige badges med 4 varianter
- ✅ AdminDashboardScreen opdateret med nye komponenter
- ✅ Centraliseret export via index.js filer
- ✅ Moderne farvepalette implementeret

---

## 🚀 Næste Skridt (Valgfrit)

1. Konverter flere screens til at bruge de nye komponenter
2. Fjern eventuel duplikeret kode
3. Tilføj flere gradient varianter
4. Opret flere genbrugelige komponenter efter behov
5. Implementer dark mode support

---

## 📚 Eksempel: Opdateret AdminDashboard

**Før:**
```jsx
<View style={globalStyles.statCard}>
  <Text style={globalStyles.statNumber}>45</Text>
  <Text style={globalStyles.statLabel}>Medarbejdere</Text>
</View>
```

**Efter:**
```jsx
<StatCard 
  value="45"
  label="Medarbejdere"
  icon={<Ionicons name="people" size={28} color={colors.white} />}
  gradientColors={[colors.primary, colors.primaryDark]}
/>
```

Resultat: Mindre kode, mere farverigt, lettere at vedligeholde! 🎉
