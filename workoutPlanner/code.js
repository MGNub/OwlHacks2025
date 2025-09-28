document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let currentDate = new Date();
    let workoutLists = {};
    let weeklySchedule = {};

    // --- DOM ELEMENTS ---
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarTitle = document.getElementById('calendar-title');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const createListBtn = document.getElementById('create-new-list');
    const workoutListsContainer = document.getElementById('workout-lists-container');
    const presetBtns = document.querySelectorAll('.use-preset-btn');
    const workoutModal = document.getElementById('workoutModal');
    const closeBtn = document.querySelector('.close-btn');
    const modalWorkoutTitle = document.getElementById('modalWorkoutTitle');
    const modalExerciseList = document.getElementById('modalExerciseList');
    // --- DATA PERSISTENCE (LocalStorage) ---
    const saveData = () => {
        localStorage.setItem('workoutLists', JSON.stringify(workoutLists));
        localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
    };

    const loadData = () => {
        const storedLists = localStorage.getItem('workoutLists');
        const storedSchedule = localStorage.getItem('weeklySchedule');
        
        if (storedLists) {
            workoutLists = JSON.parse(storedLists);
        } else {
            // Default data for new users
            workoutLists = {
                "Push Day": ["Bench Press (3x8)", "Overhead Press (3x10)", "Tricep Pushdowns (3x15)"],
                "Leg Day": ["Barbell Squats (4x6)", "Romanian Deadlifts (3x10)", "Calf Raises (4x20)"],
            };
        }

        if (storedSchedule) {
            weeklySchedule = JSON.parse(storedSchedule);
        }
    };

    // --- RENDER FUNCTIONS ---
    const renderCalendar = () => {
        calendarGrid.innerHTML = '';
        const weekStart = getWeekStart(currentDate);
        
        const startDate = new Date(weekStart);
        const endDate = new Date(weekStart);
        endDate.setDate(endDate.getDate() + 6);

        calendarTitle.innerHTML = `Week of ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);

            const dayKey = day.toISOString().split('T')[0]; // YYYY-MM-DD
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            dayDiv.dataset.date = dayKey;

            dayDiv.innerHTML = `<h3>${day.toLocaleDateString('en-US', { weekday: 'long' })}</h3>`;
            
            if (weeklySchedule[dayKey]) {
                const workoutName = weeklySchedule[dayKey];
                const workoutItem = document.createElement('div');
                workoutItem.classList.add('workout-item');
                //workoutItem.textContent = workoutName;
                workoutItem.innerHTML = workoutName + `<button class="remove-exercise-btn removeWorkout" data-list-name="${workoutName}" >&times;</button>`;
                workoutItem.draggable = true;
                workoutItem.dataset.workoutName = workoutName;
                workoutItem.dataset.originalDate = dayKey;
                dayDiv.appendChild(workoutItem);
                workoutItem.addEventListener('click', (e) => {
                    // Prevent modal from showing if the 'remove' button was clicked
                    if (!e.target.classList.contains('removeWorkout')) {
                        showWorkoutDetails(workoutName);
                    }
                });
            } else {
                dayDiv.innerHTML += `<div class="rest-day">Rest Day</div>`;
            }

            // Drag and Drop Event Listeners
            dayDiv.addEventListener('dragover', e => {
                e.preventDefault();
                dayDiv.classList.add('drag-over');
            });
            dayDiv.addEventListener('dragleave', () => dayDiv.classList.remove('drag-over'));
            dayDiv.addEventListener('drop', e => {
                e.preventDefault();
                dayDiv.classList.remove('drag-over');
                const droppedWorkoutName = e.dataTransfer.getData('text/plain');
                const originalDate = e.dataTransfer.getData('originalDate');
                const newDate = dayDiv.dataset.date;

                // Update schedule
                if (originalDate) {
                    delete weeklySchedule[originalDate];
                }
                weeklySchedule[newDate] = droppedWorkoutName;

                saveData();
                renderAll();
            });

            calendarGrid.appendChild(dayDiv);
        }
        addWorkoutItemDragListeners();
    };

    const renderWorkoutLists = () => {
        workoutListsContainer.innerHTML = '';
        for (const listName in workoutLists) {
            const card = document.createElement('div');
            card.classList.add('workout-list-card');
            
            let exercisesHTML = workoutLists[listName].map((ex, index) => 
                `<li>${ex} <button class="remove-exercise-btn" data-list-name="${listName}" data-exercise-index="${index}">&times;</button></li>`
            ).join('');

            card.innerHTML = `
                <h3>${listName}</h3>
                <ul>${exercisesHTML}</ul>
                <div class="add-exercise-form">
                    <input type="text" placeholder="e.g., Push-ups (3x15)">
                    <button class="button-secondary add-exercise-btn" data-list-name="${listName}">Add</button>
                </div>
                <div class="actions">
                    <select class="days" name="days">
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                    </select>
                    <button class="schedule-workout-btn" data-list-name="${listName}">Schedule</button>
                    <button class="button-danger delete-list-btn" data-list-name="${listName}">Delete List</button>
                </div>
            `;
            workoutListsContainer.appendChild(card);
        }
        for (let i = 0; i < document.querySelectorAll(".schedule-workout-btn").length; i++) {
            console.log("poop");
            document.querySelectorAll(".schedule-workout-btn")[i].dataset.listIndex = i;
        }
    };

    const renderAll = () => {
        renderCalendar();
        renderWorkoutLists();
    };

    // --- HELPER FUNCTIONS ---
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday start
        return new Date(d.setDate(diff));
    };

    // NEW: Function to show workout details in a modal
    const showWorkoutDetails = (workoutName) => {
        const exercises = workoutLists[workoutName];
        
        if (!exercises) {
            alert(`Details for workout "${workoutName}" not found.`);
            return;
        }

        modalWorkoutTitle.textContent = workoutName;
        modalExerciseList.innerHTML = ''; // Clear previous list

        exercises.forEach(ex => {
            const listItem = document.createElement('li');
            listItem.textContent = ex;
            modalExerciseList.appendChild(listItem);
        });

        workoutModal.style.display = 'block';
    };

    // --- EVENT HANDLERS ---
    const handleListActions = (e) => {
        const target = e.target;
        const listName = target.dataset.listName;

        // Add Exercise
        if (target.classList.contains('add-exercise-btn')) {
            const input = target.previousElementSibling;
            const exerciseText = input.value.trim();
            if (exerciseText && listName) {
                workoutLists[listName].push(exerciseText);
                input.value = '';
                saveData();
                renderAll();
            }
        }
        // Remove Exercise
        if (target.classList.contains('remove-exercise-btn')) {
            const exerciseIndex = parseInt(target.dataset.exerciseIndex, 10);
            if (listName && !isNaN(exerciseIndex)) {
                workoutLists[listName].splice(exerciseIndex, 1);
                saveData();
                renderAll();
            }
        }
        // Delete List
        if (target.classList.contains('delete-list-btn')) {
            if (listName && confirm(`Are you sure you want to delete the "${listName}" list?`)) {
                delete workoutLists[listName];
                saveData();
                renderAll();
            }
        }
        // Schedule Workout
        if (target.classList.contains('schedule-workout-btn')) {
            const day = document.querySelectorAll(".days")[target.dataset.listIndex].value;
            if (day) {
                const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day.toLowerCase());
                if (dayIndex !== -1) {
                    const weekStart = getWeekStart(currentDate);
                    const targetDate = new Date(weekStart);
                    // Adjust for week start on Monday
                    const adjustedDayIndex = (dayIndex === 0) ? 6 : dayIndex - 1;
                    targetDate.setDate(targetDate.getDate() + adjustedDayIndex);
                    
                    const dateKey = targetDate.toISOString().split('T')[0];
                    weeklySchedule[dateKey] = listName;
                    saveData();
                    renderCalendar();
                } else {
                    alert("Invalid day. Please enter a full day name (e.g., 'Monday').");
                }
            }
        }
    };
    
    calendarGrid.addEventListener('click', (e) => {
    // 1. Check if the clicked element is the 'removeWorkout' button
        if (e.target.classList.contains('removeWorkout')) {
            const workoutItem = e.target.closest('.workout-item');
            const dayDiv = workoutItem.closest('.calendar-day');
        
        // 2. Get the date key (YYYY-MM-DD)
            const dayKey = dayDiv.dataset.date;

            if (dayKey && weeklySchedule[dayKey]) {
            // 3. Delete the workout from the weekly schedule
                delete weeklySchedule[dayKey];
            
            // 4. Save and re-render
                saveData();
                renderCalendar();
                }
            }
        });

    const addWorkoutItemDragListeners = () => {
        document.querySelectorAll('.workout-item').forEach(item => {
            item.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', e.target.dataset.workoutName);
                e.dataTransfer.setData('originalDate', e.target.dataset.originalDate);
            });
        });
    };

    // --- INITIALIZATION ---
    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderCalendar();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderCalendar();
    });
    
    createListBtn.addEventListener('click', () => {
        const newListName = prompt("Enter a name for your new workout list:");
        if (newListName && newListName.trim() !== "") {
            if (workoutLists[newListName]) {
                alert("A list with this name already exists.");
                return;
            }
            workoutLists[newListName] = [];
            saveData();
            renderAll();
        }
    });

    workoutListsContainer.addEventListener('click', handleListActions);
    
    presetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.preset-card');
            const title = card.querySelector('h4').textContent.split(': ')[1];
            const dataDiv = card.querySelector('.preset-data');
            
            if (workoutLists[title]) {
                alert(`You already have a list named "${title}". Please rename it to add this preset.`);
                return;
            }

            const exercises = dataDiv.innerHTML.split('<br>').map(item => item.replace(/<strong>.*?<\/strong>/, '').trim()).filter(Boolean);
            workoutLists[title] = exercises;
            saveData();
            renderAll();
            alert(`"${title}" has been added to your custom workout lists!`);
        });
    });

    closeBtn.addEventListener('click', () => {
        workoutModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === workoutModal) {
            workoutModal.style.display = 'none';
        }
    });

    // Initial Load
    loadData();
    renderAll();
});