let ws;
let username;
let currentChat;

// ---------------- DEVICE ----------------
function getDeviceId() {
    let id = localStorage.getItem("device_id");

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("device_id", id);
    }

    return id;
}

// ---------------- AUTO LOGIN ----------------
async function autoLogin() {
    const res = await fetch("/auto_login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({device_id: getDeviceId()})
    });

    const data = await res.json();

    if (data.ok) {
        username = data.username;
        enterApp();
    }
}

// ---------------- AUTH ----------------
async function register() {
    const u = usernameInput.value;
    const p = passwordInput.value;

    const res = await fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u, password: p})
    });

    const data = await res.json();

    if (!data.ok) return alert("register error");

    alert("registered");
}

async function login() {
    const u = usernameInput.value;
    const p = passwordInput.value;

    const res = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: u, password: p})
    });

    const data = await res.json();

    if (!data.ok) return alert("bad login");

    username = u;
    enterApp();
}

// ---------------- ENTER APP ----------------
function enterApp() {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "flex";

    connectWS();
    loadUsers();
    bindDevice();
}

// ---------------- DEVICE BIND ----------------
async function bindDevice() {
    await fetch("/bind_device", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username,
            device_id: getDeviceId(),
            ua: navigator.userAgent
        })
    });
}

// ---------------- WS ----------------
function connectWS() {
    const url =
        (location.protocol === "https:" ? "wss://" : "ws://")
        + location.host + "/ws";

    ws = new WebSocket(url);

    ws.onopen = () => ws.send(username);

    ws.onmessage = (e) => {
        const [from, msg] = e.data.split("|");

        if (from === currentChat) {
            addMsg(from, msg);
        }
    };
}

// ---------------- USERS ----------------
async function loadUsers() {
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
}

// ---------------- CHAT ----------------
async function openChat(u) {
    currentChat = u;

    chatName.innerText = u;
    messages.innerHTML = "";

    const res = await fetch(`/history/${username}/${u}`);
    const data = await res.json();

    data.forEach(m => addMsg(m.sender, m.content));
}

function send() {
    const msg = msgInput.value;
    if (!msg || !currentChat) return;

    ws.send(currentChat + "|" + msg);
    msgInput.value = "";
}

function addMsg(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");
    div.innerText = msg;

    messages.appendChild(div);
}
