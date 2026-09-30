import { Routes, Route } from 'react-router-dom';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import EditEmployeeForm from './components/EditEmployeeForm';
import DepartmentList from './components/DepartmentList';
import FrontHome from './components/FrontHome';
import MyLeaves from './components/MyLeaves';
import NewLeaveRequest from './components/NewLeaveRequest';
import LeaveRequestsAdmin from './components/LeaveRequestsAdmin';
import TaskKanban from './components/TaskKanban';
import TaskManagement from './components/TaskManagement';
import NewTaskForm from './components/NewTaskForm';
import MeetingCalendar from './components/MeetingCalendar';
import NewMeetingRequest from './components/NewMeetingRequest';
import MeetingRequestsAdmin from './components/MeetingRequestsAdmin';
import RoomManagement from './components/RoomManagement';
import BroadcastAnnouncement from './components/BroadcastAnnouncement';
import AdminSupportChat from './components/AdminSupportChat';
import DashboardStats from './components/DashboardStats';
import LearningHome from './components/LearningHome';
import LearningResults from './components/LearningResults';
import MyFavorites from './components/MyFavorites';
import MyTickets from './components/MyTickets';
import NewTicketForm from './components/NewTicketForm';
import TicketDetail from './components/TicketDetail';
import TicketManagement from './components/TicketManagement';
import AttendanceDashboard from './components/AttendanceDashboard';
import AttendanceWidget from './components/AttendanceWidget';
import AnomalyDashboard from './components/AnomalyDashboard';
import PollManagement from './components/PollManagement';
import MyPolls from './components/MyPolls';
import AccessDenied from './components/AccessDenied';
import BackOfficeLayout from './layouts/BackOfficeLayout';
import FrontOfficeLayout from './layouts/FrontOfficeLayout';

function App({ userRole }) {
  // Back Office pour admin, hr, itsupport et manager
  if (['admin', 'manager', 'hr', 'itsupport'].includes(userRole)) {
    return (
      <Routes>
        <Route path="/" element={<BackOfficeLayout userRole={userRole} />}>
          {/* --- Admin routes --- */}
          {userRole === 'admin' && (
            <>
              <Route index element={<EmployeeList />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="add-employee" element={<EmployeeForm />} />
              <Route path="edit-employee/:id" element={<EditEmployeeForm />} />
              <Route path="departments" element={<DepartmentList />} />
              <Route path="statistics" element={<DashboardStats />} />
              <Route path="attendance" element={<AttendanceDashboard />} />
              <Route path="anomalies" element={<AnomalyDashboard />} />
              <Route path="polls" element={<PollManagement />} />
              <Route path="leave-requests" element={<LeaveRequestsAdmin />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="add-task" element={<NewTaskForm />} />
              <Route path="edit-task/:id" element={<NewTaskForm />} />
              <Route path="meeting-requests" element={<MeetingRequestsAdmin />} />
              <Route path="new-meeting" element={<NewMeetingRequest />} />
              <Route path="rooms" element={<RoomManagement />} />
              <Route path="broadcast-announcement" element={<BroadcastAnnouncement />} />
              <Route path="support-chat" element={<AdminSupportChat />} />
              <Route path="learning" element={<LearningHome />} />
              <Route path="learning/results" element={<LearningResults />} />
              <Route path="learning/favorites" element={<MyFavorites />} />
            </>
          )}

          {/* --- Manager routes --- */}
          {userRole === 'manager' && (
            <>
              <Route index element={<TaskManagement />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="add-task" element={<NewTaskForm />} />
              <Route path="edit-task/:id" element={<NewTaskForm />} />
              <Route path="meeting-requests" element={<MeetingRequestsAdmin />} />
              <Route path="new-meeting" element={<NewMeetingRequest />} />
              <Route path="rooms" element={<RoomManagement />} />
              <Route path="attendance" element={<AttendanceDashboard />} />
              <Route path="anomalies" element={<AnomalyDashboard />} />
              <Route path="polls" element={<PollManagement />} />
              <Route path="learning" element={<LearningHome />} />
              <Route path="learning/results" element={<LearningResults />} />
              <Route path="learning/favorites" element={<MyFavorites />} />
            </>
          )}

          {/* --- HR routes --- */}
          {userRole === 'hr' && (
            <>
              <Route index element={<EmployeeList />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="add-employee" element={<EmployeeForm />} />
              <Route path="edit-employee/:id" element={<EditEmployeeForm />} />
              <Route path="leave-requests" element={<LeaveRequestsAdmin />} />
              <Route path="attendance" element={<AttendanceDashboard />} />
              <Route path="learning" element={<LearningHome />} />
              <Route path="learning/results" element={<LearningResults />} />
              <Route path="learning/favorites" element={<MyFavorites />} />
            </>
          )}

          {/* --- IT Support routes --- */}
          {userRole === 'itsupport' && (
            <>
              <Route index element={<TicketManagement />} />
              <Route path="tickets" element={<TicketManagement />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
            </>
          )}

          {/* Catch-all: access denied for undefined routes */}
          <Route path="*" element={<AccessDenied userRole={userRole} />} />
        </Route>
      </Routes>
    );
  }

  // Front Office pour employee
  return (
    <Routes>
      <Route path="/" element={<FrontOfficeLayout />}>
        <Route index element={<FrontHome />} />
        <Route path="my-leaves" element={<MyLeaves />} />
        <Route path="attendance" element={<AttendanceWidget />} />
        <Route path="my-tasks" element={<TaskKanban />} />
        <Route path="new-leave" element={<NewLeaveRequest />} />
        <Route path="meetings" element={<MeetingCalendar />} />
        <Route path="new-meeting" element={<NewMeetingRequest />} />
        <Route path="polls" element={<MyPolls />} />
        <Route path="learning" element={<LearningHome />} />
        <Route path="learning/results" element={<LearningResults />} />
        <Route path="learning/favorites" element={<MyFavorites />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="new-ticket" element={<NewTicketForm />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
