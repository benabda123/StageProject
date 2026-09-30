const authServiceClient = require('./httpClients/authServiceClient');
const taskServiceClient = require('./httpClients/taskServiceClient');
const meetingServiceClient = require('./httpClients/meetingServiceClient');

async function aggregateData(departmentId = null) {
  // 1. Fetch employees and departments
  const employees = await authServiceClient.getEmployees();
  let departments = [];
  try {
    departments = await authServiceClient.getDepartments();
  } catch (err) {
    console.warn('Impossible de récupérer les départements, suite sans eux:', err.message);
  }

  // 2. Fetch all tasks
  const tasks = await taskServiceClient.getTasks();

  // 3. Process tasks and calculate daysOverdue
  const now = new Date();
  const overdueTasks = [];
  const allTasksSummary = [];

  for (const task of tasks) {
    let daysOverdue = 0;
    if (task.dueDate && (task.status === 'IN_PROGRESS' || task.status === 'TODO')) {
      const due = new Date(task.dueDate);
      if (!isNaN(due.getTime()) && due < now) {
        const diffMs = now.getTime() - due.getTime();
        daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (daysOverdue > 0) {
          overdueTasks.push({
            title: task.title,
            employeeUsername: task.employeeUsername,
            employeeId: task.employeeId,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            daysOverdue
          });
        }
      }
    }

    allTasksSummary.push({
      title: task.title,
      employeeUsername: task.employeeUsername,
      employeeId: task.employeeId,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
    });
  }

  // 4. Employee details with department matching
  const employeeList = employees.map(e => ({
    id: e.id,
    username: e.username,
    fullName: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.username,
    departmentId: e.attributes?.departmentId ? (Array.isArray(e.attributes.departmentId) ? e.attributes.departmentId[0] : e.attributes.departmentId) : null,
    position: e.attributes?.position ? (Array.isArray(e.attributes.position) ? e.attributes.position[0] : e.attributes.position) : null
  }));

  // 5. Fetch confirmed meetings for all employees
  const employeeIds = employeeList.map(e => e.id);
  let existingMeetings = [];
  try {
    existingMeetings = await meetingServiceClient.getMeetings(employeeIds);
  } catch (err) {
    console.warn('Impossible de récupérer les réunions existantes:', err.message);
  }

  return {
    todayDate: now.toISOString().split('T')[0],
    targetDepartmentId: departmentId || null,
    departments: departments.map(d => ({ id: d.id, name: d.name })),
    employees: employeeList,
    overdueTasks,
    allTasksSummary,
    existingMeetings
  };
}

module.exports = { aggregateData };
