# Changelog

All notable changes to the SPL GeoDashboard project.

---

## [1.1.4] — 2026-05-05

### Changed

- Production deploy workflow now pushes a `main-latest` rolling tag alongside the versioned tag for Watchtower auto-updates

---

## [1.1.3] — 2026-05-03

### Added

- Full project documentation suite in `docs/`:
  - Architecture, API collection, Features & user flows, Deployment, Development guide, State management
- `.nvmrc` file for Node version consistency
- `engines` field in `package.json` specifying Node.js version requirement (>=18.17.0 <23.0.0)
- Documentation section in README.md with links to all docs

### Changed

- Pinned all dependency versions in `package.json` (removed `^` prefixes for deterministic builds)
- Updated `next` from 14.2.22 to 14.2.35
- Updated `axios` from 1.8.3 to 1.15.2
- Updated devDependencies to latest safe versions:
  - `@commitlint/cli` 20.1.0 → 20.5.3
  - `@commitlint/config-conventional` 20.0.0 → 20.5.3
  - `@types/node` 20 → 20.19.39
  - `@types/papaparse` 5.3.15 → 5.5.2
  - `@types/react` 18 → 18.3.28
  - `@types/react-dom` 18 → 18.3.7
  - `@typescript-eslint/eslint-plugin` 8.45.0 → 8.59.1
  - `@typescript-eslint/parser` 8.45.0 → 8.59.1
  - `husky` 8.0.0 → 9.1.7
  - `postcss` 8 → 8.5.13
  - `typescript` 5 → 5.9.3
- Migrated Husky from v8 (`husky install`) to v9 (`husky` in prepare script)

---

## [1.1.2] — 2026-04-30

### Changed

- Updated search functionalities
- Updated login credentials (`5190c34`)

---

## [1.1.1] — 2026-04-19

### Changed

- Updated login credentials (`562ad85`, `bcbebf7`)

---

## [1.1.0] — 2026-02-16

### Changed

- Dockerfile updated for multi-stage build (`75acfae`, `0fa164e`)
- Version bumped (`886e489`)
- Merged `new-staging` branch (`52de163`)

---

## [1.0.10] — 2025-11-12

### Changed

- Docker build process updated (`8b55d18`, `5c01ab2`)

---

## [1.0.9] — 2025-11-10

### Added

- RTL text plugin for Arabic map labels (`a544864`)

### Removed

- Grid layer (commented out from UI) (`1bdf82d`)

---

## [1.0.8] — 2025-10-06

### Added

- ESLint with Next.js config (`aa4baf3`)
- Husky for Git hooks (`aa4baf3`)
- Commitlint for conventional commits (`aa4baf3`)

### Changed

- Next.js config updated (`bdedbe2`)

---

## [1.0.7] — 2025-10-05

### Changed

- Added new login credentials (`79003ed`)

---

## [1.0.6] — 2025-08-28

### Added

- Authentication system with login page (`a788660`)
  - Static credential validation
  - localStorage persistence
  - Protected routes
- POI search bar with autocomplete (`fa6353e`, `6949de9`, `60d8835`)
  - Bilingual (EN/AR) results
  - Polygon and marker rendering
  - Debounced API calls
- Docker entrypoint script for runtime env substitution (`5f0a253`)

### Changed

- Updated login credentials (`4228f15`)
- Version bumped (`d1e380d`)

---

## [1.0.5] — 2025-08-20

### Added

- Map filters (City, Neighbourhood, Unit Type) (`4aa10ef`)
- Real estate statistics panel (rent, land area, transactions)

### Changed

- Map dark layer style updated (`f53892c`)
- Riyadh city zoom level adjusted (`0ccfac3`)
- Map style changed to custom SPL styles (`6a1cb08`)

---

## [1.0.4] — 2025-07-22

### Changed

- Map light mode style updated (`047117c`)

---

## [1.0.3] — 2025-04-08

### Changed

- Production GitHub Actions workflow added (`94f11d6`)
- Next.js config updated with `basePath: /spl` and `assetPrefix` (`bca09f5`)
- Asset prefix path issue fixed (`b01435f`)
- JSON file paths modified for standalone build (`15faca7`, `644ca41`)

---

## [1.0.2] — 2025-04-07

### Added

- CalculateWalkableCoverageModal for selecting parcelat/competitor dataset type (`32f15a3`)

---

## [1.0.1] — 2025-03-27

### Added

- Separate file upload panels for hub locations (Parcelat vs Competitor) (`a1fcc8e`)
- Restructured project directories (`db760d6`)

### Changed

- Population file upload handling modified (`8839a21`)
- Walking distance suggested hub coverage bug fixed (`0fd2fb9`)

---

## [1.0.0] — 2025-03-24

### Added

- Suggested hubs with coverage polygons (`4b8d568`)
- Suggested hub walking distance coverage (`075307e`, `8419501`)
- Riyadh city boundary overlay (`1626b52`, `c032915`)
- Coverage statistics comparison table (`79ae15e`, `9c50d2c`, `9801c78`)
- Walking time in coverage stats (`b938311`)
- Sequential color coding for provinces (`caa9984`)
- Hub locations file upload with column validation (`257388f`)
- Grid layer (arid grid contour lines) (`2c961f4`)

---

## [0.9.0] — 2025-03-20

### Added

- Docker containerization (`bac6613`)
  - Multi-stage Dockerfile
  - Docker Compose for staging and production
  - Standalone Next.js output

---

## [0.8.0] — 2025-03-19

### Added

- 3D building showcase layer (`9abc28f`)
- Map layer toggle controls (Buildings, Regions)

### Fixed

- Notification display issues (`bda21fc`)

---

## [0.7.0] — 2025-03-18

### Added

- Fly-to highest density area on dataset upload (`9e2b03d`)
- Heatmap layer for population data (`71cb354`)

---

## [0.6.0] — 2025-03-17

### Fixed

- Tailwind CSS configuration issues (`5132fe1`)
- Folder naming corrections (`764527d`)

---

## [0.5.0] — 2025-03-12

### Added

- DeckGL layer controls and configuration (`e6ff007`)
- DeckGL layer rendering fixes (`cad3ea5`)

---

## [0.4.0] — 2025-03-10

### Added

- Night/day mode toggle (`d114a30`, `ae1ec48`)

### Fixed

- Isochrone calculation issues (`c2d3a17`)
- General bug fixes and deployment preparation (`6b73167`)
- Button naming (`b881d75`)

---

## [0.3.0] — 2025-03-06

### Added

- Hexagon layer for population density (`0de3b07`)
- File choose and layer display (`b50c9c1`)
- Input validation with error messages (`8ce42ef`)

---

## [0.2.0] — 2025-03-05

### Added

- Vercel deployment configuration (`81dd466`)
- Build fixes (`c851c56`)
- Data viewing capabilities (`994fc1d`)
- Staging environment fixes (`3096fa9`)
- Isochrone calculation and file upload (`3cd7fbe`)

---

## [0.1.0] — 2025-03-04

### Added

- Walking distance isochrone visualization (`d3a3fcc`)

---

## [0.0.1] — 2025-03-03

### Added

- Initial SPL dashboard with map and left panel (`7ea95e1`)

---

## [0.0.0] — 2025-03-02

### Added

- Project scaffolded with Create Next App (`aa87975`)

