// Cache DOM elements
const taskName = $("#taskName");
const taskDate = $("#taskDate");
const taskDescription = $("#taskDescription");
const createTaskButton = $(".create-task");
const msgDiv = $(".msg");

// Retrieve tasks and nextId from localStorage
let taskList = JSON.parse(localStorage.getItem("tasks")) || [];
let nextId = JSON.parse(localStorage.getItem("nextId")) || 1;

// Display a message if there are form errors
function displayMessage(type, message) {
  msgDiv.text(message).addClass(type);
}

// Generate a unique task id
function generateTaskId() {
  return nextId++;
}

// Calculate the difference in days between today and the due date
function calculateDaysDifference(dueDate) {
  return dayjs(dueDate).diff(dayjs(), "day");
}

// Determine background color based on due date proximity and task status
function determineBackgroundColor(daysDifference, taskStatus) {
  if (taskStatus === "done") {
    return "bg-success"; // Task is done
  }

  if (daysDifference < 0) {
    return "bg-danger"; // Task is overdue
  } else if (daysDifference <= 2) {
    return "bg-warning"; // Task is within 2 days
  }

  return "bg-light"; // Default background color
}

// Create a task card
function createTaskCard(task) {
  const daysDifference = calculateDaysDifference(task.dueDate);
  const bgColor = determineBackgroundColor(daysDifference, task.status);

  return `
    <div class="draggable task-card card mb-3 ${bgColor}" data-task-id="${task.id}">
      <div class="card-body">
        <h5 class="card-title">${task.title}</h5>
        <p class="card-text">${task.description}</p>
        <p class="card-text">Due Date: ${task.dueDate}</p>
        <button type="button" class="btn btn-danger delete-task">Delete</button>
      </div>
    </div>
  `;
}

// Render the task list and make cards draggable
function renderTaskList() {
  // Clear the columns of their tasks so that when rerendered there are no duplicates
  $("#todo-cards, #in-progress-cards, #done-cards").empty();

  // Create a task card for each task in the list
  taskList.forEach((task) => {
    const taskCard = createTaskCard(task);
    $(`#${task.status}-cards`).append(taskCard);
  });

  // Attach event listeners for task deletion
  $(".delete-task").on("click", handleDeleteTask);

  // Make the tasks draggable
  $(".draggable").draggable({
    revert: "invalid",
    stack: ".draggable",
  });
}

// Handle adding a new task
function handleAddTask(event) {
  event.preventDefault();

  // Get the values from the form
  const title = taskName.val();
  const description = taskDescription.val();
  const dueDate = taskDate.val();

  // Check to see if any of the inputs are blank
  if (!title || !description || !dueDate) {
    displayMessage("text-danger", "Please fill in all fields.");
    return;
  }

  // Create a task object
  const task = {
    id: generateTaskId(),
    title,
    dueDate,
    description,
    status: "todo",
  };

  // Push the task to the list of tasks and save them to storage
  taskList.push(task);
  localStorage.setItem("tasks", JSON.stringify(taskList));
  localStorage.setItem("nextId", nextId);

  // Hide the modal and reset the form
  $("#formModal").modal("hide");
  taskName.val("");
  taskDescription.val("");
  taskDate.val("");

  renderTaskList();
}

// Handle deleting a task
function handleDeleteTask(event) {
  event.preventDefault();
  event.stopPropagation();

  // Find the task id that is clicked
  const taskId = $(this).closest(".task-card").data("task-id");

  // Filter out the deleted task and update storage
  taskList = taskList.filter((task) => task.id !== taskId);
  localStorage.setItem("tasks", JSON.stringify(taskList));

  renderTaskList();
}

// Handle dropping a task into a new status lane
function handleDrop(event, ui) {
  event.stopPropagation();
  event.preventDefault();

  // Find the column the task is in and the id of the task
  const laneId = $(this).attr("id");
  const cardId = ui.draggable.data("task-id");

  // Determine the new status based on the dropped column
  const newStatus = laneId.replace("-cards", "");

  // Find the task and set the new status for the task
  const taskIndex = taskList.findIndex((task) => task.id === cardId);
  if (taskIndex !== -1) {
    taskList[taskIndex].status = newStatus;
    localStorage.setItem("tasks", JSON.stringify(taskList));
  }

  // Detach this task from the column it was in and append it to the one it was dropped in
  ui.draggable.detach().appendTo($(this));

  renderTaskList();
}

// Initialize the app
$(document).ready(function () {
  renderTaskList();

  createTaskButton.on("click", handleAddTask);

  // Initialize datepicker
  $("#taskDate").datepicker({
    changeMonth: true,
    changeYear: true,
  });

  // Make lanes droppable
  $(".droppable").droppable({
    accept: ".draggable",
    drop: handleDrop,
  });
});
