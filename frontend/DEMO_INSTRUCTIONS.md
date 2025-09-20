# Object Highlight & 3D Models Demo Instructions

## How to See the Object Highlight Feature

### Step 1: Start the Server
Make sure your server is running:
```bash
npm start
```

### Step 2: Access the Demo Tour
Open your browser and navigate to:
```
http://localhost:3001/viewer.html?tour=demo-tour-1
```

### Step 3: Look for Object Hotspots
In the **Living Room** scene (first scene), you should see:

1. **Red circular hotspot** with a couch icon (pitch: -10, yaw: 45) - This is the sofa
2. **Blue circular hotspot** with a TV icon (pitch: 5, yaw: 180) - This is the smart TV

These are **TEST HOTSPOTS** with bright colors (red and blue) to make them easily visible.

### Step 4: Click on the Hotspots
- Click on the **red sofa hotspot** → Should show "TEST: Sofa clicked!"
- Click on the **blue TV hotspot** → Should show "TEST: TV clicked!"

### Step 5: Check Console Logs
Open browser Developer Tools (F12) and check the Console tab for:
- "Object test script loaded"
- "FORCE: Creating test object hotspots for scene: scene-1"
- "Object Highlight & 3D Models system initialized successfully!"

### Step 6: Toggle Object Highlighting
Look for the **cube icon** in the toolbar (right side) and click it to toggle object highlighting on/off.

## Troubleshooting

### If You Don't See the Hotspots:
1. **Check the console** for error messages
2. **Refresh the page** and wait for all scripts to load
3. **Make sure you're on scene-1** (Living Room)
4. **Look around the 360° view** - the hotspots might be in different directions

### If Console Shows Errors:
1. Make sure all JavaScript files are loading properly
2. Check that the server is serving the files correctly
3. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

### Alternative Access Methods:
1. Go to `http://localhost:3001` first
2. Click "View Tours"
3. Select "Modern Apartment Demo Tour"
4. This should take you to the same viewer page

## Expected Behavior:
- **Navigation hotspots**: Green circles with arrows (for room navigation)
- **Object hotspots**: Red/blue circles with furniture icons (for object details)
- **Object modal**: Click object hotspots to see detailed product information
- **3D viewer**: Switch to "3D View" tab in the modal to see interactive 3D models

The test hotspots are intentionally bright and large to ensure visibility during development.