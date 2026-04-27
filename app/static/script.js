let ws = null;
let username = null;
let currentUser = null;

const usersBox = document.getElementById("users");
const messagesBox = document.getElementById("messages");

function login() {
    username = document.getElementById("nameInput").value.trim();
    if (!username) return;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";

    connectWS();
}

function connectWS() {
    const protocol = location.protocol === "https:" ? "wss" : "ws";

    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        console.log("WS OPEN");
        ws.send(username);
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };

    ws.onerror = (e) => {
        console.log("WS ERROR", e);
    };

    ws.onclose = () => {
        console.log("WS CLOSED");
    };
}

function safeSend(data) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log("WS NOT READY");
        return false;
    }
    ws.send(data);
    return true;
}

function addUser() {
    const name = prompt("Enter username:");
    if (!name) return;

    const div = document.createElement("div");
    div.className = "user";
    div.innerText = name;

    div.onclick = () => openChat(name);

    usersBox.appendChild(div);
}

function openChat(user) {
    currentUser = user;
    messagesBox.innerHTML = "";

    safeSend("history|" + user);
}

function send() {
    const msg = document.getElementById("msgInput").value.trim();

    if (!currentUser || !msg) return;

    const ok = safeSend(currentUser + "|" + msg);

    if (ok) {
        document.getElementById("msgInput").value = "";
    }
}

function addMessage(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");

    div.innerText = msg;

    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}
