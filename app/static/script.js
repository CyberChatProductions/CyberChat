let ws = null;
let username = null;
let currentUser = null;

const usersBox = document.getElementById("users");
const messagesBox = document.getElementById("messages");

function login() {
    username = document.getElementById("nameInput").value.trim();
    if (!username) return;

    console.log("LOGIN:", username);

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";

    connectWS();
    loadUsers();
}

function connectWS() {
    console.log("CONNECT WS");

    const wsUrl =
        (location.protocol === "https:" ? "wss://" : "ws://")
        + location.host
        + "/ws";

    console.log("WS URL:", wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log("WS OPEN");
        ws.send(username);
    };

    ws.onerror = (e) => {
        console.log("WS ERROR", e);
    };

    ws.onclose = () => {
        console.log("WS CLOSED → reconnect in 2s");

        setTimeout(() => {
            connectWS();
        }, 2000);
    };

    ws.onmessage = (e) => {
        console.log("MSG:", e.data);

        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };
}

async function loadUsers() {
    try {
        const res = await fetch(`/users/${username}`);
        const users = await res.json();

        usersBox.innerHTML = "";

        users.forEach(u => {
            const div = document.createElement("div");
            div.className = "user";
            div.innerText = u;
            div.onclick = () => openChat(u);
            usersBox.appendChild(div);
        });

    } catch (e) {
        console.log("LOAD USERS ERROR", e);
    }
}

function addUser() {
    const name = prompt("Username:");
    if (!name) return;

    openChat(name);
}

async function openChat(user) {
    currentUser = user;
    messagesBox.innerHTML = "";

    try {
        const res = await fetch(`/history/${username}/${user}`);
        const history = await res.json();

        history.forEach(m => {
            addMessage(m.sender, m.content);
        });

    } catch (e) {
        console.log("HISTORY ERROR", e);
    }
}

function send() {
    const msg = document.getElementById("msgInput").value.trim();

    if (!msg) return;
    if (!currentUser) return;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log("WS NOT READY");
        return;
    }

    console.log("SEND:", currentUser, msg);

    ws.send(currentUser + "|" + msg);

    document.getElementById("msgInput").value = "";
}

function addMessage(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");
    div.innerText = msg;

    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}
