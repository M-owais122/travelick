// Simple Object Hotspot Test
console.log('Object test script loaded');

// Force create object hotspots for testing
function forceCreateObjectHotspots(scene) {
    console.log('FORCE: Creating test object hotspots for scene:', scene.id);

    const testObjectHotspots = [];

    // Simple test hotspots for living room
    if (scene.id === 'scene-1') {
        console.log('FORCE: Creating living room object hotspots');

        // Sofa hotspot
        testObjectHotspots.push({
            pitch: -10,
            yaw: 45,
            type: 'custom',
            text: `<div style="
                background: #FF0000;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: 4px solid #FFFFFF;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9999;
                position: relative;
                animation: testPulse 1s infinite;
            ">
                <i class="fas fa-couch" style="color: white; font-size: 20px;"></i>
            </div>
            <style>
            @keyframes testPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            </style>`,
            clickHandlerFunc: () => {
                alert('TEST: Sofa clicked! Object highlighting is working.');
                console.log('TEST: Sofa hotspot clicked');
            }
        });

        // TV hotspot
        testObjectHotspots.push({
            pitch: 5,
            yaw: 180,
            type: 'custom',
            text: `<div style="
                background: #0000FF;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: 4px solid #FFFFFF;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9999;
                position: relative;
                animation: testPulse 1s infinite;
            ">
                <i class="fas fa-tv" style="color: white; font-size: 20px;"></i>
            </div>`,
            clickHandlerFunc: () => {
                alert('TEST: TV clicked! Object highlighting is working.');
                console.log('TEST: TV hotspot clicked');
            }
        });

        console.log('FORCE: Created', testObjectHotspots.length, 'test object hotspots');
    }

    return testObjectHotspots;
}

// Override the enhanced hotspots function to include our test hotspots
if (typeof window !== 'undefined') {
    window.forceCreateObjectHotspots = forceCreateObjectHotspots;
    console.log('Force object hotspot function available globally');
}

// Test the object database system if available
setTimeout(() => {
    if (window.objectHighlight3D) {
        console.log('Testing object database...');
        console.log('Database size:', window.objectHighlight3D.objectDatabase.size);
        console.log('System enabled:', window.objectHighlight3D.isEnabled);

        // Test getting hotspots for scene-1
        const testScene = { id: 'scene-1' };
        const hotspots = window.objectHighlight3D.getObjectHotspots(testScene);
        console.log('Got hotspots from system:', hotspots.length);
    } else {
        console.warn('ObjectHighlight3D not available for testing');
    }
}, 2000);