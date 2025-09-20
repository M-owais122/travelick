// Live Guided Tour System using WebRTC

class LiveTourManager {
    constructor() {
        this.isHost = false;
        this.isGuest = false;
        this.roomId = null;
        this.localStream = null;
        this.remoteStreams = new Map();
        this.peerConnections = new Map();
        this.dataChannels = new Map();
        this.socket = null;
        this.participants = new Map();
        this.tourState = {
            currentScene: null,
            hostPosition: null,
            isFollowMode: true
        };
        this.voiceEnabled = false;
        this.chatEnabled = true;
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        this.init();
    }

    async init() {
        this.createLiveTourUI();
        this.setupSocketConnection();
        console.log('Live Tour Manager initialized');
    }

    // UI Creation
    createLiveTourUI() {
        // Add live tour button to toolbar
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;

        const liveTourBtn = document.createElement('button');
        liveTourBtn.id = 'liveTourBtn';
        liveTourBtn.onclick = () => this.showLiveTourModal();
        liveTourBtn.title = 'Live Guided Tour';
        liveTourBtn.innerHTML = '<i class="fas fa-users"></i>';
        toolbar.appendChild(liveTourBtn);

        // Create live tour modal
        this.createLiveTourModal();

        // Create participants panel
        this.createParticipantsPanel();

        // Create chat interface
        this.createChatInterface();
    }

    createLiveTourModal() {
        const modal = document.createElement('div');
        modal.id = 'liveTourModal';
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-content" style="max-width: 600px;">
                <h3 class="text-xl font-bold mb-4">
                    <i class="fas fa-users mr-2 text-primary"></i>Live Guided Tour
                </h3>

                <div id="liveTourOptions">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="p-4 border rounded-lg cursor-pointer hover:border-primary" onclick="liveTourManager.startHosting()">
                            <div class="text-center">
                                <i class="fas fa-microphone text-3xl text-primary mb-3"></i>
                                <h4 class="font-bold mb-2">Host a Tour</h4>
                                <p class="text-sm text-gray-600">Lead a live guided tour for participants</p>
                            </div>
                        </div>

                        <div class="p-4 border rounded-lg cursor-pointer hover:border-primary" onclick="liveTourManager.showJoinForm()">
                            <div class="text-center">
                                <i class="fas fa-users text-3xl text-primary mb-3"></i>
                                <h4 class="font-bold mb-2">Join a Tour</h4>
                                <p class="text-sm text-gray-600">Participate in a live guided tour</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="joinTourForm" style="display: none;">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Tour Room ID</label>
                        <input type="text" id="roomIdInput" placeholder="Enter room ID"
                               class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Your Name</label>
                        <input type="text" id="participantNameInput" placeholder="Enter your name"
                               class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    <div class="flex gap-2">
                        <button onclick="liveTourManager.joinTour()"
                                class="flex-1 bg-primary text-black px-4 py-2 rounded-lg hover:bg-opacity-90">
                            Join Tour
                        </button>
                        <button onclick="liveTourManager.hideJoinForm()"
                                class="px-4 py-2 border rounded-lg">
                            Back
                        </button>
                    </div>
                </div>

                <div id="hostControls" style="display: none;">
                    <div class="bg-gray-50 p-4 rounded-lg mb-4">
                        <h4 class="font-bold mb-2">Room Information</h4>
                        <div class="flex items-center justify-between">
                            <span>Room ID: <strong id="currentRoomId"></strong></span>
                            <button onclick="liveTourManager.copyRoomId()"
                                    class="bg-primary text-black px-3 py-1 rounded text-sm">
                                Copy
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" id="voiceEnabledCheck" onchange="liveTourManager.toggleVoice()">
                                <span class="ml-2">Enable Voice</span>
                            </label>
                        </div>
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" id="chatEnabledCheck" checked onchange="liveTourManager.toggleChat()">
                                <span class="ml-2">Enable Chat</span>
                            </label>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <button onclick="liveTourManager.endTour()"
                                class="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg">
                            End Tour
                        </button>
                        <button onclick="liveTourManager.closeLiveTourModal()"
                                class="px-4 py-2 border rounded-lg">
                            Minimize
                        </button>
                    </div>
                </div>

                <div class="flex justify-end mt-4" id="modalCloseContainer">
                    <button onclick="liveTourManager.closeLiveTourModal()"
                            class="bg-gray-500 text-white px-4 py-2 rounded-lg">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    createParticipantsPanel() {
        const panel = document.createElement('div');
        panel.id = 'participantsPanel';
        panel.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 250px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 15px;
            color: white;
            display: none;
            z-index: 1000;
            max-height: 400px;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold">Participants</h4>
                <span id="participantCount">0</span>
            </div>
            <div id="participantsList"></div>
            <div class="mt-3 pt-3 border-t border-gray-600">
                <div class="flex gap-2">
                    <button id="followModeBtn" onclick="liveTourManager.toggleFollowMode()"
                            class="flex-1 text-xs px-2 py-1 bg-primary text-black rounded">
                        Follow Mode: ON
                    </button>
                    <button onclick="liveTourManager.toggleParticipantsPanel()"
                            class="text-xs px-2 py-1 border border-gray-600 rounded">
                        Hide
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
    }

    createChatInterface() {
        const chat = document.createElement('div');
        chat.id = 'liveChatInterface';
        chat.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            height: 400px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            display: none;
            flex-direction: column;
            z-index: 1000;
            color: white;
        `;

        chat.innerHTML = `
            <div class="flex items-center justify-between p-3 border-b border-gray-600">
                <h4 class="font-bold">Live Chat</h4>
                <button onclick="liveTourManager.toggleChat()" class="text-xs px-2 py-1 border border-gray-600 rounded">
                    Hide
                </button>
            </div>
            <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: 10px; font-size: 14px;"></div>
            <div class="p-3 border-t border-gray-600">
                <div class="flex gap-2">
                    <input type="text" id="chatInput" placeholder="Type a message..."
                           class="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                           onkeypress="liveTourManager.handleChatKeyPress(event)">
                    <button onclick="liveTourManager.sendChatMessage()"
                            class="px-3 py-1 bg-primary text-black rounded text-sm">
                        Send
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(chat);
    }

    // Socket Connection
    setupSocketConnection() {
        try {
            // Use WebSocket for signaling
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/tours`;

            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('Live tour socket connected');
            };

            this.socket.onmessage = (event) => {
                this.handleSocketMessage(JSON.parse(event.data));
            };

            this.socket.onclose = () => {
                console.log('Live tour socket disconnected');
                // Attempt to reconnect
                setTimeout(() => this.setupSocketConnection(), 5000);
            };

            this.socket.onerror = (error) => {
                console.error('Socket error:', error);
            };

        } catch (error) {
            console.warn('WebSocket not available, using fallback signaling');
            this.setupFallbackSignaling();
        }
    }

    setupFallbackSignaling() {
        // Fallback to HTTP polling for signaling
        console.log('Using HTTP polling for live tour signaling');
    }

    // Host Functions
    async startHosting() {
        try {
            this.isHost = true;
            this.roomId = this.generateRoomId();

            // Setup media if voice is enabled
            if (this.voiceEnabled) {
                await this.setupLocalMedia();
            }

            // Join room as host
            this.sendSocketMessage({
                type: 'create_room',
                roomId: this.roomId,
                tourId: currentTour?.id,
                hostName: 'Tour Guide'
            });

            this.showHostControls();
            this.showParticipantsPanel();

            console.log('Started hosting tour with room ID:', this.roomId);

        } catch (error) {
            console.error('Failed to start hosting:', error);
            alert('Failed to start hosting tour. Please check your permissions.');
        }
    }

    showHostControls() {
        document.getElementById('liveTourOptions').style.display = 'none';
        document.getElementById('hostControls').style.display = 'block';
        document.getElementById('modalCloseContainer').style.display = 'none';
        document.getElementById('currentRoomId').textContent = this.roomId;
    }

    // Guest Functions
    showJoinForm() {
        document.getElementById('liveTourOptions').style.display = 'none';
        document.getElementById('joinTourForm').style.display = 'block';
    }

    hideJoinForm() {
        document.getElementById('liveTourOptions').style.display = 'block';
        document.getElementById('joinTourForm').style.display = 'none';
    }

    async joinTour() {
        const roomId = document.getElementById('roomIdInput').value.trim();
        const participantName = document.getElementById('participantNameInput').value.trim();

        if (!roomId || !participantName) {
            alert('Please enter both room ID and your name');
            return;
        }

        try {
            this.isGuest = true;
            this.roomId = roomId;
            this.participantName = participantName;

            this.sendSocketMessage({
                type: 'join_room',
                roomId: this.roomId,
                participantName: this.participantName
            });

            this.closeLiveTourModal();
            this.showParticipantsPanel();
            this.showChatInterface();

            console.log('Joined tour room:', roomId);

        } catch (error) {
            console.error('Failed to join tour:', error);
            alert('Failed to join tour. Please check the room ID.');
        }
    }

    // WebRTC Functions
    async setupLocalMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });

            console.log('Local media stream obtained');
            return this.localStream;

        } catch (error) {
            console.error('Failed to get user media:', error);
            throw error;
        }
    }

    async createPeerConnection(participantId) {
        const pc = new RTCPeerConnection(this.config);

        // Add local stream if available
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track from:', participantId);
            this.remoteStreams.set(participantId, event.streams[0]);
            this.playRemoteAudio(participantId, event.streams[0]);
        };

        // Handle data channel
        pc.ondatachannel = (event) => {
            const channel = event.channel;
            this.setupDataChannel(participantId, channel);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSocketMessage({
                    type: 'ice_candidate',
                    roomId: this.roomId,
                    targetId: participantId,
                    candidate: event.candidate
                });
            }
        };

        // Create data channel for tour synchronization
        if (this.isHost) {
            const dataChannel = pc.createDataChannel('tour_sync');
            this.setupDataChannel(participantId, dataChannel);
        }

        this.peerConnections.set(participantId, pc);
        return pc;
    }

    setupDataChannel(participantId, channel) {
        channel.onopen = () => {
            console.log('Data channel opened with:', participantId);
            this.dataChannels.set(participantId, channel);
        };

        channel.onmessage = (event) => {
            this.handleDataChannelMessage(participantId, JSON.parse(event.data));
        };
    }

    // Tour Synchronization
    broadcastTourState() {
        if (!this.isHost) return;

        const state = {
            type: 'tour_sync',
            sceneId: currentScene?.id,
            viewerPosition: this.getCurrentViewerPosition(),
            timestamp: Date.now()
        };

        this.dataChannels.forEach((channel, participantId) => {
            if (channel.readyState === 'open') {
                channel.send(JSON.stringify(state));
            }
        });
    }

    handleTourSync(data) {
        if (!this.isGuest || !this.tourState.isFollowMode) return;

        // Sync to host's scene
        if (data.sceneId && data.sceneId !== currentScene?.id) {
            if (typeof loadScene === 'function') {
                loadScene(data.sceneId);
            }
        }

        // Sync viewer position with delay to avoid jarring movements
        if (data.viewerPosition && viewer) {
            this.smoothPanTo(data.viewerPosition);
        }
    }

    smoothPanTo(targetPosition) {
        if (!viewer || !targetPosition) return;

        const currentPitch = viewer.getPitch();
        const currentYaw = viewer.getYaw();
        const targetPitch = targetPosition.pitch;
        const targetYaw = targetPosition.yaw;

        // Calculate shortest path for yaw (handling 360° wraparound)
        let yawDiff = targetYaw - currentYaw;
        if (yawDiff > 180) yawDiff -= 360;
        if (yawDiff < -180) yawDiff += 360;

        // Smooth animation
        const duration = 1000; // 1 second
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            const newPitch = currentPitch + (targetPitch - currentPitch) * easedProgress;
            const newYaw = currentYaw + yawDiff * easedProgress;

            viewer.setPitch(newPitch);
            viewer.setYaw(newYaw);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // Chat Functions
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        const chatData = {
            type: 'chat_message',
            roomId: this.roomId,
            message: message,
            sender: this.isHost ? 'Tour Guide' : this.participantName,
            timestamp: Date.now()
        };

        this.sendSocketMessage(chatData);
        this.displayChatMessage(chatData);

        input.value = '';
    }

    handleChatKeyPress(event) {
        if (event.key === 'Enter') {
            this.sendChatMessage();
        }
    }

    displayChatMessage(data) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = 'margin-bottom: 8px; padding: 6px; background: rgba(255,255,255,0.1); border-radius: 4px;';

        const time = new Date(data.timestamp).toLocaleTimeString();
        messageDiv.innerHTML = `
            <div style="font-size: 11px; opacity: 0.7; margin-bottom: 2px;">
                ${data.sender} • ${time}
            </div>
            <div>${data.message}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Socket Message Handling
    sendSocketMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }

    async handleSocketMessage(data) {
        switch (data.type) {
            case 'room_created':
                console.log('Room created successfully');
                break;

            case 'participant_joined':
                await this.handleParticipantJoined(data);
                break;

            case 'participant_left':
                this.handleParticipantLeft(data);
                break;

            case 'chat_message':
                if (data.sender !== (this.isHost ? 'Tour Guide' : this.participantName)) {
                    this.displayChatMessage(data);
                }
                break;

            case 'webrtc_offer':
                await this.handleWebRTCOffer(data);
                break;

            case 'webrtc_answer':
                await this.handleWebRTCAnswer(data);
                break;

            case 'ice_candidate':
                await this.handleICECandidate(data);
                break;

            case 'tour_ended':
                this.handleTourEnded();
                break;
        }
    }

    async handleParticipantJoined(data) {
        this.participants.set(data.participantId, data.participantName);
        this.updateParticipantsList();

        if (this.isHost) {
            // Create peer connection for new participant
            const pc = await this.createPeerConnection(data.participantId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            this.sendSocketMessage({
                type: 'webrtc_offer',
                roomId: this.roomId,
                targetId: data.participantId,
                offer: offer
            });
        }
    }

    handleParticipantLeft(data) {
        this.participants.delete(data.participantId);
        this.peerConnections.delete(data.participantId);
        this.dataChannels.delete(data.participantId);
        this.remoteStreams.delete(data.participantId);
        this.updateParticipantsList();
    }

    async handleWebRTCOffer(data) {
        const pc = await this.createPeerConnection(data.senderId);
        await pc.setRemoteDescription(data.offer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.sendSocketMessage({
            type: 'webrtc_answer',
            roomId: this.roomId,
            targetId: data.senderId,
            answer: answer
        });
    }

    async handleWebRTCAnswer(data) {
        const pc = this.peerConnections.get(data.senderId);
        if (pc) {
            await pc.setRemoteDescription(data.answer);
        }
    }

    async handleICECandidate(data) {
        const pc = this.peerConnections.get(data.senderId);
        if (pc) {
            await pc.addIceCandidate(data.candidate);
        }
    }

    handleDataChannelMessage(participantId, data) {
        switch (data.type) {
            case 'tour_sync':
                this.handleTourSync(data);
                break;
        }
    }

    // UI Functions
    showLiveTourModal() {
        document.getElementById('liveTourModal').classList.add('active');
    }

    closeLiveTourModal() {
        document.getElementById('liveTourModal').classList.remove('active');
    }

    showParticipantsPanel() {
        document.getElementById('participantsPanel').style.display = 'block';
    }

    toggleParticipantsPanel() {
        const panel = document.getElementById('participantsPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    showChatInterface() {
        document.getElementById('liveChatInterface').style.display = 'flex';
    }

    toggleChat() {
        const chat = document.getElementById('liveChatInterface');
        const isVisible = chat.style.display === 'flex';
        chat.style.display = isVisible ? 'none' : 'flex';
    }

    updateParticipantsList() {
        const container = document.getElementById('participantsList');
        const count = document.getElementById('participantCount');

        count.textContent = this.participants.size + (this.isHost ? 1 : 0);

        let html = '';

        // Add host
        if (this.isHost || this.participants.size > 0) {
            html += `
                <div style="padding: 6px; background: rgba(57, 255, 20, 0.2); border-radius: 4px; margin-bottom: 4px;">
                    <i class="fas fa-crown" style="color: #39FF14; margin-right: 6px;"></i>
                    Tour Guide ${this.isHost ? '(You)' : ''}
                </div>
            `;
        }

        // Add participants
        for (const [id, name] of this.participants) {
            const isYou = this.isGuest && name === this.participantName;
            html += `
                <div style="padding: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-bottom: 4px;">
                    <i class="fas fa-user" style="margin-right: 6px;"></i>
                    ${name} ${isYou ? '(You)' : ''}
                </div>
            `;
        }

        container.innerHTML = html;
    }

    toggleFollowMode() {
        this.tourState.isFollowMode = !this.tourState.isFollowMode;
        const btn = document.getElementById('followModeBtn');
        btn.textContent = `Follow Mode: ${this.tourState.isFollowMode ? 'ON' : 'OFF'}`;
        btn.className = this.tourState.isFollowMode
            ? 'flex-1 text-xs px-2 py-1 bg-primary text-black rounded'
            : 'flex-1 text-xs px-2 py-1 border border-gray-600 rounded';
    }

    toggleVoice() {
        this.voiceEnabled = document.getElementById('voiceEnabledCheck').checked;
        // Implementation would setup/destroy audio streams
    }

    copyRoomId() {
        navigator.clipboard.writeText(this.roomId).then(() => {
            showNotification('Room ID copied to clipboard!', 'success');
        });
    }

    endTour() {
        if (confirm('Are you sure you want to end the tour for all participants?')) {
            this.sendSocketMessage({
                type: 'end_tour',
                roomId: this.roomId
            });

            this.cleanup();
            this.closeLiveTourModal();
        }
    }

    handleTourEnded() {
        alert('The tour has been ended by the host.');
        this.cleanup();
    }

    cleanup() {
        // Close all peer connections
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();

        // Clear data channels
        this.dataChannels.clear();

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Reset state
        this.isHost = false;
        this.isGuest = false;
        this.roomId = null;
        this.participants.clear();

        // Hide UI elements
        document.getElementById('participantsPanel').style.display = 'none';
        document.getElementById('liveChatInterface').style.display = 'none';
    }

    // Utility Functions
    generateRoomId() {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    getCurrentViewerPosition() {
        if (typeof viewer !== 'undefined' && viewer) {
            return {
                pitch: viewer.getPitch(),
                yaw: viewer.getYaw(),
                fov: viewer.getHfov()
            };
        }
        return null;
    }

    playRemoteAudio(participantId, stream) {
        // Create audio element for remote participant
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
    }
}

// Initialize global live tour manager
const liveTourManager = new LiveTourManager();

// Integration with existing systems
if (typeof window !== 'undefined') {
    window.liveTourManager = liveTourManager;
}

// Hook into scene changes to broadcast state
document.addEventListener('sceneChanged', (e) => {
    if (liveTourManager.isHost) {
        setTimeout(() => {
            liveTourManager.broadcastTourState();
        }, 1000); // Give time for scene to load
    }
});

// Hook into viewer position changes
if (typeof viewer !== 'undefined') {
    let lastBroadcast = 0;
    document.addEventListener('viewerPositionChanged', () => {
        if (liveTourManager.isHost && Date.now() - lastBroadcast > 500) {
            liveTourManager.broadcastTourState();
            lastBroadcast = Date.now();
        }
    });
}

console.log('Live Tour Manager loaded');