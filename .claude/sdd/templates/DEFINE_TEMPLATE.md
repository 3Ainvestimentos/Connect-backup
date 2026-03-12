# DEFINE: {FEATURE_NAME}

> Generated: {DATE}
> Status: Ready for /design
> Source: BRAINSTORM_{FEATURE_NAME}.md (or direct request)
> Clarity Score: {X}/15

## 1. Problem Statement

{One clear sentence describing the problem}

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| {Architects/Designers/All} | {What problem they face} | {Daily/Weekly/etc} |

## 3. Goals (MoSCoW)

### MUST Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | {requirement} | {measurable criteria} |

### SHOULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | {requirement} | {measurable criteria} |

### COULD Have
| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | {requirement} | {measurable criteria} |

### WON'T Have (this iteration)
| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | {requirement} | {reason} |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| {criterion} | {target} | {measurement method} |

## 5. Technical Scope

### Backend (functions/src/)
| Component | Change Type | Details |
|-----------|------------|---------|
| {route/service/model} | {Create/Modify/None} | {description} |

### Frontend (src/app/)
| Component | Change Type | Details |
|-----------|------------|---------|
| {page/component/hook} | {Create/Modify/None} | {description} |

### AI Services
| Service | Change Type | Details |
|---------|------------|---------|
| {ai service/prompt} | {Create/Modify/None} | {description} |

### Database
| Model | Change Type | Details |
|-------|------------|---------|
| {Firestore model} | {Create/Modify/None} | {description} |

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | {JWT required? Which endpoints?} |
| User Isolation | {Users can only see their own data?} |
| Input Validation | {What needs validation?} |

## 7. Out of Scope

- {Explicitly excluded item 1}
- {Explicitly excluded item 2}

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| {What this depends on} | {Internal/External} | {Ready/Pending} |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | {0-3} | {note} |
| User identification | {0-3} | {note} |
| Success criteria measurability | {0-3} | {note} |
| Technical scope definition | {0-3} | {note} |
| Edge cases considered | {0-3} | {note} |
| **TOTAL** | **{X}/15** | {>= 12 to proceed} |

{If score < 12: "BLOCKED — needs clarification on: {list items scoring 0-1}"}

## 10. Next Step

Ready for `/design {FEATURE_NAME}` to create technical specification.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {DATE} | define-agent | Initial requirements from BRAINSTORM_{FEATURE_NAME}.md |
