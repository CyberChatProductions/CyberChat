let ws;
let username = null;
let currentChat = null;
let chats = [];

const usersBox = document.getElementById("users");
const messages = document.getElementById("messages");
const msg = document.getElementById("msg");
const chatName = document.getElementById("chatName");

// AUTH
async function login() {
    const u = document.getElementById("u").value;
    const p = document.getElementById("p").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u, password: p})
    });

    const d = await res.json();
    if (!d.ok) return alert("wrong login");

    start(u);
}

async function register() {
    const u = document.getElementById("u").value;
    const p = document.getElementById("p").value;

    const res = await fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u, password: p})
    });

    const d = await res.json();
    if (!d.ok) return alert("user exists");

    alert("registered");
}

// START
function start(name) {
    username = name;

    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "flex";

    connectWS();
    loadUsers();
}

// WS
function connectWS() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws`);

    ws.onopen = () => ws.send(username);

    ws.onmessage = (e) => {
        const [from, text] = e.data.split("|");

        if (!chats.includes(from)) {
            chats.push(from);
            renderUsers();
        }

        if (from === currentChat) addMsg(from, text);
    };

    ws.onclose = () => setTimeout(connectWS, 2000);
}

// USERS
async function loadUsers() {
    const res = await fetch(`/users/${username}`);
    chats = await res.json();
    renderUsers();
}

function renderUsers() {
    usersBox.innerHTML = "";

    chats.forEach(u => {
        const div = document.createElement("div");
        div.className = "user";
        div.innerText = u;

        div.onclick = () => openChat(u);

        usersBox.appendChild(div);
    });
}

// ADD USER
function openAdd() {
    document.getElementById("addModal").style.display = "flex";
}

function closeAdd() {
    document.getElementById("addModal").style.display = "none";
}

function addUser() {
    const u = document.getElementById("newUser").value.trim();
    if (!u) return;

    if (!chats.includes(u)) {
        chats.push(u);
        renderUsers();
    }

    closeAdd();
}

// CHAT
async function openChat(user) {
    currentChat = user;
    chatName.innerText = user;

    messages.innerHTML = "";

    const res = await fetch(`/history/${username}/${user}`);
    const data = await res.json();

    data.forEach(m => addMsg(m.sender, m.content));
}

// SEND
function send() {
    if (!ws || ws.readyState !== 1) return;
    if (!currentChat) return;

    const text = msg.value.trim();
    if (!text) return;

    ws.send(currentChat + "|" + text);

    addMsg(username, text);
    msg.value = "";
}

// UI
function addMsg(sender, text) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");
    div.innerText = text;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// SETTINGS
function openSettings() {
    document.getElementById("settingsModal").style.display = "flex";
}

function closeSettings() {
    document.getElementById("settingsModal").style.display = "none";
}

function logout() {
    location.reload();
}
