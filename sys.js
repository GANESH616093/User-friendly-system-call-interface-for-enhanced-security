



let currentUser = null;
let currentToken = null;
let totalCalls = 0;
let allowedCalls = 0;
let deniedCalls = 0;
let callHistory = [];


const users = {
    adminstrator: { 
        uid: 0, 
        role: 'Administrator', 
        password: 'admin123', 
        privileges: 'Full Access - ALL operations allowed',
        permissions: ['open', 'read', 'write', 'execve', 'fork', 'ptrace', 'socket','exit','kill','nice','getpid','getppid']
    },
    Kiran_dev: { 
        uid: 1001, 
        role: 'Developer', 
        password: 'dev456', 
        privileges: 'Read/Write access, No execve',
        permissions: ['open', 'read', 'write']
    },
    Rahul: { 
        uid: 1002, 
        role: 'Normal User', 
        password: 'rahul789', 
        privileges: 'Read-only access',
        permissions: ['open', 'read']
    },
    guest_user: { 
        uid: 1003, 
        role: 'Guest', 
        password: 'guest789', 
        privileges: 'Limited read access',
        permissions: ['open', 'read']
    },
    Unauthorized: { 
        uid: 2999, 
        role: 'Restricted', 
        password: 'malicious', 
        privileges: 'ALL operations blocked',
        permissions: []
    }
};

 
const policies = [
    { user: 'adminstrator', syscall: '*', action: 'allow', priority: 'High' },
    { user: 'Kiran_dev', syscall: 'open,read,write', action: 'allow', priority: 'Medium' },
    { user: 'Kiran_dev', syscall: 'execve', action: 'deny', priority: 'Medium' },
    { user: 'Rahul', syscall: 'open,read', action: 'allow', priority: 'Medium' },
    { user: 'Rahul', syscall: 'write,execve', action: 'deny', priority: 'Medium' },
    { user: 'guest_user', syscall: 'open,read', action: 'allow', priority: 'Low' },
    { user: 'guest_user', syscall: 'write,execve,fork', action: 'deny', priority: 'Low' },
    { user: 'Unauthorized', syscall: '*', action: 'deny', priority: 'High' },
    { user: '*', syscall: 'ptrace,socket,reboot', action: 'deny', priority: 'Default' }
];


document.addEventListener('DOMContentLoaded', function() {
    loadPolicyTable();
    addLog('🟢 Security System Initialized', 'system');
    addLog(`📋 Loaded ${policies.length} security policies`, 'system');
    addLog('🔐 Authentication system ready', 'system');
    updateStepDisplay(1);
    updateStatsDisplay();
});


function loadPolicyTable() {
    const tbody = document.getElementById('policyBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    policies.forEach(policy => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td style="padding: 8px;">${policy.user}</td>
            <td style="padding: 8px;">${policy.syscall}</td>
            <td style="padding: 8px;" class="${policy.action}">${policy.action.toUpperCase()}</td>
        `;
    });
}


function updateUserInfo() {
    const username = document.getElementById('userSelect').value;
    const user = users[username];
    
    if (user) {
        document.getElementById('infoUser').innerText = username;
        document.getElementById('infoUid').innerText = user.uid;
        document.getElementById('infoRole').innerText = user.role;
        document.getElementById('infoPriv').innerText = user.privileges;
    } else {
        document.getElementById('infoUser').innerText = '-';
        document.getElementById('infoUid').innerText = '-';
        document.getElementById('infoRole').innerText = '-';
        document.getElementById('infoPriv').innerText = '-';
    }
}


function login() {
    const username = document.getElementById('userSelect').value;
    const password = document.getElementById('password').value;

    if (!username) {
        showNotification('Please select a user', 'error');
        return;
    }

    const user = users[username];
    if (!user || user.password !== password) {
        showNotification('Invalid password! Access Denied', 'error');
        addLog(`❌ Authentication FAILED for user: ${username}`, 'system');
        return;
    }

    
    currentToken = generateToken();
    currentUser = username;

    
    document.getElementById('tokenDisplay').style.display = 'block';
    document.getElementById('authToken').innerText = currentToken;
    document.getElementById('secStatus').innerHTML = '🟢 ACTIVE';
    document.getElementById('secStatus').classList.add('active');
    document.getElementById('currentUser').innerText = username;
    document.getElementById('tokenShort').innerText = currentToken.substring(0, 12) + '...';

    
    addLog(`✅ User ${username} (${user.role}) authenticated successfully`, 'system');
    addLog(`🔑 Authentication token generated: ${currentToken.substring(0, 15)}...`, 'system');
    
    showNotification(`Welcome ${username}! Authentication successful`, 'success');

    
    setTimeout(() => {
        verifyUserPolicies();
        updateStepDisplay(3);
    }, 1000);
}


function generateToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const hash = btoa(random + timestamp).substring(0, 20);
    return `SEC_${hash}_${timestamp.toString(36)}`;
}


function verifyUserPolicies() {
    if (!currentUser) return;
    
    const userPolicies = policies.filter(p => p.user === currentUser || p.user === '*');
    const verifyDiv = document.getElementById('policyVerify');
    verifyDiv.style.display = 'block';
    
    const allowedCalls = [];
    const deniedCalls = [];
    
    userPolicies.forEach(p => {
        const syscalls = p.syscall.split(',');
        syscalls.forEach(sc => {
            if (p.action === 'allow' && sc !== '*') {
                allowedCalls.push(sc);
            } else if (p.action === 'deny' && sc !== '*') {
                deniedCalls.push(sc);
            }
        });
    });
    
    verifyDiv.innerHTML = `
        <strong>✅ User ${currentUser} - Policy Verification Complete</strong><br>
        📋 Found ${userPolicies.length} applicable security policies<br>
        ✅ Allowed Operations: ${allowedCalls.length > 0 ? allowedCalls.join(', ') : 'Based on policies'}<br>
        ❌ Denied Operations: ${deniedCalls.length > 0 ? deniedCalls.join(', ') : 'Dangerous calls blocked'}<br>
        🔐 Security Clearance: ${getSecurityClearance(currentUser)}
    `;
    
    addLog(`🔍 Verified ${userPolicies.length} policies for ${currentUser}`, 'system');
}


function getSecurityClearance(user) {
    const levels = {
        adminstrator: 'TOP SECRET - Full System Access',
        Kiran_dev: 'SECRET - Developer Access',
        Rahul: 'CONFIDENTIAL - User Access',
        guest_user: 'RESTRICTED - Limited Access',
        Unauthorized: 'BLOCKED - No Access'
    };
    return levels[user] || 'RESTRICTED';
}


function testSyscall(syscallName, argument, type) {
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        addLog(`❌ ${syscallName}() blocked - No active session`, 'system');
        return;
    }

    const allowed = checkPermission(currentUser, syscallName);
    const timestamp = new Date().toLocaleTimeString();
    const user = users[currentUser];

    
    totalCalls++;
    if (allowed) {
        allowedCalls++;
        addLog(`✅ ${syscallName}(${argument}) - User: ${currentUser} (UID:${user.uid}) - ACCESS ALLOWED`, 'allowed');
        showNotification(`✅ ${syscallName}() - ACCESS ALLOWED`, 'success');
    } else {
        deniedCalls++;
        addLog(`❌ ${syscallName}(${argument}) - User: ${currentUser} (UID:${user.uid}) - ACCESS DENIED by security policy`, 'denied');
        showNotification(`❌ ${syscallName}() - ACCESS DENIED`, 'error');
    }

    
    callHistory.push({
        timestamp: timestamp,
        syscall: syscallName,
        argument: argument,
        user: currentUser,
        uid: user.uid,
        allowed: allowed,
        sessionId: currentToken
    });


    updateStatsDisplay();
    updateStepDisplayBasedOnType(type);
}


function checkPermission(username, syscallName) {
    
    if (username === 'admin') return true;
    
    
    for (let policy of policies) {
        if (policy.user === username || policy.user === '*') {
            const syscalls = policy.syscall.split(',');
            if (syscalls[0] === '*' || syscalls.includes(syscallName)) {
                return policy.action === 'allow';
            }
        }
    }
    return false; 
}


function testCustom() {
    const callName = document.getElementById('customCall').value.trim();
    const argument = document.getElementById('customArg').value.trim();
    
    if (!callName) {
        showNotification('Please enter a system call name', 'error');
        return;
    }
    
    testSyscall(callName, argument || 'custom', 'custom');
    
    
    document.getElementById('customCall').value = '';
    document.getElementById('customArg').value = '';
}


function addLog(message, type) {
    const container = document.getElementById('logContainer');
    if (!container) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = `
        <span class="log-time">${timestamp}</span>
        <span class="log-msg">${message}</span>
        <span class="log-status">${type === 'allowed' ? 'ALLOWED' : type === 'denied' ? 'DENIED' : 'INFO'}</span>
    `;
    
    container.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
    
    
    while (container.children.length > 100) {
        container.removeChild(container.firstChild);
    }
}


function clearLogs() {
    const container = document.getElementById('logContainer');
    if (container) {
        container.innerHTML = `
            <div class="log-entry system">
                <span class="log-time">System</span>
                <span class="log-msg">🗑️ Logs cleared by administrator</span>
                <span class="log-status">CLEARED</span>
            </div>
        `;
    }
    addLog('Audit logs have been cleared', 'system');
    showNotification('Logs cleared successfully', 'success');
}

function exportLogs() {
    const exportData = {
        exportTime: new Date().toISOString(),
        sessionInfo: {
            user: currentUser,
            token: currentToken,
            totalCalls: totalCalls,
            allowedCalls: allowedCalls,
            deniedCalls: deniedCalls,
            securityRate: totalCalls > 0 ? ((allowedCalls / totalCalls) * 100).toFixed(1) : 100
        },
        callHistory: callHistory,
        activePolicies: policies
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_audit_${currentUser || 'system'}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    addLog(`📥 Audit logs exported to JSON (${callHistory.length} events)`, 'system');
    showNotification('Logs exported successfully!', 'success');
}


function updateStatsDisplay() {
    document.getElementById('totalCalls').innerText = totalCalls;
    document.getElementById('allowedCalls').innerText = allowedCalls;
    document.getElementById('deniedCalls').innerText = deniedCalls;
    
    const securityRate = totalCalls > 0 ? ((allowedCalls / totalCalls) * 100).toFixed(1) : 100;
    document.getElementById('securityRate').innerHTML = securityRate + '%';
    
    
    const rateElement = document.getElementById('securityRate');
    if (securityRate >= 80) {
        rateElement.style.color = '#10b981';
    } else if (securityRate >= 50) {
        rateElement.style.color = '#f59e0b';
    } else {
        rateElement.style.color = '#ef4444';
    }
}


function updateStepDisplay(step) {
    const stepDisplay = document.getElementById('stepDisplay');
    if (stepDisplay) {
        stepDisplay.innerText = `${step}/8`;
    }
}


function updateStepDisplayBasedOnType(type) {
    if (type === 'read') {
        updateStepDisplay(4);
        setTimeout(() => updateStepDisplay(5), 1500);
    } else if (type === 'write') {
        updateStepDisplay(5);
        setTimeout(() => updateStepDisplay(6), 1500);
    } else if (type === 'exec') {
        updateStepDisplay(6);
        setTimeout(() => updateStepDisplay(7), 1500);
    }
}


function generateReport() {
    const securityRate = totalCalls > 0 ? ((allowedCalls / totalCalls) * 100).toFixed(1) : 100;
    const threatLevel = deniedCalls > 10 ? 'HIGH' : (deniedCalls > 5 ? 'MEDIUM' : 'LOW');
    const threatColor = threatLevel === 'HIGH' ? '#ef4444' : (threatLevel === 'MEDIUM' ? '#f59e0b' : '#10b981');
    
    const summaryBox = document.getElementById('summaryBox');
    if (summaryBox) {
        summaryBox.innerHTML = `
            <strong>📊 FINAL SECURITY REPORT</strong><br><br>
            
            <strong>📈 Session Statistics:</strong><br>
            • Total System Calls: ${totalCalls}<br>
            • ✅ Allowed Operations: ${allowedCalls}<br>
            • ❌ Denied Operations: ${deniedCalls}<br>
            • Security Compliance Rate: ${securityRate}%<br><br>
            
            <strong>👤 User Information:</strong><br>
            • User: ${currentUser || 'Not logged in'}<br>
            • Role: ${currentUser ? users[currentUser]?.role : 'N/A'}<br>
            • UID: ${currentUser ? users[currentUser]?.uid : 'N/A'}<br>
            • Session Token: ${currentToken ? currentToken.substring(0, 20) + '...' : 'N/A'}<br><br>
            
            <strong>🛡️ Security Assessment:</strong><br>
            • Threat Level: <span style="color: ${threatColor}">${threatLevel}</span><br>
            • Policy Enforcement: ${securityRate > 80 ? 'Excellent' : securityRate > 50 ? 'Good' : 'Needs Improvement'}<br>
            • Audit Trail: ${callHistory.length} events recorded<br>
            • Security Policies: ${policies.length} active rules<br><br>
            
            <strong>✅ Project Requirements Met:</strong><br>
            1. ✓ User Authentication with Token Generation<br>
            2. ✓ Policy-Based Access Control<br>
            3. ✓ System Call Interception (open, read, write, execve)<br>
            4. ✓ Real-time Authorization Enforcement<br>
            5. ✓ Comprehensive Audit Logging<br>
            6. ✓ Exportable JSON Logs<br>
            7. ✓ User-Friendly Interface<br><br>
            
            <strong>🔒 Conclusion:</strong><br>
            The Enhanced Security System Call Interface successfully demonstrates<br>
            robust authentication, fine-grained access control, and complete<br>
            audit trail capabilities for system call monitoring.
        `;
    }
    
    addLog('📊 Final security report generated', 'system');
    updateStepDisplay(8);
    showNotification('Security report generated!', 'success');
}


function resetDemo() {
    
    currentUser = null;
    currentToken = null;
    totalCalls = 0;
    allowedCalls = 0;
    deniedCalls = 0;
    callHistory = [];
    
   
    document.getElementById('userSelect').value = '';
    document.getElementById('password').value = '';
    document.getElementById('tokenDisplay').style.display = 'none';
    document.getElementById('secStatus').innerHTML = '🟢 INITIALIZED';
    document.getElementById('secStatus').classList.remove('active');
    document.getElementById('currentUser').innerText = 'Not logged in';
    document.getElementById('tokenShort').innerText = '-';
    document.getElementById('policyVerify').style.display = 'none';
    
    
    document.getElementById('infoUser').innerText = '-';
    document.getElementById('infoUid').innerText = '-';
    document.getElementById('infoRole').innerText = '-';
    document.getElementById('infoPriv').innerText = '-';
    
    
    const container = document.getElementById('logContainer');
    if (container) {
        container.innerHTML = `
            <div class="log-entry system">
                <span class="log-time">System</span>
                <span class="log-msg">🟢 Security System Reinitialized</span>
                <span class="log-status">RESET</span>
            </div>
            <div class="log-entry system">
                <span class="log-time">System</span>
                <span class="log-msg">📋 Loading security policies...</span>
                <span class="log-status">LOADING</span>
            </div>
        `;
    }
    
    
    const summaryBox = document.getElementById('summaryBox');
    if (summaryBox) {
        summaryBox.innerHTML = '<strong>📋 Summary</strong><br>Login and run tests to generate report...';
    }
    
    
    updateStatsDisplay();
    updateStepDisplay(1);
    
    addLog('🔄 System reset - Starting fresh session', 'system');
    showNotification('Demo has been reset!', 'info');
}


function showNotification(message, type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = colors[type] || '#667eea';
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}


if (!document.querySelector('#dynamicStyles')) {
    const style = document.createElement('style');
    style.id = 'dynamicStyles';
    style.textContent = `
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}