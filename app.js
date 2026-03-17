document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initCalendar();
    initTodo();
    initNotes();
    initNavigation();
});

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const screens = document.querySelectorAll('.screen-container');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.getAttribute('data-screen');

            // Update buttons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update screens
            screens.forEach(s => s.classList.remove('active'));
            document.getElementById(`screen-${screenId}`).classList.add('active');

            // Specific refresh logic
            if (screenId === 'tasks') renderTodos();
            if (screenId === 'gantt') renderGantt(getTodos());
            if (screenId === 'calendar') renderCalendar();
        });
    });
}

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

    document.getElementById('eventModalTitle').textContent = `ログ - ${dateStr}`;
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
    const todos = getTodos();

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
            eventHtml += `<div class="cal-event">${escapeHTML(eventsDict[dateStr])}</div>`;
        }

        // Add Task markers to calendar
        const dayTasks = todos.filter(t => t.taskDueDate === dateStr);
        dayTasks.forEach(t => {
            eventHtml += `<div class="cal-event" style="background:rgba(0,123,255,0.3); border-left:2px solid #007bff;">[T] ${escapeHTML(t.subject)}</div>`;
        });

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

    const progressInput = document.getElementById('taskProgress');
    const progressValue = document.getElementById('progressValue');
    progressInput.addEventListener('input', () => {
        progressValue.textContent = progressInput.value;
    });

    document.getElementById('todoFilter').addEventListener('change', renderTodos);
    document.getElementById('todoFilterAssignee').addEventListener('change', renderTodos);

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
    const parentSelect = document.getElementById('taskParentId');
    const statSelect = document.getElementById('taskStatus');
    const prioSelect = document.getElementById('taskPriority');
    const assigneeInput = document.getElementById('taskAssignee');
    const progressInput = document.getElementById('taskProgress');
    const progressValueText = document.getElementById('progressValue');
    const startInput = document.getElementById('taskStartDate');
    const endInput = document.getElementById('taskDueDate');
    const descInput = document.getElementById('taskDesc');
    const delBtn = document.getElementById('taskDelBtn');

    const todos = getTodos();

    // Populate parent task options (don't allow self or nested children in a simple system)
    parentSelect.innerHTML = '<option value="">(なし / 親チケットとして登録)</option>';
    const availableParents = todos.filter(t => !t.parentId && (!taskId || t.id !== parseInt(taskId)));
    availableParents.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `#${t.id.toString().slice(-4)} ${t.subject}`;
        parentSelect.appendChild(opt);
    });

    if (taskId) {
        const task = todos.find(t => t.id === taskId);
        if (!task) return;
        title.textContent = `編集 #${taskId.toString().slice(-4)}`;
        idInput.value = task.id;
        subInput.value = task.subject;
        parentSelect.value = task.parentId || '';
        statSelect.value = task.status;
        prioSelect.value = task.priority;
        assigneeInput.value = task.assignee || '';
        progressInput.value = task.progress || 0;
        progressValueText.textContent = task.progress || 0;
        startInput.value = task.taskStartDate || '';
        endInput.value = task.taskDueDate || '';
        descInput.value = task.desc || '';
        delBtn.classList.remove('hidden');
    } else {
        title.textContent = '新規チケット';
        idInput.value = '';
        subInput.value = '';
        parentSelect.value = '';
        statSelect.value = 'New';
        prioSelect.value = 'Normal';
        assigneeInput.value = '';
        progressInput.value = 0;
        progressValueText.textContent = 0;
        startInput.value = '';
        endInput.value = '';
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
        parentId: document.getElementById('taskParentId').value ? parseInt(document.getElementById('taskParentId').value) : null,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        assignee: document.getElementById('taskAssignee').value.trim(),
        progress: parseInt(document.getElementById('taskProgress').value),
        taskStartDate: document.getElementById('taskStartDate').value,
        taskDueDate: document.getElementById('taskDueDate').value,
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
    updateAssigneeFilter(todos);
    closeTaskModal();
    renderTodos();
    renderCalendar();
}

function deleteTaskFromModal() {
    const id = document.getElementById('taskId').value;
    if (id) {
        let todos = getTodos();
        // Also clean parentId for children
        todos = todos.map(t => t.parentId === parseInt(id) ? { ...t, parentId: null } : t);
        todos = todos.filter(t => t.id !== parseInt(id));
        saveTodos(todos);
    }
    closeTaskModal();
    renderTodos();
    renderCalendar();
}

function updateAssigneeFilter(todos) {
    const filter = document.getElementById('todoFilterAssignee');
    const currentVal = filter.value;
    const assignees = [...new Set(todos.map(t => t.assignee).filter(a => a))];

    filter.innerHTML = '<option value="All">すべての担当者</option>';
    assignees.sort().forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        filter.appendChild(opt);
    });
    filter.value = assignees.includes(currentVal) ? currentVal : 'All';
}

function renderTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = '';
    const statusFilter = document.getElementById('todoFilter').value;
    const assigneeFilter = document.getElementById('todoFilterAssignee').value;
    let todos = getTodos();

    updateAssigneeFilter(todos);

    // Filter
    let filtered = todos;
    if (statusFilter !== 'All') {
        filtered = filtered.filter(t => t.status === statusFilter);
    }
    if (assigneeFilter !== 'All') {
        filtered = filtered.filter(t => t.assignee === assigneeFilter);
    }

    // Organization: Hierarchy
    const parents = filtered.filter(t => !t.parentId);
    const childrenMap = {};
    filtered.forEach(t => {
        if (t.parentId) {
            if (!childrenMap[t.parentId]) childrenMap[t.parentId] = [];
            childrenMap[t.parentId].push(t);
        }
    });

    // Sort parents by updated
    parents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    if (filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;padding:2rem;">チケットが見つかりません</td></tr>`;
    } else {
        const renderRow = (t, isChild = false) => {
            const tr = document.createElement('tr');
            tr.onclick = () => openTaskModal(t.id);
            if (isChild) tr.classList.add('child-row');

            const shortId = t.id.toString().slice(-4);
            const dateStr = t.taskDueDate || '-';
            const assignee = t.assignee || '-';
            const progress = t.progress || 0;

            const statMap = { 'New': '新規', 'In Progress': '進行中', 'Resolved': '完了' };
            const statClass = 'stat-' + t.status.replace(' ', '_');

            tr.innerHTML = `
                <td>#${shortId}</td>
                <td><span class="status-badge ${statClass}">${statMap[t.status] || t.status}</span></td>
                <td style="font-size:0.85rem;">${escapeHTML(assignee)}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}%</span>
                </td>
                <td class="task-subject ${isChild ? 'child-task-indent' : ''}">${escapeHTML(t.subject)}</td>
                <td style="color:#666; font-size:0.8rem;">${dateStr}</td>
            `;
            list.appendChild(tr);
        };

        parents.forEach(p => {
            renderRow(p);
            const children = childrenMap[p.id] || [];
            children.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            children.forEach(c => renderRow(c, true));
        });

        // Render orpaned children (if parent is filtered out)
        filtered.filter(t => t.parentId && !parents.find(p => p.id === t.parentId)).forEach(orph => renderRow(orph, true));
    }

    renderGantt(todos);
}

function renderGantt(todos) {
    const container = document.getElementById('ganttContainer');
    if (!container) return;
    container.innerHTML = '';

    const datedTasks = todos.filter(t => t.taskStartDate && t.taskDueDate);
    if (datedTasks.length === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center; padding:1rem;">日程が設定されたチケットがありません</p>';
        return;
    }

    let minDate = new Date(Math.min(...datedTasks.map(t => new Date(t.taskStartDate))));
    let maxDate = new Date(Math.max(...datedTasks.map(t => new Date(t.taskDueDate))));
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 5);

    const dayDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

    const headerRow = document.createElement('div');
    headerRow.className = 'gantt-header-row';
    const labelPad = document.createElement('div');
    labelPad.style.width = '200px';
    headerRow.appendChild(labelPad);

    for (let i = 0; i <= dayDiff; i++) {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        const dayEl = document.createElement('div');
        dayEl.className = 'gantt-header-day';
        dayEl.textContent = d.getDate();
        if (d.getDay() === 0) dayEl.style.color = 'var(--red)';
        if (d.getDay() === 6) dayEl.style.color = 'var(--cyan)';
        headerRow.appendChild(dayEl);
    }
    container.appendChild(headerRow);

    // Group tasks by person for Gantt if needed? User asked to "divide by person" (人でわける)
    // Let's sort by assignee first
    datedTasks.sort((a, b) => (a.assignee || '').localeCompare(b.assignee || ''));

    datedTasks.forEach(t => {
        const row = document.createElement('div');
        row.className = 'gantt-row';
        row.onclick = () => openTaskModal(t.id);

        const label = document.createElement('div');
        label.className = 'gantt-label';
        label.innerHTML = `<span style="color:#999;font-size:0.7rem;">${escapeHTML(t.assignee || '未設定')}</span><br>${escapeHTML(t.subject)}`;
        label.style.lineHeight = "1.2";
        row.appendChild(label);

        const timeline = document.createElement('div');
        timeline.className = 'gantt-timeline';

        const start = new Date(t.taskStartDate);
        const end = new Date(t.taskDueDate);

        const left = ((start - minDate) / (maxDate - minDate)) * 100;
        const width = ((end - start) / (maxDate - minDate)) * 100 + (100 / dayDiff);

        const bar = document.createElement('div');
        bar.className = 'gantt-bar';
        bar.style.left = left + '%';
        bar.style.width = width + '%';
        bar.textContent = `${t.progress}%`;

        if (t.status === 'Resolved' || t.progress === 100) {
            bar.style.background = '#28a745';
        } else if (t.progress > 0) {
            bar.style.background = 'linear-gradient(to right, var(--accent-color) ' + t.progress + '%, #ccc ' + t.progress + '%)';
            bar.style.color = '#333';
        }

        timeline.appendChild(bar);
        row.appendChild(timeline);
        container.appendChild(row);
    });
}

// ================= NOTES =================
function initNotes() {
    const area = document.getElementById('notesArea');
    if (!area) return;
    area.value = localStorage.getItem('sys_notes') || '';
    area.addEventListener('input', () => {
        localStorage.setItem('sys_notes', area.value);
    });
}

function initGitHub() { /* Disabled */ }

// Utility
function escapeHTML(str) {
    if (!str) return '';
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
