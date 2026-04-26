let ws;
let username;
let currentUser = null;
let users = [];

function login() {
    username = document.getElementById("nameInput").value.trim();
    if (!username) return;

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        ws.send(username);
        loadDialogs(); // 🔥 ВАЖНО
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";
}

// 📌 загрузка диалогов (ПОСЛЕ ПЕРЕЗАХОДА ВСЁ ВОССТАНАВЛИВАЕТСЯ)
async function loadDialogs() {
    const res = await fetch(`/dialogs/${username}`);
    const data = await res.json();

    const box = document.getElementById("users");
    box.innerHTML = "";

    data.forEach(user => {
        addUser(user);
    });
}

// 📌 добавление пользователя в список
function addUser(name) {
    const box = document.getElementById("users");

    const div = document.createElement("div");
    div.className = "user";
    div.innerText = name;

    div.onclick = () => {
        currentUser = name;
        document.getElementById("messages").innerHTML = "";

        // 🔥 загрузка истории чата
        ws.send("history|" + name);
    };

    box.appendChild(div);
}

// 📌 кнопка "+"
function addUser() {
    const name = prompt("Username:");
    if (!name) return;

    addUser(name);
}

// 📤 отправка сообщения
function send() {
    const msg = document.getElementById("msgInput").value;
    if (!currentUser || !msg) return;

    ws.send(currentUser + "|" + msg);

    document.getElementById("msgInput").value = "";
}

// 💬 вывод сообщений
function addMessage(sender, msg) {
    const box = document.getElementById("messages");

    const div = document.createElement("div");

    if (sender === username) {
        div.style.textAlign = "right";
        div.innerText = msg;
    } else {
        div.style.textAlign = "left";
        div.innerText = sender + ": " + msg;
    }

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}
