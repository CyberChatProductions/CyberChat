let ws;
let username;
let currentUser = null;

const usersBox = document.getElementById("users");
const messagesBox = document.getElementById("messages");

function login() {
    username = document.getElementById("nameInput").value.trim();
    if (!username) return;

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        console.log("WS OPEN");
        ws.send(username);
        loadUsers();
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };

    ws.onerror = (e) => console.log("WS ERROR", e);
    ws.onclose = () => console.log("WS CLOSED");

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";
}

async function loadUsers() {
    const res = await fetch("/users");
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

function addUser() {
    const name = prompt("username:");
    if (!name) return;

    const div = document.createElement("div");
    div.className = "user";
    div.innerText = name;

    div.onclick = () => openChat(name);

    usersBox.appendChild(div);
}

function openChat(user) {
    if (!ws || ws.readyState !== 1) {
        console.log("WS NOT READY");
        return;
    }

    currentUser = user;
    messagesBox.innerHTML = "";

    ws.send("history|" + user);
}

function send() {
    const msg = document.getElementById("msgInput").value;

    if (!currentUser || !msg) return;

    if (!ws || ws.readyState !== 1) {
        console.log("WS NOT READY");
        return;
    }

    ws.send(currentUser + "|" + msg);
    document.getElementById("msgInput").value = "";
}

function addMessage(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");

    div.innerText = sender === username ? msg : sender + ": " + msg;

    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}
