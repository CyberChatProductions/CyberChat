let ws;
let username = null;
let currentChat = null;

const u = document.getElementById("u");
const p = document.getElementById("p");

const usersBox = document.getElementById("users");
const messages = document.getElementById("messages");
const msg = document.getElementById("msg");
const chatName = document.getElementById("chatName");

async function login() {
    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u.value, password: p.value})
    });

    const d = await res.json();
    if (!d.ok) return alert("wrong login");

    start(u.value);
}

async function register() {
    const res = await fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u.value, password: p.value})
    });

    const d = await res.json();
    if (!d.ok) return alert("user exists");

    alert("registered");
}

function start(name) {
    username = name;

    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "flex";

    connectWS();
    loadUsers();
}

function connectWS() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws`);

    ws.onopen = () => ws.send(username);

    ws.onmessage = (e) => {
        const [from, text] = e.data.split("|");
        if (from === currentChat) addMsg(from, text);
    };

    ws.onclose = () => setTimeout(connectWS, 2000);
}

async function loadUsers() {
    const res = await fetch(`/users/${username}`);
    const data = await res.json();

    usersBox.innerHTML = "";

    data.forEach(u => {
        const div = document.createElement("div");
        div.className = "user";
        div.innerText = u;

        div.onclick = () => openChat(u);

        usersBox.appendChild(div);
    });
}

async function openChat(user) {
    currentChat = user;
    chatName.innerText = user;

    messages.innerHTML = "";

    const res = await fetch(`/history/${username}/${user}`);
    const data = await res.json();

    data.forEach(m => addMsg(m.sender, m.content));
}

function send() {
    if (!ws || ws.readyState !== 1) return;
    if (!currentChat) return;

    const text = msg.value.trim();
    if (!text) return;

    ws.send(currentChat + "|" + text);

    addMsg(username, text);
    msg.value = "";
}

function addMsg(sender, text) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");
    div.innerText = text;
    messages.appendChild(div);
}
