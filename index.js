const toggleBtn = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    const htmlEl = document.documentElement;

    function setTheme(mode) {
      if (mode === 'dark') {
        htmlEl.classList.add('dark');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      } else {
        htmlEl.classList.remove('dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      }
    }

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

    toggleBtn.addEventListener('click', () => {
      const isDark = htmlEl.classList.contains('dark');
      const newTheme = isDark ? 'light' : 'dark';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
 
 document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const taskInput = document.getElementById('task-input');
            const taskList = document.getElementById('task-list');
            const emptyState = document.getElementById('empty-state');
            const prioritySelector = document.getElementById('priority-selector');
            const themeToggle = document.getElementById('theme-toggle');
            const filterAll = document.getElementById('filter-all');
            const filterActive = document.getElementById('filter-active');
            const filterCompleted = document.getElementById('filter-completed');
            const clearCompleted = document.getElementById('clear-completed');
            const streakCount = document.getElementById('streak-count');
            const stats = document.getElementById('stats');
            
            // State
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let currentFilter = 'all';
            let currentPriority = null;
            let darkMode = localStorage.getItem('darkMode') === 'true';
            let draggedItem = null;

            // Initialize
            if (darkMode) {
                document.documentElement.classList.add('dark');
                themeToggle.innerHTML = '<i class="fas fa-sun text-yellow-300"></i>';
            }
            updateStats();
            renderTasks();
            updateEmptyState();

            // Event Listeners
            taskInput.addEventListener('focus', showPrioritySelector);
            taskInput.addEventListener('blur', hidePrioritySelector);
            taskInput.addEventListener('keypress', handleTaskInputKeypress);
            
            prioritySelector.querySelectorAll('.priority-btn').forEach(btn => {
                btn.addEventListener('click', setPriority);
            });
            
            themeToggle.addEventListener('click', toggleTheme);
            
            filterAll.addEventListener('click', () => setFilter('all'));
            filterActive.addEventListener('click', () => setFilter('active'));
            filterCompleted.addEventListener('click', () => setFilter('completed'));
            
            clearCompleted.addEventListener('click', clearCompletedTasks);

            // Functions
            function showPrioritySelector() {
                prioritySelector.classList.remove('hidden');
            }
            
            function hidePrioritySelector() {
                // Small delay to allow priority button clicks
                setTimeout(() => {
                    prioritySelector.classList.add('hidden');
                }, 200);
            }
            
            function setPriority(e) {
                const priority = e.currentTarget.dataset.priority;
                currentPriority = priority;
                
                // Update active state
                prioritySelector.querySelectorAll('.priority-btn').forEach(btn => {
                    btn.classList.remove('bg-opacity-20');
                });
                e.currentTarget.classList.add('bg-opacity-20');
                
                // Focus back on input
                taskInput.focus();
            }
            
            function handleTaskInputKeypress(e) {
                if (e.key === 'Enter' && taskInput.value.trim() !== '') {
                    addTask(taskInput.value.trim(), currentPriority);
                    taskInput.value = '';
                    currentPriority = null;
                    
                    // Reset priority buttons
                    prioritySelector.querySelectorAll('.priority-btn').forEach(btn => {
                        btn.classList.remove('bg-opacity-20');
                    });
                }
            }
            
            function addTask(text, priority) {
                const newTask = {
                    id: Date.now(),
                    text,
                    completed: false,
                    priority: priority || null,
                    createdAt: new Date().toISOString()
                };
                
                tasks.unshift(newTask);
                saveTasks();
                renderTasks();
                updateEmptyState();
                updateStats();
                
                // Animation
                const taskElement = document.getElementById(`task-${newTask.id}`);
                if (taskElement) {
                    taskElement.classList.add('animate-fade-in');
                }
            }
            
            function renderTasks() {
                taskList.innerHTML = '';
                
                let filteredTasks = tasks;
                if (currentFilter === 'active') {
                    filteredTasks = tasks.filter(task => !task.completed);
                } else if (currentFilter === 'completed') {
                    filteredTasks = tasks.filter(task => task.completed);
                }
                
                if (filteredTasks.length === 0) {
                    updateEmptyState();
                    return;
                }
                
                emptyState.classList.add('hidden');
                
                filteredTasks.forEach((task, index) => {
                    const taskElement = document.createElement('div');
                    taskElement.id = `task-${task.id}`;
                    taskElement.className = `task-item bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between ${task.priority ? `priority-${task.priority}` : ''} animate-slide-up`;
                    taskElement.draggable = true;
                    taskElement.dataset.id = task.id;
                    
                    if (task.completed) {
                        taskElement.classList.add('completed');
                    }
                    
                    taskElement.innerHTML = `
                        <div class="flex items-center flex-1">
                            <span class="drag-handle mr-2 text-gray-400 dark:text-gray-500">
                                <i class="fas fa-grip-vertical"></i>
                            </span>
                            <input type="checkbox" ${task.completed ? 'checked' : ''} class="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3">
                            <span class="flex-1 ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}">${task.text}</span>
                        </div>
                        <div class="flex items-center">
                            ${task.priority ? `<span class="text-xs px-2 py-1 rounded-full mr-2 ${getPriorityBadgeClass(task.priority)}">${getPriorityText(task.priority)}</span>` : ''}
                            <button class="edit-btn p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full">
                                <i class="fas fa-pencil-alt text-sm"></i>
                            </button>
                            <button class="delete-btn p-1 text-gray-400 hover:text-red-500 rounded-full ml-1">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    
                    taskList.appendChild(taskElement);
                    
                    // Add event listeners to the new task
                    const checkbox = taskElement.querySelector('input[type="checkbox"]');
                    const editBtn = taskElement.querySelector('.edit-btn');
                    const deleteBtn = taskElement.querySelector('.delete-btn');
                    const dragHandle = taskElement.querySelector('.drag-handle');
                    
                    checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
                    editBtn.addEventListener('click', () => editTask(task.id));
                    deleteBtn.addEventListener('click', () => deleteTask(task.id));
                    
                    // Drag and drop
                    taskElement.addEventListener('dragstart', handleDragStart);
                    taskElement.addEventListener('dragover', handleDragOver);
                    taskElement.addEventListener('dragleave', handleDragLeave);
                    taskElement.addEventListener('drop', handleDrop);
                    taskElement.addEventListener('dragend', handleDragEnd);
                    
                    dragHandle.addEventListener('mousedown', () => {
                        taskElement.draggable = true;
                    });
                    
                    dragHandle.addEventListener('mouseup', () => {
                        taskElement.draggable = false;
                    });
                });
            }
            
            function handleDragStart(e) {
                draggedItem = this;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.innerHTML);
                this.classList.add('dragging');
            }
            
            function handleDragOver(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                this.classList.add('bg-gray-100', 'dark:bg-gray-700');
            }
            
            function handleDragLeave() {
                this.classList.remove('bg-gray-100', 'dark:bg-gray-700');
            }
            
            function handleDrop(e) {
                e.stopPropagation();
                this.classList.remove('bg-gray-100', 'dark:bg-gray-700');
                
                if (draggedItem !== this) {
                    const draggedId = parseInt(draggedItem.dataset.id);
                    const targetId = parseInt(this.dataset.id);
                    
                    // Find indexes
                    const draggedIndex = tasks.findIndex(task => task.id === draggedId);
                    const targetIndex = tasks.findIndex(task => task.id === targetId);
                    
                    // Reorder tasks array
                    const [removed] = tasks.splice(draggedIndex, 1);
                    tasks.splice(targetIndex, 0, removed);
                    
                    saveTasks();
                    renderTasks();
                }
            }
            
            function handleDragEnd() {
                this.classList.remove('dragging');
                this.draggable = false;
            }
            
            function toggleTaskCompletion(id) {
                const taskIndex = tasks.findIndex(task => task.id === id);
                if (taskIndex !== -1) {
                    tasks[taskIndex].completed = !tasks[taskIndex].completed;
                    saveTasks();
                    renderTasks();
                    updateStats();
                    
                    // Streak logic (simplified)
                    if (tasks[taskIndex].completed) {
                        const streak = parseInt(streakCount.textContent.split(' ')[1]) || 0;
                        streakCount.textContent = `🔥 ${streak + 1}`;
                    }
                }
            }
            
            function editTask(id) {
                const task = tasks.find(task => task.id === id);
                if (!task) return;
                
                const taskElement = document.getElementById(`task-${id}`);
                const textSpan = taskElement.querySelector('span:not(.drag-handle)');
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = task.text;
                input.className = 'flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-dark-800 dark:border-gray-600 dark:text-white';
                
                textSpan.replaceWith(input);
                input.focus();
                
                const handleEdit = (e) => {
                    if (e.key === 'Enter' || e.type === 'blur') {
                        const newText = input.value.trim();
                        if (newText !== '' && newText !== task.text) {
                            task.text = newText;
                            saveTasks();
                            renderTasks();
                        } else {
                            renderTasks();
                        }
                    }
                };
                
                input.addEventListener('keypress', handleEdit);
                input.addEventListener('blur', handleEdit);
            }
            
            function deleteTask(id) {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
                updateEmptyState();
                updateStats();
                
                // Animation
                const taskElement = document.getElementById(`task-${id}`);
                if (taskElement) {
                    taskElement.classList.add('opacity-0', 'transition-opacity', 'duration-300');
                    setTimeout(() => {
                        taskElement.remove();
                        updateEmptyState();
                    }, 300);
                }
            }
            
            function clearCompletedTasks() {
                tasks = tasks.filter(task => !task.completed);
                saveTasks();
                renderTasks();
                updateEmptyState();
                updateStats();
            }
            
            function setFilter(filter) {
                currentFilter = filter;
                
                // Update active filter button
                filterAll.classList.remove('bg-primary-600', 'text-white');
                filterActive.classList.remove('bg-primary-600', 'text-white');
                filterCompleted.classList.remove('bg-primary-600', 'text-white');
                
                filterAll.classList.add('text-gray-600', 'hover:bg-gray-100', 'dark:text-gray-300', 'dark:hover:bg-gray-700');
                filterActive.classList.add('text-gray-600', 'hover:bg-gray-100', 'dark:text-gray-300', 'dark:hover:bg-gray-700');
                filterCompleted.classList.add('text-gray-600', 'hover:bg-gray-100', 'dark:text-gray-300', 'dark:hover:bg-gray-700');
                
                if (filter === 'all') {
                    filterAll.classList.add('bg-primary-600', 'text-white');
                    filterAll.classList.remove('text-gray-600', 'hover:bg-gray-100', 'dark:text-gray-300', 'dark:hover:bg-gray-700');
                } else if (filter === 'active') {
                    filterActive.classList.add('bg-primary-600', 'text-white');
                    filterActive.classList.remove('text-gray-600', 'hover:bg-gray-100', 'dark:text-gray-300', 'dark:hover:bg-gray-700');
                } else if (filter === 'completed') {
                    filterCompleted.classList.add('bg-primary-600', 'text-white');
                    filterCompleted.classList.remove('text-gray-600', 'hover:bg-gray-100', 'dark:text-gray-300', 'dark:hover:bg-gray-700');
                }
                
                renderTasks();
            }
            
            function updateEmptyState() {
                if (currentFilter === 'all' && tasks.length === 0) {
                    emptyState.classList.remove('hidden');
                } else if (currentFilter === 'active' && tasks.filter(task => !task.completed).length === 0) {
                    emptyState.classList.remove('hidden');
                } else if (currentFilter === 'completed' && tasks.filter(task => task.completed).length === 0) {
                    emptyState.classList.remove('hidden');
                } else {
                    emptyState.classList.add('hidden');
                }
            }
            
            function updateStats() {
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(task => task.completed).length;
                stats.textContent = `✓ ${completedTasks}/${totalTasks}`;
            }
            
            function toggleTheme() {
                darkMode = !darkMode;
                localStorage.setItem('darkMode', darkMode);
                
                if (darkMode) {
                    document.documentElement.classList.add('dark');
                    themeToggle.innerHTML = '<i class="fas fa-sun text-yellow-300"></i>';
                } else {
                    document.documentElement.classList.remove('dark');
                    themeToggle.innerHTML = '<i class="fas fa-moon text-gray-600"></i>';
                }
            }
            
            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
            
            function getPriorityText(priority) {
                switch (priority) {
                    case 'high': return 'High';
                    case 'medium': return 'Medium';
                    case 'low': return 'Low';
                    default: return '';
                }
            }
            
            function getPriorityBadgeClass(priority) {
                switch (priority) {
                    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                    default: return '';
                }
            }
        });