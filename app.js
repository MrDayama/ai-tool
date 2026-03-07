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

    document.getElementById('eventCancelBtn').addEventListener('click', closeEventModal);
    document.getElementById('eventSaveBtn').addEventListener('click', saveEventFromModal);
    document.getElementById('eventDelBtn').addEventListener('click', deleteEventFromModal);

    fetchHolidays();
}

function changeMonth(dir) {
    currentMonth += dir;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    else if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
}

function getEvents() {
    return JSON.parse(localStorage.getItem('sys_events') || '{}');
}

function saveEvents(eventsDict) {
    localStorage.setItem('sys_events', JSON.stringify(eventsDict));
}

function openEventModal(dateStr) {
    const events = getEvents();
    const existing = events[dateStr];

    document.getElementById('eventModalTitle').textContent = `LOG - ${dateStr}`;
    document.getElementById('eventDate').value = dateStr;
    const input = document.getElementById('eventDescInput');
    const delBtn = document.getElementById('eventDelBtn');

    if (existing) {
        input.value = existing;
        delBtn.classList.remove('hidden');
    } else {
        input.value = '';
        delBtn.classList.add('hidden');
    }

    document.getElementById('eventModal').classList.remove('hidden');
    input.focus();
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
}

function saveEventFromModal() {
    const dateStr = document.getElementById('eventDate').value;
    const desc = document.getElementById('eventDescInput').value.trim();
    if (!desc) { deleteEventFromModal(); return; }

    const events = getEvents();
    events[dateStr] = desc;
    saveEvents(events);
    closeEventModal();
    renderCalendar();
}

function deleteEventFromModal() {
    const dateStr = document.getElementById('eventDate').value;
    const events = getEvents();
    if (events[dateStr]) {
        delete events[dateStr];
        saveEvents(events);
    }
    closeEventModal();
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
    const eventsDict = getEvents();

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

        cell.onclick = () => openEventModal(dateStr);

        let eventHtml = '';
        if (eventsDict[dateStr]) {
            eventHtml = `<div class="cal-event">${escapeHTML(eventsDict[dateStr])}</div>`;
        }

        cell.innerHTML = `
            <span class="cal-day-num">${i}</span>
            ${holidayName ? `<span class="holiday-name">${holidayName}</span>` : ''}
            ${eventHtml}
        `;
        grid.appendChild(cell);
    }
}

// ================= TO-DO (ISSUE TRACKER) =================
function initTodo() {
    document.getElementById('todoAddBtn').addEventListener('click', () => openTaskModal());
    document.getElementById('taskCancelBtn').addEventListener('click', closeTaskModal);
    document.getElementById('taskSaveBtn').addEventListener('click', saveTaskFromModal);
    document.getElementById('taskDelBtn').addEventListener('click', deleteTaskFromModal);

    document.getElementById('todoFilter').addEventListener('change', renderTodos);
    renderTodos();
}

function getTodos() {
    return JSON.parse(localStorage.getItem('sys_todos_v2') || '[]');
}

function saveTodos(todos) {
    localStorage.setItem('sys_todos_v2', JSON.stringify(todos));
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('taskModal');
    const title = document.getElementById('modalTitle');
    const idInput = document.getElementById('taskId');
    const subInput = document.getElementById('taskSubject');
    const statSelect = document.getElementById('taskStatus');
    const prioSelect = document.getElementById('taskPriority');
    const descInput = document.getElementById('taskDesc');
    const delBtn = document.getElementById('taskDelBtn');

    if (taskId) {
        const task = getTodos().find(t => t.id === taskId);
        if (!task) return;
        title.textContent = `EDIT ISSUE #${taskId.toString().slice(-4)}`;
        idInput.value = task.id;
        subInput.value = task.subject;
        statSelect.value = task.status;
        prioSelect.value = task.priority;
        descInput.value = task.desc || '';
        delBtn.classList.remove('hidden');
    } else {
        title.textContent = 'NEW ISSUE';
        idInput.value = '';
        subInput.value = '';
        statSelect.value = 'New';
        prioSelect.value = 'Normal';
        descInput.value = '';
        delBtn.classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
}

function saveTaskFromModal() {
    const id = document.getElementById('taskId').value;
    const subject = document.getElementById('taskSubject').value.trim();
    if (!subject) return;

    let todos = getTodos();
    const newData = {
        subject: subject,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        desc: document.getElementById('taskDesc').value,
        updatedAt: new Date().toISOString()
    };

    if (id) {
        const tIndex = todos.findIndex(t => t.id === parseInt(id));
        if (tIndex > -1) {
            todos[tIndex] = { ...todos[tIndex], ...newData };
        }
    } else {
        todos.push({ id: Date.now(), createdAt: new Date().toISOString(), ...newData });
    }

    saveTodos(todos);
    closeTaskModal();
    renderTodos();
}

function deleteTaskFromModal() {
    const id = document.getElementById('taskId').value;
    if (id) {
        let todos = getTodos();
        todos = todos.filter(t => t.id !== parseInt(id));
        saveTodos(todos);
    }
    closeTaskModal();
    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = '';
    const filter = document.getElementById('todoFilter').value;
    let todos = getTodos();

    if (filter !== 'All') {
        todos = todos.filter(t => t.status === filter);
    }

    // Sort by updated descending
    todos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    if (todos.length === 0) {
        list.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:2rem;">[ NO ISSUES FOUND IN DATABASE ]</td></tr>`;
        return;
    }

    todos.forEach(t => {
        const tr = document.createElement('tr');
        tr.onclick = () => openTaskModal(t.id);

        const shortId = t.id.toString().slice(-4);
        const dateStr = new Date(t.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const statClass = 'stat-' + t.status.replace(' ', '_');
        const prioClass = 'prio-' + t.priority;

        tr.innerHTML = `
            <td>#${shortId}</td>
            <td><span class="status-badge ${statClass}">${t.status.toUpperCase()}</span></td>
            <td><span class="priority-badge ${prioClass}">${t.priority.toUpperCase()}</span></td>
            <td class="task-subject">${escapeHTML(t.subject)}</td>
            <td style="color:var(--text-dim); font-size:0.8rem;">${dateStr}</td>
        `;
        list.appendChild(tr);
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
