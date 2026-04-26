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
        loadUsers();
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };

    ws.onclose = () => {
        console.log("WS CLOSED → reconnect in 2s");
        setTimeout(connectWS, 2000);
    };

    ws.onerror = (e) => {
        console.log("WS ERROR", e);
        ws.close();
    };
}

function safeSend(data) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log("WS NOT READY:", ws?.readyState);
        return false;
    }
    ws.send(data);
    return true;
}

async function loadUsers() {
    try {
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
    } catch (e) {
        console.log("loadUsers error", e);
    }
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
    currentUser = user;
    messagesBox.innerHTML = "";

    safeSend("history|" + user);
}

function send() {
    const msg = document.getElementById("msgInput").value;

    if (!currentUser || !msg) return;

    const ok = safeSend(currentUser + "|" + msg);

    if (ok) {
        document.getElementById("msgInput").value = "";
    }
}

function addMessage(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");

    div.innerText = sender === username ? msg : sender + ": " + msg;

    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}
