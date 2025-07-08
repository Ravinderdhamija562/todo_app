// Define the base URL for your Flask API
const API_URL = 'http://127.0.0.1:5000/todos'; // Your Flask backend API endpoint

// Get references to DOM elements
const todoList = document.getElementById('todo-list');
const todoTitleInput = document.getElementById('todo-title');
const todoDescriptionInput = document.getElementById('todo-description');
const addTodoBtn = document.getElementById('add-todo-btn');
// You might add a dedicated element for displaying messages/errors here later, e.g.:
// const messageDisplay = document.getElementById('message-display');

// --- Helper Functions (for future enhancements) ---

// Function to display messages/errors to the user (Placeholder for Task 14: Error Handling)
function displayMessage(message, type = 'error') {
    // For now, we'll use alert. In Task 14, you might update a dedicated div element
    // on the page to show these messages more smoothly.
    alert(`${type.toUpperCase()}: ${message}`);
    console.log(`${type.toUpperCase()} Message:`, message);
}

// --- Functions to interact with the Backend API (CRUD Operations) ---

// Function to fetch and display all todos (READ operation)
async function fetchTodos() {
    try {
        // Clear existing list items and show a loading message
        todoList.innerHTML = '<li>Loading todos...</li>';

        const response = await fetch(API_URL);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || response.statusText}`);
        }

        const todos = await response.json();

        // Clear the loading message
        todoList.innerHTML = '';

        if (todos.length === 0) {
            todoList.innerHTML = '<li>No todos yet. Add one!</li>';
            return;
        }

        // Loop through the todos and add them to the list
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item'; // For styling
            li.dataset.id = todo._id; // Store the todo's unique ID

            let todoText = `${todo.title}`;
            if (todo.description) {
                todoText += `: ${todo.description}`;
            }

            // Create the inner HTML for each todo item, including buttons
            li.innerHTML = `
                <span class="todo-title ${todo.completed ? 'completed' : ''}">${todoText}</span>
                <div class="actions">
                    <button class="toggle-complete-btn">${todo.completed ? 'Unmark' : 'Mark Complete'}</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;
            todoList.appendChild(li);
        });

    } catch (error) {
        console.error('Error fetching todos:', error);
        displayMessage(`Error loading todos: ${error.message}. Please ensure your backend is running.`, 'error');
    }
}

// Function to add a new todo (CREATE operation)
async function addTodo() {
    const title = todoTitleInput.value.trim();
    const description = todoDescriptionInput.value.trim();

    // Task 15: Basic Validation - More robust validation can go here.
    // E.g., check title length, disallow special characters, etc.
    if (!title) {
        displayMessage('Todo title cannot be empty!', 'warning');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                description: description
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || response.statusText}`);
        }

        const newTodo = await response.json();
        console.log('Todo added:', newTodo);
        displayMessage('Todo added successfully!', 'success'); // Example success message

        // Clear input fields
        todoTitleInput.value = '';
        todoDescriptionInput.value = '';

        // Refresh the list to show the new todo
        fetchTodos();

    } catch (error) {
        console.error('Error adding todo:', error);
        displayMessage(`Failed to add todo: ${error.message}`, 'error');
    }
}

// Function to toggle todo completion status (UPDATE operation)
async function toggleTodoComplete(todoId, currentCompletedStatus, todoTitleSpan, toggleButton) {
    const newCompletedStatus = !currentCompletedStatus; // Toggle the status

    try {
        const response = await fetch(`${API_URL}/${todoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: newCompletedStatus }), // Send only the 'completed' field
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || response.statusText}`);
        }

        // Update UI immediately for a smoother user experience
        if (newCompletedStatus) {
            todoTitleSpan.classList.add('completed');
            toggleButton.textContent = 'Unmark';
        } else {
            todoTitleSpan.classList.remove('completed');
            toggleButton.textContent = 'Mark Complete';
        }
        console.log(`Todo ${todoId} updated to completed: ${newCompletedStatus}`);

    } catch (error) {
        console.error('Error updating todo:', error);
        displayMessage(`Failed to update todo: ${error.message}`, 'error');
    }
}

// Function to delete a todo (DELETE operation)
async function deleteTodo(todoId) {
    if (!confirm('Are you sure you want to delete this todo?')) {
        return; // User cancelled
    }

    try {
        const response = await fetch(`${API_URL}/${todoId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || response.statusText}`);
        }

        console.log(`Todo ${todoId} deleted.`);
        displayMessage('Todo deleted successfully!', 'success');

        // Remove the todo item from the UI immediately
        const listItemToRemove = document.querySelector(`li[data-id="${todoId}"]`);
        if (listItemToRemove) {
            listItemToRemove.remove();
        }

        // Re-fetch all todos to update the list if it becomes empty
        if (todoList.children.length === 0 || todoList.children[0].textContent === 'No todos yet. Add one!') {
            fetchTodos(); // This handles the case of clearing the list if it becomes empty
        }

    } catch (error) {
        console.error('Error deleting todo:', error);
        displayMessage(`Failed to delete todo: ${error.message}`, 'error');
    }
}


// --- Event Listeners ---

// Listen for clicks on the "Add Todo" button
addTodoBtn.addEventListener('click', addTodo);

// Allow adding todo by pressing Enter in the description field (optional)
todoDescriptionInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTodo();
    }
});

// Use event delegation on the parent todoList to handle clicks on dynamically created buttons
todoList.addEventListener('click', async (event) => {
    const target = event.target;
    const listItem = target.closest('.todo-item'); // Find the parent <li> element

    // Ensure a todo item (and thus its ID) is associated with the click
    if (!listItem) return;

    const todoId = listItem.dataset.id; // Get the todo's ID from the data-id attribute

    // Handle 'Mark Complete' / 'Unmark' button click
    if (target.classList.contains('toggle-complete-btn')) {
        const todoTitleSpan = listItem.querySelector('.todo-title');
        const currentCompletedStatus = todoTitleSpan.classList.contains('completed');
        toggleTodoComplete(todoId, currentCompletedStatus, todoTitleSpan, target);
    }

    // Handle 'Delete' button click
    if (target.classList.contains('delete-btn')) {
        deleteTodo(todoId);
    }
});


// --- Initial Load ---

// Fetch and display todos when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchTodos);