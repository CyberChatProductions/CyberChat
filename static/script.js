let ws;
let username;
let currentChat = null;

let users = JSON.parse(localStorage.getItem("users") || "[]");

// 🔌 подключение (с поддержкой Render / HTTPS)
function connect() {
    username = localStorage.getItem("username");

    if (!username) {
        username = prompt("Enter your name:");
        if (!username) return;
        localStorage.setItem("username", username);
    }

    // ✅ ВАЖНО: ws / wss
    let protocol = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${protocol}://${location.host}/ws/${username}`);

    ws.onopen = () => {
        console.log("Connected to server");
    };

    ws.onmessage = (event) => {
        let data = JSON.parse(event.data);

        // показываем только текущий чат
        if (currentChat === data.from || currentChat === data.to) {
            addMessage(data);
        }
    };

    ws.onerror = (err) => {
        console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
        console.log("Disconnected. Reconnecting...");
        setTimeout(connect, 2000); // авто-переподключение
    };

    // ✅ Enter работает
    document.getElementById("msg").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            send();
        }
    });

    renderUsers();
}

// ➕ добавить пользователя
function addUser() {
    let name = prompt("User name:");

    if (!name || name === username || users.includes(name)) return;

    users.push(name);
    localStorage.setItem("users", JSON.stringify(users));
    renderUsers();
}

// 👥 отрисовка пользователей
function renderUsers() {
    let list = document.getElementById("userList");
    list.innerHTML = "";

    users.forEach(u => {
        if (u === username) return;

        let div = document.createElement("div");
        div.innerText = u;
        div.style.cursor = "pointer";
        div.style.padding = "6px";
        div.style.borderRadius = "6px";
        div.style.marginBottom = "5px";
        div.style.background = u === currentChat ? "#0078ff" : "#333";
        div.style.color = "white";

        div.onclick = () => {
            currentChat = u;
            document.getElementById("chat").innerHTML = "";
            renderUsers();
        };

        list.appendChild(div);
    });
}

// 💬 отправка
function send() {
    let text = document.getElementById("msg").value;

    if (!currentChat) {
        alert("Выбери пользователя слева 👈");
        return;
    }

    if (!text.trim()) return;

    if (ws.readyState !== WebSocket.OPEN) {
        alert("Нет соединения с сервером 😢");
        return;
    }

    ws.send(JSON.stringify({
        to: currentChat,
        text: text
    }));

    document.getElementById("msg").value = "";
}

// 🧾 отображение сообщений
function addMessage(data) {
    let div = document.createElement("div");
    div.classList.add("msg");

    if (data.from === username) {
        div.classList.add("right");
        div.innerText = data.text;
    } else {
        div.classList.add("left");
        div.innerText = data.from + ": " + data.text;
    }

    let chat = document.getElementById("chat");
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

// 🚀 старт
connect();