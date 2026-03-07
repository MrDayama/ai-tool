document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initCalendar();
    initTodo();
    initNotes();
    initGitHub();
});

// ================= CLOCK =================
function initClock() {
    const clockEl = document.getElementById('clock');
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }, 1000);
}

// ================= CALENDAR =================
let holidaysData = {};
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

async function fetchHolidays() {
    try {
        const res = await fetch('https://holidays-jp.github.io/api/v1/date.json');
        holidaysData = await res.json();
        renderCalendar();
    } catch (e) {
        console.error("Failed to fetch holidays", e);
        renderCalendar(); // render without holidays if failed
    }
}

function initCalendar() {
    document.getElementById('prevBtn').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextBtn').addEventListener('click', () => changeMonth(1));
    fetchHolidays();
}

function changeMonth(dir) {
    currentMonth += dir;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    else if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('monthYear');
    grid.innerHTML = '';

    // YYYY-MM display
    label.textContent = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // Header row
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    days.forEach((d, i) => {
        const h = document.createElement('div');
        h.className = 'cal-header-cell';
        if (i === 0) h.classList.add('text-sun');
        if (i === 6) h.classList.add('text-sat');
        h.textContent = d;
        grid.appendChild(h);
    });

    const today = new Date();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Blanks
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'cal-cell blank';
        grid.appendChild(blank);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell';

        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayOfWeek = (firstDay + i - 1) % 7;

        if (dayOfWeek === 0) cell.classList.add('is-sunday');
        if (dayOfWeek === 6) cell.classList.add('is-saturday');

        let holidayName = holidaysData[dateStr];
        if (holidayName) {
            cell.classList.add('is-holiday');
        }

        if (today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === i) {
            cell.classList.add('today');
        }

        cell.innerHTML = `
            <span class="cal-day-num">${i}</span>
            ${holidayName ? `<span class="holiday-name">${holidayName}</span>` : ''}
        `;
        grid.appendChild(cell);
    }
}

// ================= TO-DO =================
function initTodo() {
    const todoInput = document.getElementById('todoInput');
    const addBtn = document.getElementById('todoAddBtn');

    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTodo(); });

    renderTodos();
}

function getTodos() {
    return JSON.parse(localStorage.getItem('sys_todos') || '[]');
}

function saveTodos(todos) {
    localStorage.setItem('sys_todos', JSON.stringify(todos));
}

function addTodo() {
    const el = document.getElementById('todoInput');
    const text = el.value.trim();
    if (!text) return;

    const todos = getTodos();
    todos.push({ text, done: false, id: Date.now() });
    saveTodos(todos);
    el.value = '';
    renderTodos();
}

function toggleTodo(id) {
    const todos = getTodos();
    const t = todos.find(t => t.id === id);
    if (t) {
        t.done = !t.done;
        saveTodos(todos);
        renderTodos();
    }
}

function deleteTodo(id) {
    let todos = getTodos();
    todos = todos.filter(t => t.id !== id);
    saveTodos(todos);
    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = '';
    const todos = getTodos();

    todos.forEach(t => {
        const li = document.createElement('li');
        li.className = 'todo-item' + (t.done ? ' done' : '');

        li.innerHTML = `
            <span class="todo-text" onclick="toggleTodo(${t.id})">
                ${t.done ? '[x]' : '[ ]'} ${escapeHTML(t.text)}
            </span>
            <button class="todo-del" onclick="deleteTodo(${t.id})">X</button>
        `;
        list.appendChild(li);
    });
}

// ================= NOTES =================
function initNotes() {
    const area = document.getElementById('notesArea');
    area.value = localStorage.getItem('sys_notes') || '';

    area.addEventListener('input', () => {
        localStorage.setItem('sys_notes', area.value);
    });
}

// ================= GITHUB =================
function initGitHub() {
    const btn = document.getElementById('ghFetchBtn');
    const input = document.getElementById('ghUsername');

    // load last user
    const lastUser = localStorage.getItem('sys_gh_user') || 'MrDayama';
    input.value = lastUser;

    btn.addEventListener('click', () => fetchGitHubEvents(input.value.trim()));
    input.addEventListener('keypress', e => { if (e.key === 'Enter') fetchGitHubEvents(input.value.trim()); });

    fetchGitHubEvents(lastUser);
}

async function fetchGitHubEvents(username) {
    if (!username) return;
    localStorage.setItem('sys_gh_user', username);
    const container = document.getElementById('ghActivity');
    container.innerHTML = `<div class="glitch-text" style="color:var(--text-dim);">FETCHING DATA FROM HUB...</div>`;

    try {
        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public`);
        if (!res.ok) throw new Error('User not found or rate limit');
        const events = await res.json();

        if (events.length === 0) {
            container.innerHTML = '<div>NO RECENT ACTIVITY DETECTED.</div>';
            return;
        }

        container.innerHTML = '';
        // limit to 8
        events.slice(0, 8).forEach(ev => {
            const div = document.createElement('div');
            div.className = 'gh-event';
            const date = new Date(ev.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            let actionText = ev.type;
            if (ev.type === 'PushEvent') actionText = `Pushed to`;
            else if (ev.type === 'WatchEvent') actionText = `Starred`;
            else if (ev.type === 'CreateEvent') actionText = `Created`;
            else if (ev.type === 'ForkEvent') actionText = `Forked`;
            else if (ev.type === 'IssuesEvent') actionText = `${ev.payload.action} issue in`;
            else if (ev.type === 'PullRequestEvent') actionText = `${ev.payload.action} PR in`;
            else if (ev.type === 'PullRequestReviewEvent') actionText = `${ev.payload.action} PR review in`;
            else if (ev.type === 'DeleteEvent') actionText = `Deleted ${ev.payload.ref_type} in`;
            else if (ev.type === 'IssueCommentEvent') actionText = `${ev.payload.action} comment in`;

            div.innerHTML = `
                <div class="gh-repo">${actionText} <a href="https://github.com/${escapeHTML(ev.repo.name)}" target="_blank" rel="noopener noreferrer" style="color:var(--primary); text-decoration:underline;"><b>${escapeHTML(ev.repo.name)}</b></a></div>
                <div class="gh-date">${date}</div>
            `;
            container.appendChild(div);
        });

    } catch (e) {
        container.innerHTML = `<div style="color:var(--red);">ERROR: ${e.message}</div>`;
    }
}

// Utility
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}
