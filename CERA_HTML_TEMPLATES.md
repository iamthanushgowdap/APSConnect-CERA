# 📦 CERA HTML Response Templates

## 1. 📅 TIMETABLE Template

```html
<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;max-width:720px;">
    <div style="border:1px solid #b8daff;border-radius:8px;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.03);margin:8px 0;overflow:hidden;">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #b8daff;background:#f0f8ff;border-top-left-radius:8px;border-top-right-radius:8px;">
            <div style="font-size:18px;line-height:1;">📅</div>
            <div style="font-weight:600;color:#004085;font-size:16px;">CLASS TIMETABLE</div>
        </div>
        
        <!-- Content: Timetable Grid -->
        <div style="padding:16px;">
            <table style="width:100%;border-collapse:collapse;border:1px solid #e0e0e0;font-size:12px;">
                <thead>
                    <tr style="background:#f8f9fa;">
                        <th style="border:1px solid #e0e0e0;padding:8px;text-align:center;font-weight:bold;width:15%;">Period</th>
                        <th style="border:1px solid #e0e0e0;padding:8px;text-align:center;font-weight:bold;">Monday</th>
                        <th style="border:1px solid #e0e0e0;padding:8px;text-align:center;font-weight:bold;">Tuesday</th>
                        <th style="border:1px solid #e0e0e0;padding:8px;text-align:center;font-weight:bold;">Wednesday</th>
                        <th style="border:1px solid #e0e0e0;padding:8px;text-align:center;font-weight:bold;">Thursday</th>
                        <th style="border:1px solid #e0e0e0;padding:8px;text-align:center;font-weight:bold;">Friday</th>
                        <th style="border:1px solid #e0e0e0;padding:8px;text-align:center;font-weight:bold;">Saturday</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:1px solid #e0e0e0;padding:8px;text-align:center;font-weight:bold;background:#f8f9fa;">9:00-9:50</td>
                        <td style="border:1px solid #e0e0e0;padding:6px;text-align:center;vertical-align:top;background:#e8f4fd;white-space:pre-line;font-size:11px;">
                            TOC
                            (BCS205)
                            [201]
                        </td>
                        <!-- More cells... -->
                    </tr>
                    <!-- More rows... -->
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Footer Message -->
    <div style="margin-top:8px;font-size:13px;color:#444;padding:6px 0;">
        Let me know if you need more details about any class! 📚
    </div>
</div>
```

**Color Scheme:**
- Border: `#b8daff` (Light Blue)
- Header Background: `#f0f8ff` (Alice Blue)
- Header Text: `#004085` (Dark Blue)
- Cell with Class: `#e8f4fd` (Very Light Blue)
- Empty Cell: `#ffffff` (White)

---

## 2. 💰 FEE RECORDS Template

```html
<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;max-width:720px;">
    <div style="border:1px solid #28a745;border-radius:8px;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.03);margin:8px 0;overflow:hidden;">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #28a745;background:#d4edda;border-top-left-radius:8px;border-top-right-radius:8px;">
            <div style="font-size:18px;line-height:1;">💰</div>
            <div style="font-weight:600;color:#155724;font-size:16px;">FEE PAYMENT SUMMARY</div>
        </div>
        
        <!-- Content -->
        <div style="padding:16px;">
            <!-- Overall Statistics -->
            <div style="margin-bottom:16px;">
                <h4 style="margin:0 0 8px 0;color:#495057;font-size:14px;">Overall Statistics:</h4>
                <ul style="margin:0;padding-left:20px;">
                    <li style="margin:4px 0;font-size:13px;"><strong>Total Fees:</strong> ₹15,500</li>
                    <li style="margin:4px 0;font-size:13px;"><strong>Paid:</strong> ₹1,498</li>
                    <li style="margin:4px 0;font-size:13px;"><strong>Outstanding:</strong> ₹14,002</li>
                    <li style="margin:4px 0;font-size:13px;"><strong>Payment Rate:</strong> 10%</li>
                </ul>
            </div>
            
            <!-- Recent Fee Records -->
            <div>
                <h4 style="margin:0 0 8px 0;color:#495057;font-size:14px;">Recent Fee Records:</h4>
                <ul style="margin:0;padding-left:20px;">
                    <li style="margin:4px 0;font-size:12px;">
                        ⏳ 5th Sem 2025: ₹14,002 due by Thu, Oct 30, 2025 (partial)
                        Tuition: ₹10,000, Hostel: ₹5,000, Library: ₹500
                    </li>
                    <!-- More records... -->
                </ul>
            </div>
        </div>
    </div>
    
    <!-- Footer Message -->
    <div style="margin-top:8px;font-size:13px;color:#444;padding:6px 0;">
        Stay on top of your payments! 💳
    </div>
</div>
```

**Color Scheme:**
- Border: `#28a745` (Green)
- Header Background: `#d4edda` (Light Green)
- Header Text: `#155724` (Dark Green)
- Icons: ✅ (paid), ⏳ (partial), ❌ (pending/overdue)

---

## 3. 📊 ATTENDANCE Template

```html
<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;max-width:720px;">
    <div style="border:1px solid #17a2b8;border-radius:8px;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.03);margin:8px 0;overflow:hidden;">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #17a2b8;background:#d1ecf1;border-top-left-radius:8px;border-top-right-radius:8px;">
            <div style="font-size:18px;line-height:1;">📊</div>
            <div style="font-weight:600;color:#0c5460;font-size:16px;">ATTENDANCE SUMMARY</div>
        </div>
        
        <!-- Content -->
        <div style="padding:16px;">
            <!-- Overall Statistics -->
            <div style="margin-bottom:16px;">
                <h4 style="margin:0 0 8px 0;color:#495057;font-size:14px;">Overall Statistics:</h4>
                <ul style="margin:0;padding-left:20px;">
                    <li style="margin:4px 0;font-size:13px;"><strong>Total Classes:</strong> 3</li>
                    <li style="margin:4px 0;font-size:13px;"><strong>Present:</strong> 2</li>
                    <li style="margin:4px 0;font-size:13px;"><strong>Absent:</strong> 1</li>
                    <li style="margin:4px 0;font-size:13px;"><strong>Attendance Rate:</strong> 67%</li>
                </ul>
            </div>
            
            <!-- Recent Records -->
            <div>
                <h4 style="margin:0 0 8px 0;color:#495057;font-size:14px;">Recent Records:</h4>
                <ul style="margin:0;padding-left:20px;">
                    <li style="margin:4px 0;font-size:12px;">✅ Wed, Oct 22: CN LAB (present)</li>
                    <li style="margin:4px 0;font-size:12px;">✅ Sat, Oct 18: CN LAB (present)</li>
                    <li style="margin:4px 0;font-size:12px;">❌ Sat, Oct 18: TOC (absent)</li>
                    <!-- More records... -->
                </ul>
            </div>
        </div>
    </div>
    
    <!-- Footer Message -->
    <div style="margin-top:8px;font-size:13px;color:#444;padding:6px 0;">
        Keep up the good attendance! 📈
    </div>
</div>
```

**Color Scheme:**
- Border: `#17a2b8` (Cyan/Teal)
- Header Background: `#d1ecf1` (Light Cyan)
- Header Text: `#0c5460` (Dark Cyan)
- Icons: ✅ (present), ❌ (absent)

---

## 4. 📘 ASSIGNMENTS Template

### 4a. Overdue Assignments Box

```html
<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;max-width:720px;">
    <div style="border:1px solid #f5c6cb;border-radius:8px;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.03);margin:8px 0;overflow:hidden;">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #f5c6cb;background:#fff5f6;border-top-left-radius:8px;border-top-right-radius:8px;">
            <div style="font-size:18px;line-height:1;">📘</div>
            <div style="font-weight:600;color:#721c24;font-size:16px;">OVERDUE ASSIGNMENTS</div>
        </div>
        
        <!-- Content -->
        <div style="padding:16px;">
            <ul style="margin:0;padding-left:20px;">
                <li style="margin:4px 0;font-size:13px;">
                    <strong>testtttttttttttttttttttttt</strong> — testtttttttttttttttttttttt: Thursday, October 23, 2025
                </li>
                <li style="margin:4px 0;font-size:13px;">
                    <strong>testtttttttttttttttt</strong> — testtttttttttttttttt: Thursday, October 23, 2025
                </li>
                <!-- More assignments... -->
            </ul>
        </div>
    </div>
</div>
```

**Color Scheme:**
- Border: `#f5c6cb` (Light Red)
- Header Background: `#fff5f6` (Very Light Red)
- Header Text: `#721c24` (Dark Red)
- Emoji: 📘

### 4b. Upcoming Assignments Box

```html
<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;max-width:720px;">
    <div style="border:1px solid #cfe2ff;border-radius:8px;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.03);margin:8px 0;overflow:hidden;">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #cfe2ff;background:#f3f8ff;border-top-left-radius:8px;border-top-right-radius:8px;">
            <div style="font-size:18px;line-height:1;">🕒</div>
            <div style="font-weight:600;color:#084298;font-size:16px;">UPCOMING ASSIGNMENTS</div>
        </div>
        
        <!-- Content -->
        <div style="padding:16px;">
            <ul style="margin:0;padding-left:20px;">
                <li style="margin:4px 0;font-size:13px;">
                    <strong>dhanu</strong> — testtttdhanuttttttttttttt: Wednesday, October 29, 2025 (6 days left)
                </li>
                <!-- More assignments... -->
            </ul>
        </div>
    </div>
    
    <!-- Footer Message -->
    <div style="margin-top:8px;font-size:13px;color:#444;padding:6px 0;">
        You've got this! Let me know if you need help with any of these assignments. 💪
    </div>
</div>
```

**Color Scheme:**
- Border: `#cfe2ff` (Light Blue)
- Header Background: `#f3f8ff` (Very Light Blue)
- Header Text: `#084298` (Dark Blue)
- Emoji: 🕒

---

## 5. 📭 NO DATA Template (Generic)

```html
<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;max-width:720px;">
    <div style="border:1px solid #d4edda;border-radius:8px;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.03);margin:8px 0;overflow:hidden;">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #d4edda;background:#f6fffa;border-top-left-radius:8px;border-top-right-radius:8px;">
            <div style="font-size:18px;line-height:1;">📭</div>
            <div style="font-weight:600;color:#155724;font-size:16px;">NO RECORDS FOUND</div>
        </div>
        
        <!-- Content -->
        <div style="padding:16px;">
            <ul style="margin:0;padding-left:20px;">
                <li style="margin:4px 0;font-size:13px;">I could not find your records in the database.</li>
                <li style="margin:4px 0;font-size:13px;">Please check with your administration or try another query.</li>
            </ul>
        </div>
    </div>
</div>
```

**Color Scheme:**
- Border: `#d4edda` (Light Green)
- Header Background: `#f6fffa` (Very Light Green)
- Header Text: `#155724` (Dark Green)
- Emoji: 📭

---

## 📊 Summary of Color Schemes

| Query Type | Border Color | Header BG | Header Text | Emoji |
|------------|-------------|-----------|-------------|-------|
| **Timetable** | `#b8daff` | `#f0f8ff` | `#004085` | 📅 |
| **Fee** | `#28a745` | `#d4edda` | `#155724` | 💰 |
| **Attendance** | `#17a2b8` | `#d1ecf1` | `#0c5460` | 📊 |
| **Overdue Assignments** | `#f5c6cb` | `#fff5f6` | `#721c24` | 📘 |
| **Upcoming Assignments** | `#cfe2ff` | `#f3f8ff` | `#084298` | 🕒 |
| **No Data** | `#d4edda` | `#f6fffa` | `#155724` | 📭 |

---

## 🎨 Common Styling Elements

### Card Container:
```css
border: 1px solid [COLOR];
border-radius: 8px;
background: #ffffff;
box-shadow: 0 1px 2px rgba(0,0,0,0.03);
margin: 8px 0;
overflow: hidden;
```

### Header:
```css
display: flex;
align-items: center;
gap: 8px;
padding: 12px;
border-bottom: 1px solid [COLOR];
background: [HEADER_BG];
border-top-left-radius: 8px;
border-top-right-radius: 8px;
```

### Content Area:
```css
padding: 16px;
```

### Lists:
```css
margin: 0;
padding-left: 20px;
```

### List Items:
```css
margin: 4px 0;
font-size: 13px; /* or 12px for detail items */
```

---

**All templates use the same base font:**
```css
font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
max-width: 720px;
```
