let ws;
let username;
let currentChat;

const u = document.getElementById("u");
const p = document.getElementById("p");

const usersBox = document.getElementById("users");
const messages = document.getElementById("messages");
const msg = document.getElementById("msg");

// ---------------- AUTH ----------------
async function register() {
    await fetch("/register", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username:u.value, password:p.value})
    });

    alert("registered");
}

async function login() {
    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({username:u.value, password:p.value})
    });

    const data = await res.json();

    if (!data.ok) return alert("error");

    username = u.value;

    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "flex";

    connectWS();
    loadUsers();
}

// ---------------- WS ----------------
function connectWS() {
    const url = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws";

    ws = new WebSocket(url);

    ws.onopen = () => ws.send(username);

    ws.onmessage = (e) => {
        const [from, text] = e.data.split("|");

        if (from === currentChat) {
            addMsg(from, text);
        }
    };
}

// ---------------- USERS ----------------
async function loadUsers() {
    const res = await fetch("/users/" + username);
    const users = await res.json();

    usersBox.innerHTML = "";

    users.forEach(u => {
        const d = document.createElement("div");
        d.innerText = u;
        d.onclick = () => openChat(u);
        usersBox.appendChild(d);
    });
}

// ---------------- CHAT ----------------
async function openChat(u) {
    currentChat = u;

    messages.innerHTML = "";

    const res = await fetch(`/history/${username}/${u}`);
    const data = await res.json();

    data.forEach(m => addMsg(m.sender, m.content));
}

function send() {
    ws.send(currentChat + "|" + msg.value);
    msg.value = "";
}

function addMsg(sender, text) {
    const d = document.createElement("div");
    d.className = sender === username ? "me" : "other";
    d.innerText = text;

    messages.appendChild(d);
}
