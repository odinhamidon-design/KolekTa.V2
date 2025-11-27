# Route Assignment Rules

## Overview
Ang system ay may built-in protection para sa route assignments. Kapag naka-assign na ang route sa driver, **hindi na pwedeng i-assign sa ibang driver** hanggang sa matapos o i-unassign.

---

## Rules

### ✅ Rule 1: One Driver Per Route
- Ang bawat route ay pwedeng ma-assign sa **isang driver lang**
- Kapag naka-assign na, **locked** na yung route
- Hindi pwedeng i-assign sa ibang driver para maiwasan ang conflict

### ✅ Rule 2: Visual Indicators
Sa Routes Management table:
- **Assigned routes** - May light blue background
- **Driver column** - May green checkmark (✓) at bold text
- **Assign button** - Naging gray at "🔒 Assigned" ang text
- **Status badge** - Color-coded (Blue=Planned, Orange=Active, Green=Completed)

### ✅ Rule 3: Assignment Protection
Kapag nag-click ng "Assign" sa assigned route:
- Lalabas ang warning modal
- Makikita ang current assignment details
- Hindi pwedeng mag-assign ng bagong driver
- May option na "Back to Routes"

### ✅ Rule 4: Unassign Feature
Pwede lang i-unassign ang route kung:
- Status ay **"completed"** na
- Lalabas ang "🔓 Unassign Route" button
- After unassign, babalik sa "planned" status
- Pwede na ulit i-assign sa bagong driver

---

## How It Works

### Scenario 1: Assigning a New Route
```
1. Admin clicks "👤 Assign" button
2. Modal opens with driver dropdown
3. Admin selects driver
4. Route is assigned
5. Driver sees the route in their dashboard
```

### Scenario 2: Trying to Re-assign
```
1. Admin clicks "🔒 Assigned" button
2. Warning modal appears:
   ⚠️ "This route is already assigned!"
3. Shows current assignment details
4. Cannot change driver
5. Must complete or unassign first
```

### Scenario 3: Unassigning Completed Route
```
1. Driver completes the route (status = completed)
2. Admin clicks "🔒 Assigned" button
3. Modal shows "✓ Route is completed"
4. Admin clicks "🔓 Unassign Route"
5. Route becomes available for new assignment
6. Status resets to "planned"
```

---

## Visual Guide

### Routes Management Table

| Route ID | Name | Locations | Distance | Assigned Driver | Status | Actions |
|----------|------|-----------|----------|----------------|--------|---------|
| ROUTE-001 | Downtown | 3 | 2.50 km | **✓ Juan Dela Cruz** | 🟦 planned | 🔒 Assigned 👁️ View 🗑️ Delete |
| ROUTE-002 | Coastal | 4 | 3.20 km | Not assigned | 🟦 planned | 👤 Assign 👁️ View 🗑️ Delete |

**Legend:**
- Light blue row = Assigned route
- White row = Available route
- 🔒 Assigned = Cannot reassign
- 👤 Assign = Available to assign

---

## Warning Modal Example

```
⚠️ This route is already assigned!

┌─────────────────────────────────────┐
│ Route: ROUTE-001 - Downtown         │
│ Assigned to: Juan Dela Cruz         │
│ Status: active                       │
└─────────────────────────────────────┘

Ang route na ito ay naka-assign na kay Juan Dela Cruz.
Hindi na pwedeng i-assign sa ibang driver para maiwasan ang conflict.

Kung gusto mong i-unassign, kailangan mong i-complete muna ang route.

[Back to Routes]
```

---

## Unassign Modal Example (Completed Route)

```
⚠️ This route is already assigned!

┌─────────────────────────────────────┐
│ Route: ROUTE-001 - Downtown         │
│ Assigned to: Juan Dela Cruz         │
│ Status: completed                    │
└─────────────────────────────────────┘

Ang route na ito ay naka-assign na kay Juan Dela Cruz.
Hindi na pwedeng i-assign sa ibang driver para maiwasan ang conflict.

✓ Ang route na ito ay completed na. Pwede mo na itong i-unassign 
  para ma-assign sa bagong driver.

[🔓 Unassign Route] [Back to Routes]
```

---

## Benefits

### 1. **Prevents Conflicts**
- Walang dalawang driver na mag-aagawan ng same route
- Clear ownership ng bawat route

### 2. **Data Integrity**
- Consistent ang data sa database
- Walang orphaned assignments

### 3. **Better Tracking**
- Madaling makita kung sino ang naka-assign
- Clear ang status ng bawat route

### 4. **Workflow Control**
- Structured ang process: assign → active → complete → unassign
- Cannot skip steps

---

## API Behavior

### Assign Route
```javascript
PUT /api/routes/:id
{
  "assignedDriver": "driver1",
  "status": "active"
}
```

### Unassign Route
```javascript
PUT /api/routes/:id
{
  "assignedDriver": null,
  "status": "planned"
}
```

---

## Testing Checklist

### As Admin:
- [ ] Assign route to driver
- [ ] Try to reassign (should show warning)
- [ ] Complete route as driver
- [ ] Unassign completed route
- [ ] Reassign to different driver

### As Driver:
- [ ] View assigned route
- [ ] Update route status to completed
- [ ] Verify route disappears after unassign

---

## Future Enhancements

Possible improvements:
1. **Transfer Route** - Direct transfer from one driver to another
2. **Route History** - Track all assignments and changes
3. **Bulk Assignment** - Assign multiple routes at once
4. **Auto-unassign** - Automatically unassign after X days of completion
5. **Assignment Notifications** - Email/SMS when route is assigned

---

## Support

Para sa questions:
- Check DRIVER_DASHBOARD_GUIDE.md
- Check PERSISTENT_STORAGE.md
- Contact development team
